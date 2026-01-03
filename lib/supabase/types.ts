/**
 * Supabase database types for chat history and Claude features
 *
 * Tables: chats, messages, thinking_blocks, tool_executions, artifacts, files, mcp_connections
 */

// ============================================
// EXISTING TYPES (chat history)
// ============================================

// Database row types (matching existing Supabase schema)
export interface DbChat {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  metadata: MessageMetadata | null;
  created_at: string;
}

// Source info for citations (stored in metadata)
export interface StoredSourceInfo {
  id: string;
  name: string;
  url: string;
  title?: string;
  snippet?: string;
  favicon?: string;
  type?: 'external' | 'brand-doc' | 'asset' | 'discover';
  category?: string;
  publishedAt?: string;
}

// Message metadata for extended features
export interface MessageMetadata {
  has_thinking?: boolean;
  has_tool_use?: boolean;
  has_artifacts?: boolean;
  file_ids?: string[];
  token_count?: number;
  finish_reason?: string;
  // Sources/citations from the response
  sources?: StoredSourceInfo[];
}

// Application-level types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  metadata?: MessageMetadata;
  // Full source info for proper display in UI
  sources?: StoredSourceInfo[];
  thinking?: ThinkingBlock[];
  toolExecutions?: ToolExecution[];
  artifacts?: Artifact[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

// Insert types
export interface ChatInsert {
  title: string;
  user_id?: string | null;
}

export interface MessageInsert {
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  metadata?: MessageMetadata;
}

// ============================================
// THINKING BLOCKS (Extended Thinking)
// ============================================

export interface DbThinkingBlock {
  id: string;
  message_id: string;
  thinking_content: string;
  signature: string | null;
  is_redacted: boolean;
  token_count: number | null;
  created_at: string;
}

export interface ThinkingBlock {
  id: string;
  messageId: string;
  content: string;
  signature?: string;
  isRedacted: boolean;
  tokenCount?: number;
  createdAt: string;
}

export interface ThinkingBlockInsert {
  message_id: string;
  thinking_content: string;
  signature?: string;
  is_redacted?: boolean;
  token_count?: number;
}

// ============================================
// TOOL EXECUTIONS
// ============================================

export type ToolExecutionStatus = 'pending' | 'running' | 'success' | 'error';

export interface DbToolExecution {
  id: string;
  message_id: string;
  tool_name: string;
  tool_use_id: string | null;
  input_params: Record<string, unknown> | null;
  output_result: Record<string, unknown> | null;
  status: ToolExecutionStatus;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

export interface ToolExecution {
  id: string;
  messageId: string;
  toolName: string;
  toolUseId?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: ToolExecutionStatus;
  errorMessage?: string;
  durationMs?: number;
  createdAt: string;
}

export interface ToolExecutionInsert {
  message_id: string;
  tool_name: string;
  tool_use_id?: string;
  input_params: Record<string, unknown>;
  output_result?: Record<string, unknown>;
  status?: ToolExecutionStatus;
  error_message?: string;
  duration_ms?: number;
}

// ============================================
// ARTIFACTS
// ============================================

export type ArtifactType = 'code' | 'diagram' | 'document' | 'chart' | 'html' | 'svg' | 'markdown' | 'json' | 'csv';

export interface DbArtifact {
  id: string;
  chat_id: string;
  message_id: string | null;
  artifact_type: ArtifactType;
  title: string | null;
  content: string;
  language: string | null;
  version: number;
  storage_path: string | null;
  metadata: ArtifactMetadata;
  created_at: string;
  updated_at: string;
}

export interface ArtifactMetadata {
  runnable?: boolean;
  editable?: boolean;
  exportFormats?: string[];
  dependencies?: string[];
  preview?: string; // Base64 preview image for charts/diagrams
}

export interface Artifact {
  id: string;
  chatId: string;
  messageId?: string;
  type: ArtifactType;
  title?: string;
  content: string;
  language?: string;
  version: number;
  storagePath?: string;
  metadata: ArtifactMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactInsert {
  chat_id: string;
  message_id?: string;
  artifact_type: ArtifactType;
  title?: string;
  content: string;
  language?: string;
  version?: number;
  storage_path?: string;
  metadata?: ArtifactMetadata;
}

export interface ArtifactUpdate {
  title?: string;
  content?: string;
  language?: string;
  version?: number;
  storage_path?: string;
  metadata?: ArtifactMetadata;
}

// ============================================
// FILES
// ============================================

export type FileProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DbFile {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string | null;
  filename: string;
  original_filename: string | null;
  storage_path: string;
  bucket_name: string;
  mime_type: string | null;
  file_size: number | null;
  extracted_text: ExtractedText | null;
  processing_status: FileProcessingStatus;
  metadata: FileMetadata;
  created_at: string;
}

export interface ExtractedText {
  // For PDFs
  pages?: Array<{
    text: string;
    pageNum: number;
  }>;
  // For code/text files
  content?: string;
  language?: string;
  // For images with OCR
  ocrText?: string;
  // Summary for all types
  summary?: string;
}

export interface FileMetadata {
  width?: number;
  height?: number;
  pageCount?: number;
  duration?: number; // For audio/video
  encoding?: string;
  lineCount?: number; // For code files
}

export interface UploadedFile {
  id: string;
  userId?: string;
  chatId?: string;
  messageId?: string;
  filename: string;
  originalFilename?: string;
  storagePath: string;
  bucketName: string;
  mimeType?: string;
  fileSize?: number;
  extractedText?: ExtractedText;
  processingStatus: FileProcessingStatus;
  metadata: FileMetadata;
  createdAt: string;
  // Computed URL for display
  publicUrl?: string;
}

export interface FileInsert {
  user_id?: string | null;
  chat_id?: string | null;
  message_id?: string | null;
  filename: string;
  original_filename?: string;
  storage_path: string;
  bucket_name?: string;
  mime_type?: string;
  file_size?: number;
  extracted_text?: ExtractedText;
  processing_status?: FileProcessingStatus;
  metadata?: FileMetadata;
}

export interface FileUpdate {
  chat_id?: string;
  message_id?: string;
  extracted_text?: ExtractedText;
  processing_status?: FileProcessingStatus;
  metadata?: FileMetadata;
}

// ============================================
// MCP CONNECTIONS
// ============================================

export type McpServerType = 'remote' | 'local' | 'stdio';
export type McpAuthType = 'none' | 'bearer' | 'api_key' | 'oauth';
export type McpHealthStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface DbMcpConnection {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  server_url: string;
  server_type: McpServerType;
  auth_type: McpAuthType;
  auth_config: McpAuthConfig;
  is_active: boolean;
  available_tools: McpTool[] | null;
  last_health_check: string | null;
  health_status: McpHealthStatus;
  created_at: string;
  last_used: string | null;
}

export interface McpAuthConfig {
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScopes?: string[];
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpConnection {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  serverUrl: string;
  serverType: McpServerType;
  authType: McpAuthType;
  authConfig: McpAuthConfig;
  isActive: boolean;
  availableTools?: McpTool[];
  lastHealthCheck?: string;
  healthStatus: McpHealthStatus;
  createdAt: string;
  lastUsed?: string;
}

export interface McpConnectionInsert {
  user_id?: string | null;
  name: string;
  description?: string;
  server_url: string;
  server_type?: McpServerType;
  auth_type?: McpAuthType;
  auth_config?: McpAuthConfig;
  is_active?: boolean;
  available_tools?: McpTool[];
}

export interface McpConnectionUpdate {
  name?: string;
  description?: string;
  server_url?: string;
  server_type?: McpServerType;
  auth_type?: McpAuthType;
  auth_config?: McpAuthConfig;
  is_active?: boolean;
  available_tools?: McpTool[];
  last_health_check?: string;
  health_status?: McpHealthStatus;
  last_used?: string;
}

// ============================================
// USER PROFILES (Account Settings)
// ============================================

export interface NotificationPreferences {
  email_marketing: boolean;
  email_updates: boolean;
  email_security: boolean;
  push_enabled: boolean;
}

export interface DbUserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  alt_email: string | null;
  website: string | null;
  avatar_url: string | null;
  bio: string | null;
  job_title: string | null;
  show_job_title: boolean;
  timezone: string;
  locale: string;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  altEmail?: string;
  website?: string;
  avatarUrl?: string;
  bio?: string;
  jobTitle?: string;
  showJobTitle: boolean;
  timezone: string;
  locale: string;
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileInsert {
  user_id: string;
  username?: string;
  display_name?: string;
  email?: string;
  alt_email?: string;
  website?: string;
  avatar_url?: string;
  bio?: string;
  job_title?: string;
  show_job_title?: boolean;
  timezone?: string;
  locale?: string;
  notification_preferences?: NotificationPreferences;
}

export interface UserProfileUpdate {
  username?: string;
  display_name?: string;
  email?: string;
  alt_email?: string;
  website?: string;
  avatar_url?: string;
  bio?: string;
  job_title?: string;
  show_job_title?: boolean;
  timezone?: string;
  locale?: string;
  notification_preferences?: NotificationPreferences;
}

export function dbUserProfileToApp(db: DbUserProfile): UserProfile {
  return {
    id: db.id,
    userId: db.user_id,
    username: db.username || undefined,
    displayName: db.display_name || undefined,
    email: db.email || undefined,
    altEmail: db.alt_email || undefined,
    website: db.website || undefined,
    avatarUrl: db.avatar_url || undefined,
    bio: db.bio || undefined,
    jobTitle: db.job_title || undefined,
    showJobTitle: db.show_job_title,
    timezone: db.timezone,
    locale: db.locale,
    notificationPreferences: db.notification_preferences,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================
// BRAND DOCUMENTS (Brain Knowledge Management)
// ============================================

export type BrandDocumentCategory = 'brand-identity' | 'writing-styles' | 'skills';

export interface DbBrandDocument {
  id: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content: string;
  icon: string;
  sort_order: number;
  is_system: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandDocument {
  id: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDocumentInsert {
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content?: string;
  icon?: string;
  sort_order?: number;
  is_system?: boolean;
}

export interface BrandDocumentUpdate {
  title?: string;
  content?: string;
  icon?: string;
  sort_order?: number;
  is_deleted?: boolean;
}

export interface DbBrandDocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BrandDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  changeSummary?: string;
  createdBy?: string;
  createdAt: string;
}

export interface BrandDocumentVersionInsert {
  document_id: string;
  version_number: number;
  content: string;
  change_summary?: string;
  created_by?: string;
}

export function dbBrandDocumentToApp(db: DbBrandDocument): BrandDocument {
  return {
    id: db.id,
    category: db.category,
    slug: db.slug,
    title: db.title,
    content: db.content,
    icon: db.icon,
    sortOrder: db.sort_order,
    isSystem: db.is_system,
    isDeleted: db.is_deleted,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbBrandDocumentVersionToApp(db: DbBrandDocumentVersion): BrandDocumentVersion {
  return {
    id: db.id,
    documentId: db.document_id,
    versionNumber: db.version_number,
    content: db.content,
    changeSummary: db.change_summary || undefined,
    createdBy: db.created_by || undefined,
    createdAt: db.created_at,
  };
}

// ============================================
// LEGACY TYPES (backwards compatibility)
// ============================================

export interface SearchHistoryItem {
  id: string;
  session_id: string;
  query: string;
  mode: 'search' | 'research';
  created_at: string;
}

export type SearchHistoryInsert = Omit<SearchHistoryItem, 'id' | 'created_at'>;

// ============================================
// DATABASE SCHEMA TYPE
// ============================================

export interface Database {
  public: {
    Tables: {
      chats: {
        Row: DbChat;
        Insert: ChatInsert;
        Update: Partial<ChatInsert>;
      };
      messages: {
        Row: DbMessage;
        Insert: MessageInsert;
        Update: Partial<MessageInsert>;
      };
      thinking_blocks: {
        Row: DbThinkingBlock;
        Insert: ThinkingBlockInsert;
        Update: Partial<ThinkingBlockInsert>;
      };
      tool_executions: {
        Row: DbToolExecution;
        Insert: ToolExecutionInsert;
        Update: Partial<ToolExecutionInsert>;
      };
      artifacts: {
        Row: DbArtifact;
        Insert: ArtifactInsert;
        Update: ArtifactUpdate;
      };
      files: {
        Row: DbFile;
        Insert: FileInsert;
        Update: FileUpdate;
      };
      mcp_connections: {
        Row: DbMcpConnection;
        Insert: McpConnectionInsert;
        Update: McpConnectionUpdate;
      };
      search_history: {
        Row: SearchHistoryItem;
        Insert: SearchHistoryInsert;
        Update: Partial<SearchHistoryInsert>;
      };
      user_profiles: {
        Row: DbUserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      brand_documents: {
        Row: DbBrandDocument;
        Insert: BrandDocumentInsert;
        Update: BrandDocumentUpdate;
      };
      brand_document_versions: {
        Row: DbBrandDocumentVersion;
        Insert: BrandDocumentVersionInsert;
        Update: never; // Versions are immutable
      };
    };
  };
}

// ============================================
// TYPE CONVERTERS
// ============================================

export function dbThinkingBlockToApp(db: DbThinkingBlock): ThinkingBlock {
  return {
    id: db.id,
    messageId: db.message_id,
    content: db.thinking_content,
    signature: db.signature || undefined,
    isRedacted: db.is_redacted,
    tokenCount: db.token_count || undefined,
    createdAt: db.created_at,
  };
}

export function dbToolExecutionToApp(db: DbToolExecution): ToolExecution {
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

export function dbArtifactToApp(db: DbArtifact): Artifact {
  return {
    id: db.id,
    chatId: db.chat_id,
    messageId: db.message_id || undefined,
    type: db.artifact_type,
    title: db.title || undefined,
    content: db.content,
    language: db.language || undefined,
    version: db.version,
    storagePath: db.storage_path || undefined,
    metadata: db.metadata || {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbFileToApp(db: DbFile, publicUrl?: string): UploadedFile {
  return {
    id: db.id,
    userId: db.user_id || undefined,
    chatId: db.chat_id || undefined,
    messageId: db.message_id || undefined,
    filename: db.filename,
    originalFilename: db.original_filename || undefined,
    storagePath: db.storage_path,
    bucketName: db.bucket_name,
    mimeType: db.mime_type || undefined,
    fileSize: db.file_size || undefined,
    extractedText: db.extracted_text || undefined,
    processingStatus: db.processing_status,
    metadata: db.metadata || {},
    createdAt: db.created_at,
    publicUrl,
  };
}

export function dbMcpConnectionToApp(db: DbMcpConnection): McpConnection {
  return {
    id: db.id,
    userId: db.user_id || undefined,
    name: db.name,
    description: db.description || undefined,
    serverUrl: db.server_url,
    serverType: db.server_type,
    authType: db.auth_type,
    authConfig: db.auth_config || {},
    isActive: db.is_active,
    availableTools: db.available_tools || undefined,
    lastHealthCheck: db.last_health_check || undefined,
    healthStatus: db.health_status,
    createdAt: db.created_at,
    lastUsed: db.last_used || undefined,
  };
}
