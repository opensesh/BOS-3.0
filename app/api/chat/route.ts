import { 
  ModelId, 
  models,
  getAnthropicClient,
  getAnthropicModelId,
  getPerplexityClient,
  getPerplexityModelId,
  supportsExtendedThinking,
  supportsToolUse,
  isAnthropicModel,
  isPerplexityModel,
  DEFAULT_THINKING_BUDGET,
} from '@/lib/ai/providers';
import { autoSelectModel } from '@/lib/ai/auto-router';
import { buildBrandSystemPrompt, shouldIncludeFullDocs, BRAND_SOURCES, type PageContext } from '@/lib/brand-knowledge';
import { getToolsForAnthropic } from '@/lib/ai/tools';
import { executeTool } from '@/lib/ai/tools/executors';
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
          parts.push({ type: 'image', image: file.data });
        }
      }

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
      const content: Anthropic.Messages.ContentBlockParam[] = [];
      
      for (const part of msg.content as unknown as Array<{ type: string; text?: string; image?: string }>) {
        if (part.type === 'text' && part.text) {
          content.push({ type: 'text', text: part.text });
        } else if (part.type === 'image' && part.image) {
          // Extract base64 data from data URL
          const matches = part.image.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: matches[2],
              },
            });
          }
        }
      }
      
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
  
  // Prepare tools if enabled
  const tools = options.enableTools && supportsToolUse(selectedModel) 
    ? getToolsForAnthropic() 
    : undefined;
  
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
        // Create stream with native Anthropic SDK
        const stream = await client.messages.stream({
          model: modelId,
          max_tokens: 16000,
          system: systemPrompt,
          messages: anthropicMessages,
          ...(tools ? { tools } : {}),
          ...(thinkingConfig ? { thinking: thinkingConfig } : {}),
        });

        let currentToolUse: { id: string; name: string; input: string } | null = null;
        let pendingToolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

        // Process text events
        stream.on('text', (text: string) => {
          controller.enqueue(sse.encode({ type: 'text', content: text }));
        });

        // Handle content blocks (thinking, tool use) via raw events
        stream.on('contentBlock', (block: { type: string; id?: string; name?: string; thinking?: string }) => {
          if (block.type === 'thinking' && block.thinking) {
            controller.enqueue(sse.encode({ 
              type: 'thinking', 
              content: block.thinking 
            }));
          } else if (block.type === 'tool_use' && block.id && block.name) {
            currentToolUse = { id: block.id, name: block.name, input: '' };
            controller.enqueue(sse.encode({ 
              type: 'tool_use', 
              toolName: block.name,
              content: `Using tool: ${block.name}` 
            }));
          }
        });

        // Handle input JSON deltas for tool use
        stream.on('inputJson', (json: string) => {
          if (currentToolUse) {
            currentToolUse.input += json;
          }
        });

        // Process complete messages for tool calls
        stream.on('message', (message) => {
          for (const block of message.content || []) {
            if (block.type === 'tool_use' && 'id' in block && 'name' in block) {
              pendingToolCalls.push({
                id: block.id,
                name: block.name,
                input: (block as { input?: Record<string, unknown> }).input || {},
              });
            }
          }
        });

        // Wait for initial response
        const response = await stream.finalMessage();

        // Handle tool calls if any
        if (response.stop_reason === 'tool_use' && pendingToolCalls.length > 0) {
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolCall of pendingToolCalls) {
            controller.enqueue(sse.encode({ 
              type: 'tool_use', 
              toolName: toolCall.name,
              toolInput: toolCall.input,
              content: `Executing ${toolCall.name}...` 
            }));

            // Execute the tool
            const result = await executeTool(toolCall.name, toolCall.input, {});
            
            controller.enqueue(sse.encode({ 
              type: 'tool_result', 
              toolName: toolCall.name,
              toolResult: result.data || result.error,
              content: result.success ? 'Tool completed successfully' : `Error: ${result.error}` 
            }));

            // Extract sources from web_search tool results
            if (toolCall.name === 'web_search' && result.success && result.data) {
              const webSearchData = result.data as { sources?: Array<{ title: string; url: string }> };
              if (webSearchData.sources && Array.isArray(webSearchData.sources)) {
                for (const source of webSearchData.sources) {
                  collectedSources.push({
                    id: `web-search-${collectedSources.length}`,
                    name: extractHostname(source.url),
                    url: source.url,
                    title: source.title || extractTitleFromUrl(source.url),
                    favicon: getFaviconUrl(source.url),
                    type: 'external',
                  });
                }
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolCall.id,
              content: JSON.stringify(result.success ? result.data : { error: result.error }),
            });
          }

          // Continue conversation with tool results
          const continueStream = await client.messages.stream({
            model: modelId,
            max_tokens: 16000,
            system: systemPrompt,
            messages: [
              ...anthropicMessages,
              { role: 'assistant', content: response.content },
              { role: 'user', content: toolResults },
            ],
            ...(thinkingConfig ? { thinking: thinkingConfig } : {}),
          });

          continueStream.on('text', (text: string) => {
            controller.enqueue(sse.encode({ type: 'text', content: text }));
          });

          continueStream.on('contentBlock', (block: { type: string; thinking?: string }) => {
            if (block.type === 'thinking' && block.thinking) {
              controller.enqueue(sse.encode({ type: 'thinking', content: block.thinking }));
            }
          });

          await continueStream.finalMessage();
        }

        // Send collected sources if we have any
        if (collectedSources.length > 0) {
          console.log('Web search sources found:', collectedSources.length);
          controller.enqueue(sse.encode({ type: 'sources', sources: collectedSources }));
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

// Helper to extract a readable title from URL path
function extractTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    
    // If path is just "/" or empty, use the hostname
    if (!pathname || pathname === '/') {
      return extractHostname(url);
    }
    
    // Get the last meaningful segment of the path
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return extractHostname(url);
    }
    
    // Take the last segment and clean it up
    let title = segments[segments.length - 1];
    
    // Remove file extensions
    title = title.replace(/\.(html?|php|aspx?|jsp)$/i, '');
    
    // Replace hyphens and underscores with spaces
    title = title.replace(/[-_]/g, ' ');
    
    // Decode URL encoding
    title = decodeURIComponent(title);
    
    // Capitalize first letter of each word
    title = title.replace(/\b\w/g, c => c.toUpperCase());
    
    // If title is too short, include more of the path
    if (title.length < 10 && segments.length > 1) {
      title = segments.slice(-2).join(' / ').replace(/[-_]/g, ' ');
      title = decodeURIComponent(title);
      title = title.replace(/\b\w/g, c => c.toUpperCase());
    }
    
    return title || extractHostname(url);
  } catch {
    return 'Web Page';
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

async function streamWithPerplexityNative(
  messages: ClientMessage[],
  systemPrompt: string,
  selectedModel: ModelId
): Promise<ReadableStream> {
  const client = await getPerplexityClient();
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
        // First, make a non-streaming request to get citations
        // Perplexity only returns citations in non-streaming responses
        const citationResponse = await client.chat.completions.create({
          model: modelId,
          messages: perplexityMessages,
          stream: false,
        });

        // Extract citations from the response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawCitations = (citationResponse as any).citations || [];
        const sources: SourceData[] = rawCitations.map((url: string, index: number) => ({
          id: `perplexity-${index}`,
          name: extractHostname(url),
          url: url,
          title: extractTitleFromUrl(url),
          favicon: getFaviconUrl(url),
          type: 'external' as const,
        }));

        // Get the full response content
        const fullContent = citationResponse.choices?.[0]?.message?.content || '';

        // Stream the content character by character for smooth UX
        // We'll send it in chunks for better performance
        const chunkSize = 20;
        for (let i = 0; i < fullContent.length; i += chunkSize) {
          const chunk = fullContent.slice(i, i + chunkSize);
          controller.enqueue(sse.encode({ type: 'text', content: chunk }));
          // Small delay to simulate streaming (optional, can be removed for faster delivery)
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Send sources if we have any
        if (sources.length > 0) {
          console.log('Perplexity citations found:', sources.length);
          controller.enqueue(sse.encode({ type: 'sources', sources }));
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
    } = body as {
      messages: ClientMessage[];
      model?: string;
      context?: PageContext;
      connectors?: ConnectorSettings;
      options?: ChatOptions;
    };
    
    // Default connector settings
    const activeConnectors: ConnectorSettings = connectors || {
      web: true,
      brand: true,
      brain: true,
      discover: true,
    };
    
    // Default options - tools enabled by default for web search capability
    const chatOptions: ChatOptions = {
      enableThinking: options.enableThinking ?? false, // Disabled by default until UI is ready
      thinkingBudget: options.thinkingBudget ?? DEFAULT_THINKING_BUDGET,
      enableTools: options.enableTools ?? true, // Enabled by default for web search
    };
    
    console.log('Active connectors:', activeConnectors);
    console.log('Chat options:', chatOptions);
    
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

    // Select model
    const selectedModel: ModelId = model === 'auto' ? autoSelectModel(validatedMessages) : (model as ModelId) || 'claude-sonnet';

    // Validate API key
    const keyCheck = hasRequiredApiKey(selectedModel);
    if (!keyCheck.valid) {
      console.error('API key missing:', keyCheck.error);
      return new Response(
        JSON.stringify({ error: keyCheck.error }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    const systemPrompt = buildBrandSystemPrompt({
      includeFullDocs: shouldIncludeFullDocs(messages),
      context: enrichedContext,
    });

    console.log('Selected model:', selectedModel);
    console.log('Message count:', validatedMessages.length);
    console.log('Thinking enabled:', chatOptions.enableThinking && supportsExtendedThinking(selectedModel));
    console.log('Tools enabled:', chatOptions.enableTools && supportsToolUse(selectedModel));

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
