'use client';

import { createClient } from './client';
import type {
  DbToolExecution,
  ToolExecutionInsert,
  ToolExecution,
  ToolExecutionStatus,
  dbToolExecutionToApp,
} from './types';

// Re-export types and converter
export { dbToolExecutionToApp } from './types';
export type { ToolExecution, ToolExecutionStatus };

// Track if tables are available
let tablesChecked = false;
let tablesAvailable = true;

/**
 * Check if tool_executions table is available
 */
async function checkTablesAvailable(): Promise<boolean> {
  if (tablesChecked) return tablesAvailable;

  try {
    const supabase = createClient();
    const { error } = await supabase.from('tool_executions').select('id').limit(1);

    tablesChecked = true;

    if (!error) {
      tablesAvailable = true;
      return true;
    }

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';

    const isTableMissing =
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorCode === '42P01' ||
      errorCode === 'PGRST116';

    tablesAvailable = false;

    if (isTableMissing) {
      console.info('Tool Executions: Table not available. Tool logging disabled.');
    }

    return false;
  } catch {
    tablesChecked = true;
    tablesAvailable = false;
    return false;
  }
}

/**
 * Convert database tool execution to app format
 */
function toAppToolExecution(db: DbToolExecution): ToolExecution {
  return {
    id: db.id,
    messageId: db.message_id,
    toolName: db.tool_name,
    toolUseId: db.tool_use_id || undefined,
    input: db.input_params || {},
    output: db.output_result || undefined,
    status: db.status,
    errorMessage: db.error_message || undefined,
    durationMs: db.duration_ms || undefined,
    createdAt: db.created_at,
  };
}

/**
 * Tool Execution Service
 * Logs and tracks tool calls made by Claude
 */
export const toolService = {
  /**
   * Log a new tool execution (called when Claude invokes a tool)
   */
  async logToolCall(execution: ToolExecutionInsert): Promise<ToolExecution | null> {
    if (!(await checkTablesAvailable())) {
      console.warn('Tool execution logging not available');
      return null;
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('tool_executions')
        .insert({
          ...execution,
          status: 'pending',
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Error logging tool call:', error);
        return null;
      }

      return toAppToolExecution(data);
    } catch (error) {
      console.error('Error in logToolCall:', error);
      return null;
    }
  },

  /**
   * Update tool execution with result
   */
  async updateToolResult(
    id: string,
    result: {
      output?: Record<string, unknown>;
      status: ToolExecutionStatus;
      errorMessage?: string;
      durationMs?: number;
    }
  ): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tool_executions')
        .update({
          output_result: result.output || null,
          status: result.status,
          error_message: result.errorMessage || null,
          duration_ms: result.durationMs || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating tool result:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateToolResult:', error);
      return false;
    }
  },

  /**
   * Mark tool as running
   */
  async markRunning(id: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('tool_executions')
        .update({ status: 'running' })
        .eq('id', id);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Mark tool as successful with output
   */
  async markSuccess(
    id: string,
    output: Record<string, unknown>,
    durationMs?: number
  ): Promise<boolean> {
    return this.updateToolResult(id, {
      output,
      status: 'success',
      durationMs,
    });
  },

  /**
   * Mark tool as failed with error
   */
  async markError(id: string, errorMessage: string, durationMs?: number): Promise<boolean> {
    return this.updateToolResult(id, {
      status: 'error',
      errorMessage,
      durationMs,
    });
  },

  /**
   * Get tool execution by ID
   */
  async getToolExecution(id: string): Promise<ToolExecution | null> {
    if (!(await checkTablesAvailable())) return null;

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('tool_executions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Error fetching tool execution:', error);
        return null;
      }

      return toAppToolExecution(data);
    } catch (error) {
      console.error('Error in getToolExecution:', error);
      return null;
    }
  },

  /**
   * Get all tool executions for a message
   */
  async getExecutionsForMessage(messageId: string): Promise<ToolExecution[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('tool_executions')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Error fetching tool executions:', error);
        return [];
      }

      return data.map(toAppToolExecution);
    } catch (error) {
      console.error('Error in getExecutionsForMessage:', error);
      return [];
    }
  },

  /**
   * Get recent tool executions (for debugging/monitoring)
   */
  async getRecentExecutions(limit: number = 50): Promise<ToolExecution[]> {
    if (!(await checkTablesAvailable())) return [];

    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('tool_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error('Error fetching recent executions:', error);
        return [];
      }

      return data.map(toAppToolExecution);
    } catch (error) {
      console.error('Error in getRecentExecutions:', error);
      return [];
    }
  },

  /**
   * Get execution statistics
   */
  async getStats(): Promise<{
    total: number;
    success: number;
    error: number;
    pending: number;
    byTool: Record<string, number>;
  }> {
    if (!(await checkTablesAvailable())) {
      return { total: 0, success: 0, error: 0, pending: 0, byTool: {} };
    }

    const supabase = createClient();

    try {
      const { data, error } = await supabase.from('tool_executions').select('tool_name, status');

      if (error || !data) {
        return { total: 0, success: 0, error: 0, pending: 0, byTool: {} };
      }

      const stats = {
        total: data.length,
        success: 0,
        error: 0,
        pending: 0,
        byTool: {} as Record<string, number>,
      };

      for (const exec of data) {
        if (exec.status === 'success') stats.success++;
        else if (exec.status === 'error') stats.error++;
        else if (exec.status === 'pending' || exec.status === 'running') stats.pending++;

        stats.byTool[exec.tool_name] = (stats.byTool[exec.tool_name] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      return { total: 0, success: 0, error: 0, pending: 0, byTool: {} };
    }
  },

  /**
   * Delete tool executions for a message
   */
  async deleteForMessage(messageId: string): Promise<boolean> {
    if (!(await checkTablesAvailable())) return false;

    const supabase = createClient();

    try {
      const { error } = await supabase.from('tool_executions').delete().eq('message_id', messageId);

      return !error;
    } catch {
      return false;
    }
  },

  /**
   * Helper: Execute a tool and log the result
   * Use this to wrap tool execution with automatic logging
   */
  async executeAndLog<T>(
    messageId: string,
    toolName: string,
    toolUseId: string | undefined,
    input: Record<string, unknown>,
    executor: () => Promise<T>
  ): Promise<{ execution: ToolExecution | null; result: T | null; error: Error | null }> {
    const startTime = Date.now();

    // Log the tool call
    const execution = await this.logToolCall({
      message_id: messageId,
      tool_name: toolName,
      tool_use_id: toolUseId,
      input_params: input,
    });

    if (execution) {
      await this.markRunning(execution.id);
    }

    try {
      const result = await executor();
      const durationMs = Date.now() - startTime;

      if (execution) {
        await this.markSuccess(
          execution.id,
          typeof result === 'object' ? (result as Record<string, unknown>) : { result },
          durationMs
        );
      }

      return { execution, result, error: null };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const error = err instanceof Error ? err : new Error(String(err));

      if (execution) {
        await this.markError(execution.id, error.message, durationMs);
      }

      return { execution, result: null, error };
    }
  },
};



