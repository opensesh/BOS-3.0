/**
 * Tool Definitions for Claude
 * 
 * This module defines all available tools that Claude can use.
 * Tools are defined using Anthropic's tool format and can be executed server-side.
 */

import type Anthropic from '@anthropic-ai/sdk';

// ============================================
// TOOL TYPE DEFINITIONS
// ============================================

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolExecutionContext {
  messageId?: string;
  chatId?: string;
  userId?: string;
}

export type ToolExecutor = (
  input: Record<string, unknown>,
  context: ToolExecutionContext
) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ============================================
// TOOL DEFINITIONS
// ============================================

/**
 * Web Search Tool
 * Searches the web for current information
 */
export const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for current information, news, or facts. Use this when you need up-to-date information that might not be in your training data.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5)',
      },
    },
    required: ['query'],
  },
};

/**
 * Calculator Tool
 * Performs mathematical calculations
 */
export const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, and common math functions.',
  input_schema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "15% of 200")',
      },
    },
    required: ['expression'],
  },
};

/**
 * Code Execution Tool
 * Executes Python code in a sandboxed environment
 */
export const codeExecutionTool: ToolDefinition = {
  name: 'execute_code',
  description: 'Execute Python code in a sandboxed environment. Use this for data analysis, calculations, or generating visualizations. Returns the output and any generated files.',
  input_schema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Python code to execute',
      },
      timeout_seconds: {
        type: 'number',
        description: 'Maximum execution time in seconds (default: 30)',
      },
    },
    required: ['code'],
  },
};

/**
 * File Read Tool
 * Reads content from uploaded files
 */
export const fileReadTool: ToolDefinition = {
  name: 'read_file',
  description: 'Read the contents of an uploaded file. Supports text files, PDFs, and code files.',
  input_schema: {
    type: 'object',
    properties: {
      file_id: {
        type: 'string',
        description: 'The ID of the file to read',
      },
    },
    required: ['file_id'],
  },
};

/**
 * Get Current Time Tool
 * Returns the current date and time
 */
export const getCurrentTimeTool: ToolDefinition = {
  name: 'get_current_time',
  description: 'Get the current date and time. Use this when you need to know what time it is or calculate time differences.',
  input_schema: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'Timezone to use (e.g., "America/New_York", "UTC"). Default is UTC.',
      },
    },
    required: [],
  },
};

/**
 * Create Artifact Tool
 * Creates a code artifact that can be displayed and edited
 */
export const createArtifactTool: ToolDefinition = {
  name: 'create_artifact',
  description: 'Create a code artifact, diagram, or document that can be displayed, edited, and downloaded by the user.',
  input_schema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['code', 'diagram', 'document', 'html', 'svg', 'markdown', 'json', 'csv'],
        description: 'The type of artifact to create',
      },
      title: {
        type: 'string',
        description: 'Title for the artifact',
      },
      content: {
        type: 'string',
        description: 'The content of the artifact',
      },
      language: {
        type: 'string',
        description: 'Programming language (for code artifacts)',
      },
    },
    required: ['type', 'content'],
  },
};

/**
 * Brand Knowledge Tool
 * Searches the brand knowledge base
 */
export const brandKnowledgeTool: ToolDefinition = {
  name: 'search_brand_knowledge',
  description: 'Search the brand knowledge base for guidelines, assets, voice & tone, and other brand-related information.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query for brand information',
      },
      category: {
        type: 'string',
        enum: ['guidelines', 'assets', 'voice', 'colors', 'typography', 'all'],
        description: 'Category to search within (default: all)',
      },
    },
    required: ['query'],
  },
};

// ============================================
// ALL TOOLS
// ============================================

export const ALL_TOOLS: ToolDefinition[] = [
  webSearchTool,
  calculatorTool,
  codeExecutionTool,
  fileReadTool,
  getCurrentTimeTool,
  createArtifactTool,
  brandKnowledgeTool,
];

/**
 * Get tools formatted for Anthropic API
 */
export function getToolsForAnthropic(): Anthropic.Messages.Tool[] {
  return ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as Anthropic.Messages.Tool.InputSchema,
  }));
}

/**
 * Get a subset of tools by name
 */
export function getToolsByName(names: string[]): ToolDefinition[] {
  return ALL_TOOLS.filter((tool) => names.includes(tool.name));
}

/**
 * Get default tools for a chat session
 */
export function getDefaultTools(): ToolDefinition[] {
  return [
    webSearchTool,
    calculatorTool,
    getCurrentTimeTool,
    createArtifactTool,
    brandKnowledgeTool,
  ];
}



