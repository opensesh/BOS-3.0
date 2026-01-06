#!/usr/bin/env node

/**
 * BOS MCP Bridge - Local MCP Server for Claude Desktop
 * 
 * This script creates a local stdio-based MCP server that bridges
 * JSON-RPC requests to the BOS MCP HTTP endpoint.
 * 
 * The server stays alive indefinitely, waiting for requests from Claude Desktop.
 */

const BOS_MCP_URL = process.env.BOS_MCP_URL || 'https://bos-3-0.vercel.app/api/mcp';
const BOS_API_KEY = process.env.BOS_API_KEY;

if (!BOS_API_KEY) {
  process.stderr.write('Error: BOS_API_KEY environment variable is required\n');
  process.exit(1);
}

// Handle process signals gracefully
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
process.on('SIGHUP', () => process.exit(0));

// Prevent exit on uncaught errors
process.on('uncaughtException', (err) => {
  process.stderr.write(`Uncaught error: ${err.message}\n${err.stack}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Unhandled rejection: ${reason}\n`);
});

// Buffer for accumulating input
let inputBuffer = '';

// Read from stdin - keep the process alive
process.stdin.setEncoding('utf8');
process.stdin.resume();

// Keep the event loop alive with a timer
setInterval(() => {}, 1000 * 60 * 60); // 1 hour interval, just to keep alive

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    inputBuffer += chunk;
    processBuffer();
  }
});

process.stdin.on('end', () => {
  // Claude closed stdin, exit gracefully
  process.stderr.write('stdin closed, exiting\n');
  process.exit(0);
});

process.stdin.on('error', (err) => {
  process.stderr.write(`stdin error: ${err.message}\n`);
  process.exit(1);
});

function processBuffer() {
  // Process complete lines (JSON-RPC uses newline-delimited JSON)
  const lines = inputBuffer.split('\n');
  inputBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const request = JSON.parse(line);
      handleRequest(request);
    } catch (e) {
      process.stderr.write(`Parse error for line: ${line}\nError: ${e.message}\n`);
    }
  }
}

async function handleRequest(request) {
  const { id } = request;
  
  try {
    // Forward to BOS MCP endpoint
    const response = await fetch(BOS_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BOS_API_KEY}`,
      },
      body: JSON.stringify(request),
    });
    
    const data = await response.json();
    
    // Write response as newline-delimited JSON to stdout
    const output = JSON.stringify(data) + '\n';
    process.stdout.write(output);
    
  } catch (error) {
    process.stderr.write(`Request error: ${error.message}\n`);
    
    // Only send error response if there was an id (not for notifications)
    if (id !== undefined) {
      const errorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
        id: id,
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
}

// Log startup to stderr (for debugging)
process.stderr.write(`BOS MCP Bridge started\n`);
process.stderr.write(`URL: ${BOS_MCP_URL}\n`);
process.stderr.write(`API Key: ${BOS_API_KEY ? BOS_API_KEY.substring(0, 12) + '...' : 'NOT SET'}\n`);
