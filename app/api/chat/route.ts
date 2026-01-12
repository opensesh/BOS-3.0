import { 
  ModelId, 
  models,
  getAnthropicClient,
  getAnthropicModelId,
  getPerplexityModelId,
  supportsExtendedThinking,
  supportsToolUse,
  isAnthropicModel,
  isPerplexityModel,
  DEFAULT_THINKING_BUDGET,
} from '@/lib/ai/providers';
import { autoSelectModel } from '@/lib/ai/auto-router';
import { buildBrandSystemPrompt, shouldIncludeFullDocs, BRAND_SOURCES, type PageContext, type SkillContext } from '@/lib/brand-knowledge';
import { getSkillIdForQuickAction } from '@/lib/quick-actions/skill-loader';
import { loadSkillContent } from '@/lib/quick-actions/skill-loader-server';
import { retrieveBrandVoice, formatVoiceForSystemPrompt, type VoiceRetrievalOptions } from '@/lib/quick-actions/brand-voice';
import { getToolsForAnthropic, getServerTools } from '@/lib/ai/tools';
import { executeTool } from '@/lib/ai/tools/executors';
import { getAvailableMcpTools, mcpToolsToAnthropic } from '@/lib/ai/tools/mcp-executor';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120; // Allow streaming responses up to 120 seconds for extended thinking

// ============================================
// TYPE DEFINITIONS
// ============================================

// Connector settings from client
interface ConnectorSettings {
  web: boolean;
  brand: boolean;
  brain: boolean;
  discover: boolean;
}

// Chat options from client
interface ChatOptions {
  enableThinking?: boolean;
  thinkingBudget?: number;
  enableTools?: boolean;
  writingStyle?: string | null;
}

// Interface for file attachments from client
interface FileAttachment {
  type: 'image';
  data: string; // Base64 data URL
  mimeType: string;
}

// Message type from client
interface ClientMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
  files?: FileAttachment[];
  experimental_attachments?: FileAttachment[];
}

// Source info for citations
interface SourceData {
  id: string;
  name: string;
  url: string;
  title?: string;
  snippet?: string;
  favicon?: string;
  type?: 'external' | 'brand-doc' | 'asset' | 'discover';
}

// Streaming response data for extended features
interface StreamChunk {
  type: 'thinking' | 'text' | 'tool_use' | 'tool_result' | 'sources' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  thinkingSignature?: string;
  error?: string;
  sources?: SourceData[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Fetch article content from pre-generated JSON files
async function fetchArticleContent(slug: string): Promise<{ summary: string; sections: string[] } | null> {
  try {
    const articlePath = join(process.cwd(), 'public', 'data', 'discover', 'articles', `${slug}.json`);
    const data = await readFile(articlePath, 'utf-8');
    const article = JSON.parse(data);
    
    const paragraphs: string[] = [];
    const sectionTitles: string[] = [];
    
    for (const section of article.sections || []) {
      if (section.title) {
        sectionTitles.push(section.title);
      }
      for (const para of section.paragraphs || []) {
        if (para.content) {
          paragraphs.push(para.content);
        }
      }
    }
    
    const summary = paragraphs.slice(0, 5).join('\n\n');
    
    return { summary, sections: sectionTitles };
  } catch (error) {
    console.error('Failed to fetch article content:', slug, error);
    return null;
  }
}

// Process messages to handle image attachments
function processMessagesWithImages(messages: ClientMessage[]): ClientMessage[] {
  return messages.map(msg => {
    const imageFiles = msg.experimental_attachments || msg.files;

    if (msg.role === 'user' && imageFiles && imageFiles.length > 0) {
      console.log('[Image Processing] Found attachments:', {
        count: imageFiles.length,
        types: imageFiles.map(f => f.type),
        hasData: imageFiles.map(f => !!f.data),
        dataPrefixes: imageFiles.map(f => f.data?.substring(0, 50)),
      });

      const parts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

      const textContent = typeof msg.content === 'string'
        ? msg.content
        : msg.parts
          ? msg.parts.filter(p => p.type === 'text').map(p => p.text || '').join('\n')
          : '';

      if (textContent) {
        parts.push({ type: 'text', text: textContent });
      }

      for (const file of imageFiles) {
        if (file.type === 'image' && file.data) {
          console.log('[Image Processing] Adding image part, mimeType:', file.mimeType);
          parts.push({ type: 'image', image: file.data });
        }
      }

      console.log('[Image Processing] Final parts:', parts.map(p => p.type));

      if (parts.length > 0) {
        return {
          ...msg,
          content: parts as unknown as string,
          files: undefined,
          experimental_attachments: undefined,
        };
      }
    }

    return msg;
  });
}

// Check if required API key is available for a model
function hasRequiredApiKey(modelId: ModelId): { valid: boolean; error?: string } {
  const model = models[modelId];
  if (!model) {
    return { valid: false, error: `Unknown model: ${modelId}` };
  }

  const provider = model.provider;
  
  if (provider === 'anthropic' || provider === 'auto') {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return { valid: false, error: 'ANTHROPIC_API_KEY is not configured.' };
    }
  }
  
  if (provider === 'perplexity') {
    const apiKey = process.env.PERPLEXITY_API_KEY?.trim();
    if (!apiKey) {
      return { valid: false, error: 'PERPLEXITY_API_KEY is not configured.' };
    }
  }

  return { valid: true };
}

// Convert client messages to Anthropic format
function convertToAnthropicMessages(messages: ClientMessage[]): Anthropic.Messages.MessageParam[] {
  return messages.map(msg => {
    // Handle multipart messages (with images)
    if (Array.isArray(msg.content)) {
      console.log('[Anthropic Conversion] Processing multipart message with', msg.content.length, 'parts');
      const content: Anthropic.Messages.ContentBlockParam[] = [];
      
      for (const part of msg.content as unknown as Array<{ type: string; text?: string; image?: string }>) {
        if (part.type === 'text' && part.text) {
          content.push({ type: 'text', text: part.text });
        } else if (part.type === 'image' && part.image) {
          // Extract base64 data from data URL
          const matches = part.image.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            console.log('[Anthropic Conversion] Adding image with media_type:', matches[1]);
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: matches[2],
              },
            });
          } else {
            console.log('[Anthropic Conversion] Image data URL did not match expected format:', part.image.substring(0, 50));
          }
        }
      }
      
      console.log('[Anthropic Conversion] Final content blocks:', content.map(c => c.type));
      
      return {
        role: msg.role as 'user' | 'assistant',
        content,
      };
    }
    
    // Simple text message
    return {
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : '',
    };
  });
}

// Create SSE stream encoder
function createSSEEncoder() {
  const encoder = new TextEncoder();
  return {
    encode: (data: StreamChunk) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
    encodeDone: () => encoder.encode('data: [DONE]\n\n'),
  };
}

// Strip raw <thinking> tags from text content
// This handles cases where the model outputs thinking-style text even when extended thinking is off
function stripThinkingTags(text: string): string {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<thinking>[\s\S]*/gi, '') // Handle unclosed tags
    .replace(/<\/thinking>/gi, ''); // Handle orphaned closing tags
}

// ============================================
// NATIVE ANTHROPIC STREAMING (Extended Thinking + Tools)
// ============================================

async function streamWithAnthropicNative(
  messages: ClientMessage[],
  systemPrompt: string,
  selectedModel: ModelId,
  options: ChatOptions
): Promise<ReadableStream> {
  const client = await getAnthropicClient();
  const modelId = getAnthropicModelId(selectedModel);
  const sse = createSSEEncoder();
  
  // Prepare tools if enabled (including MCP tools and server tools)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tools: any[] | undefined;
  let betaHeaders: string[] = [];

  if (options.enableTools && supportsToolUse(selectedModel)) {
    // Get built-in tools (client-side execution)
    const builtInTools = getToolsForAnthropic();

    // Get server tools (Anthropic-executed, require beta headers)
    const serverToolsConfig = getServerTools();
    betaHeaders = serverToolsConfig.betaHeaders;

    // Get MCP tools from active connections
    const mcpTools = await getAvailableMcpTools();
    const mcpToolsFormatted = mcpToolsToAnthropic(mcpTools) as Anthropic.Messages.Tool[];

    // Merge all tools: built-in + server tools + MCP tools
    // Server tools have a different format (type instead of input_schema)
    tools = [...builtInTools, ...serverToolsConfig.tools, ...mcpToolsFormatted];

    console.log(`[Tools] Loaded ${builtInTools.length} built-in + ${serverToolsConfig.tools.length} server + ${mcpTools.length} MCP tools`);
    if (betaHeaders.length > 0) {
      console.log(`[Tools] Beta headers: ${betaHeaders.join(', ')}`);
    }
  }
  
  // Prepare thinking config if enabled
  const thinkingConfig = options.enableThinking && supportsExtendedThinking(selectedModel)
    ? {
        type: 'enabled' as const,
        budget_tokens: options.thinkingBudget || DEFAULT_THINKING_BUDGET,
      }
    : undefined;

  // Convert messages
  const anthropicMessages = convertToAnthropicMessages(messages);
  
  return new ReadableStream({
    async start(controller) {
      // Accumulate sources from tool results
      const collectedSources: SourceData[] = [];

      try {
        // IMMEDIATE FEEDBACK: When extended thinking is enabled, send a signal 
        // right away so the UI can show the thinking bubble immediately
        // This prevents the "dead air" while waiting for the first thinking delta
        if (thinkingConfig) {
          console.log('[Extended Thinking] Sending immediate thinking_start signal');
          controller.enqueue(sse.encode({ 
            type: 'thinking', 
            content: '' // Empty content signals "thinking has started"
          }));
        }

        // Create stream with native Anthropic SDK
        // Include beta headers for server tools (e.g., web_fetch)
        const streamOptions: Parameters<typeof client.messages.stream>[0] = {
          model: modelId,
          max_tokens: 16000,
          system: systemPrompt,
          messages: anthropicMessages,
          ...(tools ? { tools } : {}),
          ...(thinkingConfig ? { thinking: thinkingConfig } : {}),
        };

        // Add beta headers if server tools are enabled
        const requestOptions = betaHeaders.length > 0
          ? { headers: { 'anthropic-beta': betaHeaders.join(',') } }
          : undefined;

        const stream = await client.messages.stream(streamOptions, requestOptions);

        let currentToolUse: { id: string; name: string; input: string } | null = null;
        let pendingToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
        let hasStreamedText = false;
        let thinkingEventCount = 0;

        // Track if an error occurred in event handlers
        let streamError: Error | null = null;

        // Process text events - strip any raw <thinking> tags the model might output
        stream.on('text', (text: string) => {
          try {
            const cleanText = stripThinkingTags(text);
            if (cleanText) {
              hasStreamedText = true;
              controller.enqueue(sse.encode({ type: 'text', content: cleanText }));
            }
          } catch (err) {
            console.error('[Stream] Error in text handler:', err);
            streamError = err instanceof Error ? err : new Error(String(err));
          }
        });

        // Stream thinking deltas in real-time using the official SDK event
        // This provides word-by-word streaming for Extended Thinking content
        stream.on('thinking', (thinkingDelta: string) => {
          try {
            thinkingEventCount++;
            if (thinkingEventCount === 1) {
              console.log('[Extended Thinking] First thinking delta received');
            }
            controller.enqueue(sse.encode({ 
              type: 'thinking', 
              content: thinkingDelta 
            }));
          } catch (err) {
            console.error('[Stream] Error in thinking handler:', err);
            streamError = err instanceof Error ? err : new Error(String(err));
          }
        });

        // Handle content blocks (tool use start and server tool results)
        stream.on('contentBlock', (block) => {
          try {
            if (block.type === 'tool_use' && 'id' in block && 'name' in block) {
              currentToolUse = { id: block.id, name: block.name, input: '' };
              controller.enqueue(sse.encode({
                type: 'tool_use',
                toolName: block.name,
                content: `Using tool: ${block.name}`
              }));
            }
            // Handle server tool results (e.g., web_fetch executed by Anthropic)
            // These come back directly in the stream without us executing them
            // Note: Using string comparison as SDK types may not include all server tool result types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blockType = (block as any).type as string;
            if (blockType === 'server_tool_result' || blockType === 'web_fetch_tool_result' || blockType === 'web_search_tool_result') {
              console.log(`[Server Tool] Received ${blockType} result`);
              // Extract citations if available
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const serverResult = block as any;
              if (serverResult.citations && Array.isArray(serverResult.citations)) {
                for (const citation of serverResult.citations) {
                  if (citation.url) {
                    collectedSources.push({
                      id: `server-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      name: citation.title || citation.url,
                      url: citation.url,
                      title: citation.title,
                      snippet: citation.snippet,
                      type: 'external',
                    });
                  }
                }
              }
              // Notify client that server tool completed
              controller.enqueue(sse.encode({
                type: 'tool_result',
                toolName: serverResult.tool_name || 'web_fetch',
                content: 'Server tool completed'
              }));
            }
          } catch (err) {
            console.error('[Stream] Error in contentBlock handler:', err);
            streamError = err instanceof Error ? err : new Error(String(err));
          }
        });

        // Handle input JSON deltas for tool use
        stream.on('inputJson', (json: string) => {
          if (currentToolUse) {
            currentToolUse.input += json;
          }
        });

        // Server tools that Anthropic executes automatically - don't try to execute these manually
        const SERVER_TOOL_NAMES = ['web_fetch'];

        // Process complete messages for tool calls and server tool results
        stream.on('message', (message) => {
          try {
            for (const block of message.content || []) {
              if (block.type === 'tool_use' && 'id' in block && 'name' in block) {
                // For server tools like web_fetch, capture the URL as a source
                if (SERVER_TOOL_NAMES.includes(block.name)) {
                  console.log(`[Server Tool] Skipping execution of ${block.name} - executed by Anthropic`);

                  // Extract URL from web_fetch input and add as a primary source
                  if (block.name === 'web_fetch') {
                    const toolInput = (block as { input?: Record<string, unknown> }).input;
                    const fetchUrl = toolInput?.url as string | undefined;
                    if (fetchUrl) {
                      // Extract domain and title from URL
                      let domain = '';
                      let title = '';
                      try {
                        const urlObj = new URL(fetchUrl);
                        domain = urlObj.hostname.replace('www.', '');
                        // Generate title from path or use domain
                        const pathParts = urlObj.pathname.split('/').filter(Boolean);
                        title = pathParts.length > 0
                          ? pathParts[pathParts.length - 1]
                              .replace(/[-_]/g, ' ')
                              .replace(/\.(html?|php|aspx?)$/i, '')
                              .split(' ')
                              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')
                          : domain;
                      } catch {
                        domain = fetchUrl;
                        title = fetchUrl;
                      }

                      const sourceData: SourceData = {
                        id: `webfetch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name: domain,
                        url: fetchUrl,
                        title: title || domain,
                        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
                        type: 'external',
                      };

                      collectedSources.push(sourceData);
                      console.log(`[Server Tool] Added web_fetch URL to sources: ${fetchUrl}`);

                      // Stream the source immediately so it appears in Links
                      controller.enqueue(sse.encode({ type: 'sources', sources: [sourceData] }));
                    }
                  }
                  continue;
                }
                pendingToolCalls.push({
                  id: block.id,
                  name: block.name,
                  input: (block as { input?: Record<string, unknown> }).input || {},
                });
              }
              // Handle server tool results (e.g., web_fetch) in final message
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const anyBlock = block as any;
              const msgBlockType = anyBlock.type as string;
              if (msgBlockType === 'server_tool_result' || msgBlockType === 'web_fetch_tool_result' || msgBlockType === 'web_search_tool_result') {
                console.log(`[Server Tool] Processing ${msgBlockType} from final message`);
                // Extract citations from server tool result
                if (anyBlock.citations && Array.isArray(anyBlock.citations)) {
                  for (const citation of anyBlock.citations) {
                    if (citation.url) {
                      collectedSources.push({
                        id: `server-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name: citation.title || citation.url,
                        url: citation.url,
                        title: citation.title,
                        snippet: citation.snippet,
                        type: 'external',
                      });
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[Stream] Error in message handler:', err);
            streamError = err instanceof Error ? err : new Error(String(err));
          }
        });
        
        // Handle stream errors
        stream.on('error', (err: Error) => {
          console.error('[Stream] Anthropic stream error:', err);
          streamError = err;
        });

        // Wait for initial response
        const response = await stream.finalMessage();
        
        // Check if any errors occurred during streaming
        if (streamError) {
          throw streamError;
        }
        
        // CRITICAL FIX: For extended thinking, text blocks might come in the final message
        // rather than being streamed via 'text' events. Check immediately after finalMessage.
        if (!hasStreamedText && thinkingConfig) {
          console.log('Extended thinking mode: checking final message for text blocks...');
          for (const block of response.content || []) {
            if (block.type === 'text' && 'text' in block && block.text) {
              const cleanText = stripThinkingTags(block.text);
              if (cleanText) {
                console.log('Found text in final message after thinking, streaming now...');
                controller.enqueue(sse.encode({ type: 'text', content: cleanText }));
                hasStreamedText = true;
              }
            }
          }
        }

        // Handle tool calls - supports multiple rounds of tool use
        // Claude may need to use multiple tools in sequence (e.g., web_search then create_artifact)
        if (response.stop_reason === 'tool_use' && pendingToolCalls.length > 0) {
          // Track conversation history for multi-turn tool use
          let conversationMessages: Anthropic.Messages.MessageParam[] = [...anthropicMessages];
          let currentToolCalls = [...pendingToolCalls];
          let currentResponse = response;
          let totalToolRounds = 0;
          const MAX_TOOL_ROUNDS = 5; // Safety limit to prevent infinite loops
          
          // Track if we've already streamed meaningful content during tool use
          // This includes canvas content injected from create_artifact
          let hasToolOutputText = false;
          
          // Loop to handle multiple rounds of tool use
          while (currentResponse.stop_reason === 'tool_use' && currentToolCalls.length > 0 && totalToolRounds < MAX_TOOL_ROUNDS) {
            totalToolRounds++;
            
            console.log(`[Tool Use] Starting tool execution round ${totalToolRounds}:`, {
              toolCount: currentToolCalls.length,
              tools: currentToolCalls.map(t => t.name),
              timestamp: new Date().toISOString(),
            });
            
            const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

            for (const toolCall of currentToolCalls) {
              console.log(`[Tool Use] Executing tool: ${toolCall.name}`, {
                inputKeys: Object.keys(toolCall.input),
                timestamp: new Date().toISOString(),
              });
              
              controller.enqueue(sse.encode({ 
                type: 'tool_use', 
                toolName: toolCall.name,
                toolInput: toolCall.input,
                content: `Executing ${toolCall.name}...` 
              }));

              // Execute the tool with timing
              const toolStartTime = Date.now();
              const result = await executeTool(toolCall.name, toolCall.input, {});
              console.log(`[Tool Use] Tool ${toolCall.name} completed in ${Date.now() - toolStartTime}ms`, {
                success: result.success,
                hasData: !!result.data,
                error: result.error || null,
              });
              
              controller.enqueue(sse.encode({ 
                type: 'tool_result', 
                toolName: toolCall.name,
                toolResult: result.data || result.error,
                content: result.success ? 'Tool completed successfully' : `Error: ${result.error}` 
              }));

              // Extract sources from web_search and stream them ONE BY ONE for smooth UX
              if (toolCall.name === 'web_search' && result.success && result.data) {
                const webSearchData = result.data as { sources?: Array<{ title: string; url: string }> };
                if (webSearchData.sources && Array.isArray(webSearchData.sources)) {
                  for (let i = 0; i < webSearchData.sources.length; i++) {
                    const source = webSearchData.sources[i];
                    // Generate truly unique ID using URL hash + timestamp + index
                    const urlHash = source.url.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0).toString(36);
                    const sourceData: SourceData = {
                      id: `ws-${urlHash}-${Date.now()}-${i}`,
                      name: extractHostname(source.url),
                      url: source.url,
                      title: source.title || extractTitleFromUrl(source.url),
                      favicon: getFaviconUrl(source.url),
                      type: 'external',
                    };
                    collectedSources.push(sourceData);
                    
                    // Stream each source individually for a smooth "finding sources" feel
                    controller.enqueue(sse.encode({ type: 'sources', sources: [sourceData] }));
                    
                    // Quick delay between sources - fast enough to feel responsive (30ms = ~500ms for 18 sources)
                    await new Promise(resolve => setTimeout(resolve, 30));
                  }
                }
              }
              
              // CANVAS SUPPORT: When create_artifact is used, inject <canvas> tags into the stream
              // This allows the UI to display the CanvasPreviewBubble with typing animation
              if (toolCall.name === 'create_artifact' && result.success && result.data) {
                const artifactData = result.data as { 
                  type?: string; 
                  title?: string; 
                  content?: string;
                };
                
                // Only inject canvas for document/markdown types
                if (artifactData.content && artifactData.title) {
                  console.log('[Canvas] Injecting canvas tags for artifact:', artifactData.title);
                  
                  // Stream the canvas opening tag immediately so UI can show preview
                  const canvasOpenTag = `<canvas title="${artifactData.title}" action="create">`;
                  controller.enqueue(sse.encode({ type: 'text', content: canvasOpenTag }));
                  
                  // Stream the content in chunks to show "typing" effect in preview
                  // Split into lines and stream each one with a small delay
                  const contentLines = artifactData.content.split('\n');
                  const CHARS_PER_CHUNK = 100; // Stream ~100 chars at a time for smooth typing
                  
                  let currentChunk = '';
                  for (const line of contentLines) {
                    currentChunk += line + '\n';
                    
                    // Stream when chunk is big enough or at end
                    if (currentChunk.length >= CHARS_PER_CHUNK) {
                      controller.enqueue(sse.encode({ type: 'text', content: currentChunk }));
                      currentChunk = '';
                      // Small delay for typing effect (10ms per chunk = ~1s for 10KB)
                      await new Promise(resolve => setTimeout(resolve, 10));
                    }
                  }
                  
                  // Stream any remaining content
                  if (currentChunk) {
                    controller.enqueue(sse.encode({ type: 'text', content: currentChunk }));
                  }
                  
                  // Close the canvas tag
                  controller.enqueue(sse.encode({ type: 'text', content: '</canvas>' }));
                  
                  // Mark that we've streamed canvas content
                  hasToolOutputText = true;
                  hasStreamedText = true; // Also update outer scope for safety
                }
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: JSON.stringify(result.success ? result.data : { error: result.error }),
              });
            }

            // Continue conversation with tool results
            console.log(`[Tool Use] Round ${totalToolRounds}: Continuing with`, toolResults.length, 'tool results');
            
            // Build assistant content for this round
            const contentTypes = currentResponse.content.map((b: { type: string }) => b.type);
            console.log('Response content blocks:', contentTypes);
            
            // Check if we have thinking blocks
            const hasThinkingBlocks = contentTypes.some(
              (t: string) => t === 'thinking' || t === 'redacted_thinking'
            );
            
            const useThinkingForContinuation = thinkingConfig && hasThinkingBlocks;
            
            let assistantContent;
            if (useThinkingForContinuation) {
              const thinkingBlocks = currentResponse.content.filter(
                (block: { type: string }) => block.type === 'thinking' || block.type === 'redacted_thinking'
              );
              const otherBlocks = currentResponse.content.filter(
                (block: { type: string }) => block.type !== 'thinking' && block.type !== 'redacted_thinking'
              );
              assistantContent = [...thinkingBlocks, ...otherBlocks];
            } else {
              assistantContent = currentResponse.content.filter(
                (block: { type: string }) => block.type !== 'thinking' && block.type !== 'redacted_thinking'
              );
            }
            
            // Update conversation history
            conversationMessages = [
              ...conversationMessages,
              { role: 'assistant' as const, content: assistantContent },
              { role: 'user' as const, content: toolResults },
            ];
            
            // Set up timeout for continuation
            const CONTINUATION_TIMEOUT = 60000;
            let continuationTimedOut = false;
            
            const continuationTimeoutId = setTimeout(() => {
              console.error(`[Tool Use] Round ${totalToolRounds}: Timeout after`, CONTINUATION_TIMEOUT, 'ms');
              continuationTimedOut = true;
            }, CONTINUATION_TIMEOUT);
            
            try {
              console.log(`[Tool Use] Round ${totalToolRounds}: Starting continuation request`);
              const continuationStartTime = Date.now();
              
              const continueStream = await client.messages.stream({
                model: modelId,
                max_tokens: 16000,
                system: systemPrompt,
                messages: conversationMessages,
                ...(tools ? { tools } : {}), // Include tools so Claude can use more if needed
                ...(useThinkingForContinuation ? { thinking: thinkingConfig } : {}),
              });

              let hasContinuationText = false;
              let continueStreamError: Error | null = null;
              let newToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
              let currentToolInput = '';
              let currentToolUse: { id: string; name: string } | null = null;
              
              continueStream.on('text', (text: string) => {
                try {
                  const cleanText = stripThinkingTags(text);
                  if (cleanText) {
                    hasContinuationText = true;
                    controller.enqueue(sse.encode({ type: 'text', content: cleanText }));
                  }
                } catch (err) {
                  console.error('[ContinueStream] Error in text handler:', err);
                  continueStreamError = err instanceof Error ? err : new Error(String(err));
                }
              });

              continueStream.on('thinking', (thinkingDelta: string) => {
                try {
                  controller.enqueue(sse.encode({ type: 'thinking', content: thinkingDelta }));
                } catch (err) {
                  console.error('[ContinueStream] Error in thinking handler:', err);
                  continueStreamError = err instanceof Error ? err : new Error(String(err));
                }
              });
              
              // Track tool use in continuation (for multi-round)
              continueStream.on('contentBlock', (block) => {
                if (block.type === 'tool_use' && 'id' in block && 'name' in block) {
                  currentToolUse = { id: block.id, name: block.name };
                  currentToolInput = '';
                  controller.enqueue(sse.encode({ 
                    type: 'tool_use', 
                    toolName: block.name,
                    content: `Using tool: ${block.name}` 
                  }));
                }
              });
              
              continueStream.on('inputJson', (json: string) => {
                if (currentToolUse) {
                  currentToolInput += json;
                }
              });
              
              continueStream.on('message', (message) => {
                // Collect any tool_use blocks from the message
                for (const block of message.content || []) {
                  if (block.type === 'tool_use' && 'id' in block && 'name' in block) {
                    newToolCalls.push({
                      id: block.id,
                      name: block.name,
                      input: (block as { input?: Record<string, unknown> }).input || {},
                    });
                  }
                }
              });
              
              continueStream.on('error', (err: Error) => {
                console.error('[ContinueStream] Anthropic stream error:', err);
                continueStreamError = err;
              });

              // Wait for the continuation to complete
              const continueResponse = await continueStream.finalMessage();
              
              clearTimeout(continuationTimeoutId);
              
              if (continueStreamError) {
                throw continueStreamError;
              }
              
              const continuationDuration = Date.now() - continuationStartTime;
              console.log(`[Tool Use] Round ${totalToolRounds}: Continuation complete:`, {
                stopReason: continueResponse.stop_reason,
                contentBlocks: continueResponse.content?.length || 0,
                hasContinuationText,
                newToolCalls: newToolCalls.length,
                durationMs: continuationDuration,
              });
              
              // If streaming didn't produce text, try to extract from final message
              if (!hasContinuationText) {
                for (const block of continueResponse.content || []) {
                  if (block.type === 'text' && 'text' in block && block.text) {
                    const cleanText = stripThinkingTags(block.text);
                    if (cleanText) {
                      console.log('Found text in final message, sending immediately...');
                      controller.enqueue(sse.encode({ type: 'text', content: cleanText }));
                      hasContinuationText = true;
                    }
                  }
                }
              }
              
              // Check if Claude wants to use more tools
              if (continueResponse.stop_reason === 'tool_use' && newToolCalls.length > 0) {
                console.log(`[Tool Use] Claude wants to use ${newToolCalls.length} more tools, continuing...`);
                currentToolCalls = newToolCalls;
                currentResponse = continueResponse;
                // Continue the loop
              } else {
                // No more tool use - we're done with tools
                // If we have text (from streaming OR from canvas injection), great! If not, show error
                const hasAnyOutput = hasContinuationText || hasToolOutputText;
                
                if (!hasAnyOutput) {
                  console.error('[Tool Use] All tool rounds completed but no response text generated!', {
                    totalRounds: totalToolRounds,
                    finalStopReason: continueResponse.stop_reason,
                    contentTypes: continueResponse.content?.map((b: { type: string }) => b.type) || [],
                    hasToolOutputText,
                    hasContinuationText,
                  });
                  
                  const errorMessage = "I found some relevant information but encountered an issue generating a complete response. " +
                    "Please try rephrasing your question or ask me to be more specific about what you'd like to know.";
                  controller.enqueue(sse.encode({ type: 'text', content: errorMessage }));
                }
                break; // Exit the tool use loop
              }
              
            } catch (continuationError) {
              clearTimeout(continuationTimeoutId);
              
              if (continuationTimedOut) {
                console.error(`[Tool Use] Round ${totalToolRounds}: Request timed out`);
                const timeoutMessage = "I gathered some information but took too long to process it. " +
                  "Please try asking a more specific question, or try again in a moment.";
                controller.enqueue(sse.encode({ type: 'text', content: timeoutMessage }));
              } else {
                throw continuationError;
              }
              break; // Exit on error
            }
          }
          
          // Safety check: if we hit max rounds, let the user know
          if (totalToolRounds >= MAX_TOOL_ROUNDS) {
            console.warn('[Tool Use] Hit maximum tool rounds limit:', MAX_TOOL_ROUNDS);
            const limitMessage = "\n\n(Note: I reached the limit of tool operations. If you need more detailed information, please ask a follow-up question.)";
            controller.enqueue(sse.encode({ type: 'text', content: limitMessage }));
          }
        }

        // Note: Sources are already streamed individually above (lines 366-369)
        // for a smooth "finding sources" feel. No need to send them again here.
        if (collectedSources.length > 0) {
          console.log('Web search sources streamed:', collectedSources.length);
        }

        // Fallback: If no text was streamed (can happen with extended thinking), 
        // extract text from the final response
        if (!hasStreamedText && response.stop_reason !== 'tool_use') {
          console.warn('No text streamed during response, checking final message for text blocks...');
          for (const block of response.content || []) {
            if (block.type === 'text' && 'text' in block && block.text) {
              const cleanText = stripThinkingTags(block.text);
              if (cleanText) {
                console.log('Found text in final message, sending now...');
                controller.enqueue(sse.encode({ type: 'text', content: cleanText }));
                hasStreamedText = true;
              }
            }
          }
          
          // If still no text, something went wrong - send a helpful error message to the user
          if (!hasStreamedText) {
            console.error('Extended thinking completed but no text was generated!', {
              stopReason: response.stop_reason,
              contentTypes: response.content?.map((b: { type: string }) => b.type) || [],
              thinkingEnabled: !!thinkingConfig,
            });
            
            // Send a user-friendly error message instead of leaving the response empty
            const errorMessage = thinkingConfig 
              ? "I completed my reasoning but encountered an issue generating a response. Please try again or disable extended thinking if the problem persists."
              : "I wasn't able to generate a response. Please try rephrasing your question.";
            controller.enqueue(sse.encode({ type: 'text', content: errorMessage }));
          }
        }

        controller.enqueue(sse.encode({ type: 'done' }));
        controller.close();
      } catch (error) {
        console.error('Error in Anthropic streaming:', error);
        controller.enqueue(sse.encode({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
        controller.close();
      }
    },
  });
}

// ============================================
// NATIVE PERPLEXITY STREAMING (Web Search)
// ============================================

// Helper to extract full hostname from URL (e.g., "figma.com")
function extractHostname(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove 'www.' prefix
    return hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}

// Well-known site name mappings for cleaner display
const SITE_NAME_MAPPINGS: Record<string, string> = {
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'github.com': 'GitHub',
  'stackoverflow.com': 'Stack Overflow',
  'medium.com': 'Medium',
  'dev.to': 'DEV Community',
  'twitter.com': 'Twitter',
  'x.com': 'X (Twitter)',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'figma.com': 'Figma',
  'dribbble.com': 'Dribbble',
  'behance.net': 'Behance',
  'notion.so': 'Notion',
  'notion.site': 'Notion',
  'vercel.com': 'Vercel',
  'netlify.com': 'Netlify',
  'aws.amazon.com': 'AWS',
  'docs.google.com': 'Google Docs',
  'drive.google.com': 'Google Drive',
  'support.google.com': 'Google Support',
  'developer.mozilla.org': 'MDN Web Docs',
  'wikipedia.org': 'Wikipedia',
  'en.wikipedia.org': 'Wikipedia',
  'npmjs.com': 'npm',
  'tailwindcss.com': 'Tailwind CSS',
  'reactjs.org': 'React',
  'react.dev': 'React',
  'nextjs.org': 'Next.js',
  'typescriptlang.org': 'TypeScript',
  'freepik.com': 'Freepik',
  'unsplash.com': 'Unsplash',
  'pexels.com': 'Pexels',
  'canva.com': 'Canva',
  'adobe.com': 'Adobe',
  'help.adobe.com': 'Adobe Help',
  'hubspot.com': 'HubSpot',
  'blog.hubspot.com': 'HubSpot Blog',
  'mailchimp.com': 'Mailchimp',
  'intercom.com': 'Intercom',
  'stripe.com': 'Stripe',
  'shopify.com': 'Shopify',
  'webflow.com': 'Webflow',
  'wix.com': 'Wix',
  'squarespace.com': 'Squarespace',
  'wordpress.com': 'WordPress',
  'wordpress.org': 'WordPress',
  'producthunt.com': 'Product Hunt',
  'techcrunch.com': 'TechCrunch',
  'theverge.com': 'The Verge',
  'wired.com': 'WIRED',
  'arstechnica.com': 'Ars Technica',
  'smashingmagazine.com': 'Smashing Magazine',
  'css-tricks.com': 'CSS-Tricks',
  'uxdesign.cc': 'UX Collective',
  'nngroup.com': 'Nielsen Norman Group',
  'lawsofux.com': 'Laws of UX',
  'designsystems.com': 'Design Systems',
  'alistapart.com': 'A List Apart',
  'sitepoint.com': 'SitePoint',
  'creativebloq.com': 'Creative Bloq',
  'designmodo.com': 'Designmodo',
  'invisionapp.com': 'InVision',
  'sketch.com': 'Sketch',
  'principle.app': 'Principle',
  'framer.com': 'Framer',
  'zeplin.io': 'Zeplin',
  'abstract.com': 'Abstract',
  'miro.com': 'Miro',
  'figjam.com': 'FigJam',
  'loom.com': 'Loom',
  'asana.com': 'Asana',
  'trello.com': 'Trello',
  'monday.com': 'Monday.com',
  'slack.com': 'Slack',
  'discord.com': 'Discord',
  'zoom.us': 'Zoom',
  'meet.google.com': 'Google Meet',
  'teams.microsoft.com': 'Microsoft Teams',
  'startupspells.com': 'Startup Spells',
  'foreplay.co': 'Foreplay',
  'orenjohn.com': 'Oren John',
};

// Helper to get a friendly site name from hostname
function getSiteName(hostname: string): string {
  // Check exact match first
  if (SITE_NAME_MAPPINGS[hostname]) {
    return SITE_NAME_MAPPINGS[hostname];
  }
  
  // Check for subdomain matches (e.g., blog.example.com → example.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const baseDomain = parts.slice(-2).join('.');
    if (SITE_NAME_MAPPINGS[baseDomain]) {
      return SITE_NAME_MAPPINGS[baseDomain];
    }
  }
  
  // Format the hostname nicely (e.g., "example-site.com" → "Example Site")
  const domainName = hostname.replace(/\.(com|org|net|io|co|app|dev|ai|xyz|me|tv|cc)$/i, '');
  return domainName
    .split(/[.-]/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to extract a readable title from URL path
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');
    const pathname = parsed.pathname;
    const siteName = getSiteName(hostname);
    
    // If path is just "/" or empty, return the site name
    if (!pathname || pathname === '/') {
      return siteName;
    }
    
    // Get the path segments
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return siteName;
    }
    
    // Handle YouTube videos
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = parsed.searchParams.get('v') || segments[segments.length - 1];
      // Can't get actual title without API call, but indicate it's a video
      if (segments.includes('watch') || hostname.includes('youtu.be')) {
        return 'YouTube Video';
      }
      if (segments.includes('channel') || segments.includes('c') || segments.includes('@')) {
        const channelName = segments[segments.length - 1].replace('@', '');
        return `YouTube: ${channelName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
      }
      return 'YouTube';
    }
    
    // Handle GitHub repos
    if (hostname === 'github.com' && segments.length >= 2) {
      const [owner, repo] = segments;
      if (repo && !['settings', 'issues', 'pulls', 'actions', 'projects', 'wiki', 'security', 'pulse', 'graphs'].includes(repo)) {
        return `${owner}/${repo}`;
      }
    }
    
    // Handle Medium articles
    if (hostname.includes('medium.com')) {
      const lastSegment = segments[segments.length - 1];
      // Medium URLs often have the title in the last segment
      if (lastSegment && lastSegment.length > 10) {
        // Remove the hash at the end of Medium URLs
        const cleanSegment = lastSegment.replace(/-[a-f0-9]+$/, '');
        const title = cleanSegment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return title.length > 60 ? title.substring(0, 57) + '...' : title;
      }
    }
    
    // Handle Reddit
    if (hostname.includes('reddit.com')) {
      if (segments.includes('r') && segments.length > 1) {
        const subredditIndex = segments.indexOf('r');
        const subreddit = segments[subredditIndex + 1];
        if (segments.includes('comments') && segments.length > subredditIndex + 4) {
          const titleSegment = segments[subredditIndex + 4] || segments[segments.length - 1];
          const title = titleSegment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return `r/${subreddit}: ${title.substring(0, 40)}${title.length > 40 ? '...' : ''}`;
        }
        return `r/${subreddit}`;
      }
    }
    
    // Handle Wikipedia
    if (hostname.includes('wikipedia.org')) {
      if (segments.includes('wiki') && segments.length > 1) {
        const wikiIndex = segments.indexOf('wiki');
        const article = segments[wikiIndex + 1];
        if (article) {
          return decodeURIComponent(article.replace(/_/g, ' '));
        }
      }
    }
    
    // Handle Stack Overflow
    if (hostname.includes('stackoverflow.com')) {
      if (segments.includes('questions') && segments.length > 2) {
        const questionIndex = segments.indexOf('questions');
        const titleSegment = segments[questionIndex + 2];
        if (titleSegment) {
          const title = titleSegment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return title.length > 60 ? title.substring(0, 57) + '...' : title;
        }
      }
    }
    
    // Generic path parsing - take the last meaningful segment
    let title = segments[segments.length - 1];
    
    // Remove file extensions
    title = title.replace(/\.(html?|php|aspx?|jsp|md|txt)$/i, '');
    
    // Remove common URL suffixes like hashes or query strings that made it into the path
    title = title.replace(/-[a-f0-9]{8,}$/i, ''); // Remove hash-like suffixes
    title = title.replace(/\?.*$/, ''); // Remove query params
    
    // Replace hyphens and underscores with spaces
    title = title.replace(/[-_]/g, ' ');
    
    // Decode URL encoding
    title = decodeURIComponent(title);
    
    // Capitalize words
    title = title.replace(/\b\w/g, c => c.toUpperCase());
    
    // If title is too short or generic, include more context
    if (title.length < 8 && segments.length > 1) {
      const contextSegment = segments[segments.length - 2];
      const context = contextSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      title = `${context}: ${title}`;
    }
    
    // If still too short or looks like an ID, prepend site name
    if (title.length < 5 || /^[a-f0-9-]+$/i.test(title.replace(/\s/g, ''))) {
      return `${siteName} Article`;
    }
    
    // Truncate if too long
    if (title.length > 70) {
      title = title.substring(0, 67) + '...';
    }
    
    return title || siteName;
  } catch {
    return 'Web Article';
  }
}

// Helper to get favicon URL from domain
function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
}

// Helper to extract relevant snippet from content for a citation
function extractSnippetForCitation(content: string, citationIndex: number): string {
  // Look for text near the citation marker [N]
  const citationMarker = `[${citationIndex}]`;
  const markerIndex = content.indexOf(citationMarker);
  
  if (markerIndex === -1) {
    // No marker found, try to get context from the beginning
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > citationIndex - 1) {
      const sentence = sentences[citationIndex - 1]?.trim();
      if (sentence) {
        return sentence.length > 150 ? sentence.substring(0, 147) + '...' : sentence;
      }
    }
    return '';
  }
  
  // Get surrounding text (look back for the sentence)
  const textBefore = content.substring(Math.max(0, markerIndex - 200), markerIndex);
  const sentences = textBefore.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 1]?.trim();
  
  if (lastSentence && lastSentence.length > 20) {
    return lastSentence.length > 150 ? lastSentence.substring(0, 147) + '...' : lastSentence;
  }
  
  return '';
}

async function streamWithPerplexityNative(
  messages: ClientMessage[],
  systemPrompt: string,
  selectedModel: ModelId
): Promise<ReadableStream> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not configured');
  }

  const modelId = getPerplexityModelId(selectedModel);
  const sse = createSSEEncoder();

  // Convert messages to Perplexity format
  const perplexityMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: typeof msg.content === 'string' ? msg.content : '',
    })),
  ];

  return new ReadableStream({
    async start(controller) {
      try {
        // Call Perplexity REST API with streaming
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: perplexityMessages,
            stream: true,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Perplexity API error: ${response.status} - ${error}`);
        }

        if (!response.body) {
          throw new Error('No response body from Perplexity API');
        }

        // Accumulate content for snippet extraction when citations arrive
        let fullContent = '';
        let rawCitations: string[] = [];

        // Process the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const chunk = JSON.parse(data);
                
                // Stream text chunks immediately as they arrive
                const textDelta = chunk.choices?.[0]?.delta?.content;
                if (textDelta) {
                  const cleanDelta = stripThinkingTags(textDelta);
                  if (cleanDelta) {
                    fullContent += cleanDelta;
                    controller.enqueue(sse.encode({ type: 'text', content: cleanDelta }));
                  }
                }

                // Citations come in the final chunk (Perplexity API behavior)
                const citations = chunk.citations;
                if (citations && Array.isArray(citations)) {
                  rawCitations = citations;
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        // Now that streaming is complete, process and send citations
        if (rawCitations.length > 0) {
          const sources: SourceData[] = rawCitations.map((url: string, index: number) => {
            const hostname = extractHostname(url);
            const siteName = getSiteName(hostname);
            const extractedTitle = extractTitleFromUrl(url);
            const snippet = extractSnippetForCitation(fullContent, index + 1);
            
            return {
              id: `perplexity-${index}`,
              name: siteName,
              url: url,
              title: extractedTitle,
              snippet: snippet || undefined,
              favicon: getFaviconUrl(url),
              type: 'external' as const,
            };
          });

          console.log('Perplexity citations found:', sources.length, sources.map(s => ({ name: s.name, title: s.title })));
          
          // Stream sources one-by-one for a smooth "finding sources" feel
          for (let i = 0; i < sources.length; i++) {
            controller.enqueue(sse.encode({ type: 'sources', sources: [sources[i]] }));
            // Quick delay between sources - fast enough to feel responsive
            await new Promise(resolve => setTimeout(resolve, 40));
          }
        }

        controller.enqueue(sse.encode({ type: 'done' }));
        controller.close();
      } catch (error) {
        console.error('Error in Perplexity streaming:', error);
        controller.enqueue(sse.encode({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
        controller.close();
      }
    },
  });
}

// ============================================
// WRITING STYLE HELPER
// ============================================

// Get writing style instructions based on style ID
function getWritingStyleInstructions(styleId: string): string | null {
  const styleInstructions: Record<string, string> = {
    'learning': `You are in Learning Mode. Explain concepts clearly and educationally. Use analogies from design tools when relevant. Break complex logic into digestible steps. Connect technical decisions to user experience impacts.`,
    
    'concise': `Be concise and to the point. Use short sentences. Avoid unnecessary explanations. Get straight to the answer. Use bullet points where appropriate.`,
    
    'explanatory': `Provide detailed explanations. Walk through your reasoning step by step. Include relevant background context. Explain the "why" behind recommendations. Use examples to illustrate points.`,
    
    'formal': `Use a professional and formal tone. Avoid colloquialisms and casual language. Structure responses with clear headings and sections. Be precise in your language choices.`,
    
    'creative': `Be creative and artistic in your responses. Think outside the box. Offer innovative and unexpected solutions. Use vivid language and metaphors. Encourage experimentation.`,
    
    'long-form': `Write comprehensive, detailed responses. Include thorough explanations and examples. Structure content with clear sections. Cover multiple angles and considerations. Don't shy away from length when depth is needed.`,
    
    'short-form': `Keep responses brief and scannable. Use bullet points and short paragraphs. Focus on key takeaways only. Ideal for quick reference and busy readers.`,
    
    'strategic': `Take a strategic perspective. Focus on business outcomes and goals. Consider market positioning and competitive advantages. Think about long-term implications. Provide actionable recommendations with clear rationale.`,
    
    'blog': `Write in a conversational blog style. Use engaging hooks and transitions. Include personal touches and storytelling. Format for easy reading with headers and short paragraphs. End with clear takeaways or calls to action.`,
  };

  return styleInstructions[styleId] || null;
}

// ============================================
// MAIN API HANDLER
// ============================================

export async function POST(req: Request) {
  console.log('=== Chat API called ===');
  try {
    const body = await req.json();
    const { 
      messages, 
      model = 'auto', 
      context, 
      connectors,
      options = {},
      extendedThinking,
      writingStyle,
      quickActionType,
      brandId,
      quickActionFormData,
    } = body as {
      messages: ClientMessage[];
      model?: string;
      context?: PageContext;
      connectors?: ConnectorSettings;
      options?: ChatOptions;
      extendedThinking?: boolean;
      writingStyle?: string | null;
      quickActionType?: string;
      brandId?: string;
      quickActionFormData?: {
        channelId: string;
        channelLabel: string;
        goalId: string;
        goalLabel: string;
        keyMessage: string;
        contentFormat: string;
      };
    };
    
    // Default connector settings
    const activeConnectors: ConnectorSettings = connectors || {
      web: true,
      brand: true,
      brain: true,
      discover: true,
    };
    
    // Default options - tools (web search) enabled ONLY if web connector is enabled
    // This ensures user settings are respected: if they turn off web search, we don't search the web
    const chatOptions: ChatOptions = {
      enableThinking: extendedThinking ?? options.enableThinking ?? false, // Use extendedThinking from UI
      thinkingBudget: options.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
      enableTools: activeConnectors.web && (options.enableTools ?? true), // Only enable tools if web search is enabled
      writingStyle: writingStyle ?? options.writingStyle ?? null, // Writing style from UI
    };
    
    console.log('Active connectors:', activeConnectors);
    console.log('Chat options:', chatOptions);
    console.log('Web search enabled:', activeConnectors.web);
    
    // If web search is disabled but user selected 'sonar' (web search model), 
    // fall back to Claude since we can't honor their request without web access
    if (!activeConnectors.web && model === 'sonar') {
      console.log('Web search disabled but sonar model requested - falling back to claude-sonnet');
    }
    
    // Enrich article context
    let enrichedContext = context;
    if (context?.type === 'article' && context.article?.slug && !context.article.summary) {
      const articleContent = await fetchArticleContent(context.article.slug);
      if (articleContent) {
        enrichedContext = {
          ...context,
          article: {
            ...context.article,
            summary: articleContent.summary,
            sections: articleContent.sections,
          },
        };
      }
    }

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log incoming messages to debug image attachments
    const lastMessage = messages[messages.length - 1];
    const hasAttachments = lastMessage?.experimental_attachments || lastMessage?.files;
    console.log('[Chat API] Processing request:', {
      messageCount: messages.length,
      lastMessageRole: lastMessage?.role,
      hasAttachments: !!hasAttachments,
      attachmentCount: hasAttachments?.length || 0,
    });

    // Process messages to handle image attachments
    const processedMessages = processMessagesWithImages(messages as ClientMessage[]);

    // Ensure messages alternate properly
    const validatedMessages = processedMessages.reduce((acc: ClientMessage[], msg, idx) => {
      if (idx === 0) {
        acc.push(msg);
      } else {
        const prevRole = acc[acc.length - 1]?.role;
        if (msg.role !== prevRole) {
          acc.push(msg);
        } else if (msg.role === 'user') {
          const prev = acc[acc.length - 1];
          const prevContent = typeof prev.content === 'string' ? prev.content : '';
          const msgContent = typeof msg.content === 'string' ? msg.content : '';
          acc[acc.length - 1] = { ...prev, content: `${prevContent}\n\n${msgContent}` };
        }
      }
      return acc;
    }, []);

    // Select model - respect web search settings
    let selectedModel: ModelId = model === 'auto' ? autoSelectModel(validatedMessages) : (model as ModelId) || 'claude-sonnet';
    
    // If web search is disabled, don't use Perplexity/Sonar models (they're web search models)
    // Fall back to Claude Sonnet instead
    if (!activeConnectors.web && isPerplexityModel(selectedModel)) {
      console.log(`Web search disabled - switching from ${selectedModel} to claude-sonnet`);
      selectedModel = 'claude-sonnet';
    }
    
    // IMPORTANT: If extended thinking is enabled and the selected model doesn't support it,
    // switch to Claude Sonnet which does support extended thinking.
    // This ensures users who enable extended thinking get the feature, even for queries
    // that would normally route to web search (Sonar).
    if (chatOptions.enableThinking && !supportsExtendedThinking(selectedModel)) {
      console.log(`Extended thinking enabled but ${selectedModel} doesn't support it - switching to claude-sonnet`);
      selectedModel = 'claude-sonnet';
    }

    // Validate API key
    const keyCheck = hasRequiredApiKey(selectedModel);
    if (!keyCheck.valid) {
      console.error('API key missing:', keyCheck.error);
      return new Response(
        JSON.stringify({ error: keyCheck.error }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load skill content if quick action type is provided
    let skillContext: SkillContext | undefined;
    if (quickActionType) {
      const skillId = getSkillIdForQuickAction(quickActionType);
      if (skillId) {
        const skillContent = await loadSkillContent(skillId, brandId);
        if (skillContent) {
          skillContext = {
            skillId,
            content: skillContent,
          };
          console.log(`[Skill] Loaded skill "${skillId}" for quick action "${quickActionType}"`);
        } else {
          console.warn(`[Skill] Could not load skill "${skillId}" for quick action "${quickActionType}"`);
        }
      }
    }

    // Retrieve brand voice context for quick actions
    // This performs semantic search to find relevant brand voice/tone guidelines
    // and distills them into identity framing (not raw guidelines)
    let brandVoiceSection = '';
    if (quickActionType && quickActionFormData) {
      try {
        console.log(`[BrandVoice] Retrieving brand voice for quick action "${quickActionType}"`);
        
        // Build the voice retrieval options
        const voiceOptions: VoiceRetrievalOptions = {
          formData: {
            channelId: quickActionFormData.channelId,
            contentFormat: quickActionFormData.contentFormat as 'short_form' | 'long_form' | 'written',
            contentSubtypeIds: [],
            goalId: quickActionFormData.goalId,
            keyMessage: quickActionFormData.keyMessage,
            outputPreferences: {
              variations: 1,
              hashtags: 'generated',
              captionLength: 'standard',
              includeCta: 'no',
            },
            formId: 'api-generated',
            createdAt: new Date().toISOString(),
          },
          channel: {
            id: quickActionFormData.channelId,
            label: quickActionFormData.channelLabel,
            shortLabel: quickActionFormData.channelLabel,
            icon: null,
            supportedFormats: ['short_form', 'long_form', 'written'],
            isDefault: false,
            displayOrder: 0,
            userId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          goal: {
            id: quickActionFormData.goalId,
            label: quickActionFormData.goalLabel,
            description: null,
            isDefault: false,
            displayOrder: 0,
            userId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          brandId,
        };

        const brandVoiceContext = await retrieveBrandVoice(voiceOptions);
        
        if (brandVoiceContext.hasVoiceContext) {
          brandVoiceSection = formatVoiceForSystemPrompt(brandVoiceContext);
          console.log(`[BrandVoice] Retrieved brand voice context (${brandVoiceSection.length} chars)`);
        } else {
          console.log('[BrandVoice] No brand voice context found - using skill content only');
        }
      } catch (error) {
        console.error('[BrandVoice] Error retrieving brand voice:', error);
        // Continue without brand voice - skill content will still apply
      }
    }

    // Build system prompt with optional writing style and skill context
    let systemPrompt = buildBrandSystemPrompt({
      includeFullDocs: shouldIncludeFullDocs(messages),
      context: enrichedContext,
      skill: skillContext,
    });

    // Inject brand voice context into system prompt
    // This comes AFTER skill context (skill defines task, voice defines personality)
    if (brandVoiceSection) {
      systemPrompt = `${systemPrompt}\n\n${brandVoiceSection}`;
    }

    // Add writing style instructions if specified
    if (chatOptions.writingStyle && chatOptions.writingStyle !== 'normal') {
      const styleInstructions = getWritingStyleInstructions(chatOptions.writingStyle);
      if (styleInstructions) {
        systemPrompt = `${systemPrompt}\n\n## Writing Style\n${styleInstructions}`;
      }
    }

    console.log('Selected model:', selectedModel);
    console.log('Message count:', validatedMessages.length);
    console.log('Thinking enabled:', chatOptions.enableThinking && supportsExtendedThinking(selectedModel));
    console.log('Tools enabled:', chatOptions.enableTools && supportsToolUse(selectedModel));
    console.log('Writing style:', chatOptions.writingStyle || 'normal');

    // Route to appropriate streaming handler based on provider
    if (isPerplexityModel(selectedModel)) {
      // Use Perplexity SDK for Sonar models (web search)
      console.log('Using native Perplexity API for web search');
      
      const stream = await streamWithPerplexityNative(
        validatedMessages,
        systemPrompt,
        selectedModel
      );

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Model-Used': selectedModel,
          'X-Features': JSON.stringify({ webSearch: true }),
        },
      });
    }

    // Use native Anthropic SDK for all Claude models
    console.log('Using native Anthropic API');
    
    const stream = await streamWithAnthropicNative(
      validatedMessages,
      systemPrompt,
      selectedModel,
      chatOptions
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Model-Used': selectedModel,
        'X-Features': JSON.stringify({
          thinking: chatOptions.enableThinking && supportsExtendedThinking(selectedModel),
          tools: chatOptions.enableTools && supportsToolUse(selectedModel),
        }),
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    const isAuthError = errorMessage.includes('api-key') || errorMessage.includes('authentication') || errorMessage.includes('401');
    
    return new Response(
      JSON.stringify({ 
        error: isAuthError 
          ? 'API authentication failed. Please check your API keys.' 
          : errorMessage 
      }),
      { status: isAuthError ? 401 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
