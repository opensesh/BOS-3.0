/**
 * Tool Executors
 * 
 * Server-side execution logic for each tool.
 * These functions are called when Claude uses a tool.
 */

import type { ToolExecutionContext, ToolResult } from './index';

// ============================================
// WEB SEARCH EXECUTOR
// Uses Perplexity API for web search
// ============================================

export async function executeWebSearch(
  input: { query: string; max_results?: number },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Perplexity API key not configured' };
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'user',
            content: input.query,
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Search failed: ${response.statusText}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No results found';
    const citations = data.citations || [];

    return {
      success: true,
      data: {
        summary: content,
        sources: citations.map((url: string, i: number) => ({
          title: `Source ${i + 1}`,
          url,
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

// ============================================
// CALCULATOR EXECUTOR
// Safely evaluates mathematical expressions
// ============================================

export async function executeCalculator(
  input: { expression: string },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    let expr = input.expression;

    // Handle percentage calculations
    expr = expr.replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, (_, pct, num) => {
      return `(${pct} / 100 * ${num})`;
    });

    // Replace common math functions
    const mathFunctions: Record<string, string> = {
      'sqrt': 'Math.sqrt',
      'abs': 'Math.abs',
      'sin': 'Math.sin',
      'cos': 'Math.cos',
      'tan': 'Math.tan',
      'log': 'Math.log10',
      'ln': 'Math.log',
      'exp': 'Math.exp',
      'pow': 'Math.pow',
      'floor': 'Math.floor',
      'ceil': 'Math.ceil',
      'round': 'Math.round',
      'pi': 'Math.PI',
      'e': 'Math.E',
    };

    for (const [fn, replacement] of Object.entries(mathFunctions)) {
      expr = expr.replace(new RegExp(`\\b${fn}\\b`, 'gi'), replacement);
    }

    // Validate expression (only allow safe characters)
    if (!/^[0-9+\-*/().%\s,Math.PISQRTABSINCOSTANLGEXPOWFLCEROUND]+$/i.test(expr)) {
      return { success: false, error: 'Invalid characters in expression' };
    }

    // Evaluate (using Function constructor for sandboxed eval)
    const result = new Function('Math', `return ${expr}`)(Math);

    if (typeof result !== 'number' || isNaN(result)) {
      return { success: false, error: 'Invalid result' };
    }

    return {
      success: true,
      data: {
        expression: input.expression,
        result: result,
        formatted: Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, ''),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calculation failed',
    };
  }
}

// ============================================
// GET CURRENT TIME EXECUTOR
// ============================================

export async function executeGetCurrentTime(
  input: { timezone?: string },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    const timezone = input.timezone || 'UTC';
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });

    return {
      success: true,
      data: {
        formatted: formatter.format(now),
        iso: now.toISOString(),
        unix: Math.floor(now.getTime() / 1000),
        timezone,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get time',
    };
  }
}

// ============================================
// FILE READ EXECUTOR
// Reads uploaded files from Supabase Storage
// ============================================

export async function executeFileRead(
  input: { file_id: string },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    // Import dynamically to avoid circular dependencies
    const { fileService } = await import('@/lib/supabase/file-service');
    
    const file = await fileService.getFile(input.file_id);
    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Check if we have extracted text
    if (file.extractedText) {
      return {
        success: true,
        data: {
          filename: file.originalFilename || file.filename,
          mimeType: file.mimeType,
          content: file.extractedText,
        },
      };
    }

    // Try to read text content
    const content = await fileService.getFileContent(input.file_id);
    if (!content) {
      return { success: false, error: 'Could not read file content' };
    }

    return {
      success: true,
      data: {
        filename: file.originalFilename || file.filename,
        mimeType: file.mimeType,
        content: content,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
}

// ============================================
// CREATE ARTIFACT EXECUTOR
// Creates and stores artifacts
// ============================================

export async function executeCreateArtifact(
  input: {
    type: string;
    title?: string;
    content: string;
    language?: string;
  },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    const { artifactService } = await import('@/lib/supabase/artifact-service');
    
    if (!context.chatId) {
      // Return the artifact data without storing (for preview)
      return {
        success: true,
        data: {
          type: input.type,
          title: input.title,
          content: input.content,
          language: input.language,
          stored: false,
        },
      };
    }

    const artifact = await artifactService.createArtifact({
      chat_id: context.chatId,
      message_id: context.messageId,
      artifact_type: input.type as 'code' | 'diagram' | 'document' | 'html' | 'svg' | 'markdown' | 'json' | 'csv',
      title: input.title,
      content: input.content,
      language: input.language,
    });

    if (!artifact) {
      return { success: false, error: 'Failed to create artifact' };
    }

    return {
      success: true,
      data: {
        id: artifact.id,
        type: artifact.type,
        title: artifact.title,
        language: artifact.language,
        stored: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create artifact',
    };
  }
}

// ============================================
// BRAND KNOWLEDGE EXECUTOR
// Searches brand knowledge base
// ============================================

export async function executeBrandKnowledgeSearch(
  input: { query: string; category?: string },
  context: ToolExecutionContext
): Promise<ToolResult> {
  try {
    // For now, return a placeholder response
    // In a full implementation, this would search your brand knowledge base
    return {
      success: true,
      data: {
        query: input.query,
        category: input.category || 'all',
        results: [
          {
            title: 'Brand Knowledge',
            content: 'Brand knowledge search functionality will be implemented based on your existing brand-knowledge module.',
          },
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

// ============================================
// CODE EXECUTION EXECUTOR
// Note: Real code execution requires a sandboxed environment
// This is a placeholder that would need proper infrastructure
// ============================================

export async function executeCode(
  input: { code: string; timeout_seconds?: number },
  context: ToolExecutionContext
): Promise<ToolResult> {
  // Code execution is complex and requires proper sandboxing
  // For now, return a message explaining this
  return {
    success: false,
    error: 'Code execution requires a sandboxed environment. This feature is not yet implemented. Please use the code artifact tool to share code that can be run locally.',
  };
}

// ============================================
// TOOL EXECUTOR REGISTRY
// ============================================

export type ToolName = 
  | 'web_search'
  | 'calculator'
  | 'execute_code'
  | 'read_file'
  | 'get_current_time'
  | 'create_artifact'
  | 'search_brand_knowledge';

export const toolExecutors: Record<ToolName, (input: Record<string, unknown>, context: ToolExecutionContext) => Promise<ToolResult>> = {
  'web_search': executeWebSearch as typeof toolExecutors['web_search'],
  'calculator': executeCalculator as typeof toolExecutors['calculator'],
  'execute_code': executeCode as typeof toolExecutors['execute_code'],
  'read_file': executeFileRead as typeof toolExecutors['read_file'],
  'get_current_time': executeGetCurrentTime as typeof toolExecutors['get_current_time'],
  'create_artifact': executeCreateArtifact as typeof toolExecutors['create_artifact'],
  'search_brand_knowledge': executeBrandKnowledgeSearch as typeof toolExecutors['search_brand_knowledge'],
};

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolResult> {
  const executor = toolExecutors[toolName as ToolName];
  
  if (!executor) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  return executor(input, context);
}



