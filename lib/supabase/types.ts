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
  project_id: string | null;
  title: string;
  quick_action_type: string | null;
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

// Stored attachment info for persistence
export interface StoredAttachment {
  id: string;
  type: 'image';
  data: string; // Base64 data URL or storage URL
  mimeType: string;
  name?: string;
  storagePath?: string; // If uploaded to Supabase Storage
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
  // Image/file attachments
  attachments?: StoredAttachment[];
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
  // Image/file attachments for user messages
  attachments?: StoredAttachment[];
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
  project_id?: string | null;
  quick_action_type?: string | null;
  created_at: string;
  updated_at: string;
}

// Insert types
export interface ChatInsert {
  title: string;
  user_id?: string | null;
  project_id?: string | null;
  quick_action_type?: string | null;
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
// MCP SERVER CONFIG (BOS as MCP Server)
// ============================================

export interface McpApiKey {
  key: string;
  name: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
  created_by?: string;
}

export interface DbMcpServerConfig {
  id: string;
  brand_id: string;
  is_enabled: boolean;
  allowed_tools: string[];
  api_keys: McpApiKey[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  total_requests: number;
  last_request_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface McpServerConfig {
  id: string;
  brandId: string;
  isEnabled: boolean;
  allowedTools: string[];
  apiKeys: McpApiKey[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  totalRequests: number;
  lastRequestAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface McpServerConfigInsert {
  brand_id: string;
  is_enabled?: boolean;
  allowed_tools?: string[];
  api_keys?: McpApiKey[];
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
}

export interface McpServerConfigUpdate {
  is_enabled?: boolean;
  allowed_tools?: string[];
  api_keys?: McpApiKey[];
  rate_limit_per_minute?: number;
  rate_limit_per_day?: number;
}

export interface McpUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByTool: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
}

export function dbMcpServerConfigToApp(db: DbMcpServerConfig): McpServerConfig {
  return {
    id: db.id,
    brandId: db.brand_id,
    isEnabled: db.is_enabled,
    allowedTools: db.allowed_tools || [],
    apiKeys: db.api_keys || [],
    rateLimitPerMinute: db.rate_limit_per_minute,
    rateLimitPerDay: db.rate_limit_per_day,
    totalRequests: db.total_requests,
    lastRequestAt: db.last_request_at || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
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
// BRANDS (Multi-tenant isolation)
// ============================================

export interface BrandSettings {
  colors?: {
    primary?: string;
    charcoal?: string;
    vanilla?: string;
    glass?: string;
  };
  fonts?: {
    display?: string;
    text?: string;
    mono?: string;
  };
  description?: string;
  [key: string]: unknown;
}

export interface DbBrand {
  id: string;
  name: string;
  slug: string;
  settings: BrandSettings;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  settings: BrandSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BrandInsert {
  name: string;
  slug: string;
  settings?: BrandSettings;
}

export interface BrandUpdate {
  name?: string;
  slug?: string;
  settings?: BrandSettings;
}

export function dbBrandToApp(db: DbBrand): Brand {
  return {
    id: db.id,
    name: db.name,
    slug: db.slug,
    settings: db.settings,
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
  brand_id: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content: string;
  icon: string;
  sort_order: number;
  is_system: boolean;
  is_deleted: boolean;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface BrandDocument {
  id: string;
  brandId: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content: string;
  icon: string;
  sortOrder: number;
  isSystem: boolean;
  isDeleted: boolean;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}

export interface BrandDocumentInsert {
  brand_id: string;
  category: BrandDocumentCategory;
  slug: string;
  title: string;
  content?: string;
  icon?: string;
  sort_order?: number;
  is_system?: boolean;
  embedding?: number[];
}

export interface BrandDocumentUpdate {
  title?: string;
  content?: string;
  icon?: string;
  sort_order?: number;
  is_deleted?: boolean;
  embedding?: number[];
}

// ============================================
// BRAND DOCUMENT CHUNKS (RAG retrieval)
// ============================================

export interface DbBrandDocumentChunk {
  id: string;
  document_id: string;
  brand_id: string;
  heading_hierarchy: string[];
  chunk_index: number;
  content: string;
  embedding: number[] | null;
  token_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface BrandDocumentChunk {
  id: string;
  documentId: string;
  brandId: string;
  headingHierarchy: string[];
  chunkIndex: number;
  content: string;
  embedding?: number[];
  tokenCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDocumentChunkInsert {
  document_id: string;
  brand_id: string;
  heading_hierarchy?: string[];
  chunk_index?: number;
  content: string;
  embedding?: number[];
  token_count?: number;
}

export interface BrandDocumentChunkUpdate {
  heading_hierarchy?: string[];
  content?: string;
  embedding?: number[];
  token_count?: number;
}

export function dbBrandDocumentChunkToApp(db: DbBrandDocumentChunk): BrandDocumentChunk {
  return {
    id: db.id,
    documentId: db.document_id,
    brandId: db.brand_id,
    headingHierarchy: db.heading_hierarchy,
    chunkIndex: db.chunk_index,
    content: db.content,
    embedding: db.embedding || undefined,
    tokenCount: db.token_count || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================
// BRAND ASSETS (Semantic asset search)
// ============================================

export type BrandAssetCategory = 'logos' | 'fonts' | 'illustrations' | 'images' | 'textures' | 'icons';

export interface BrandAssetMetadata {
  theme?: string;
  weight?: string;
  format?: string;
  color?: string;
  [key: string]: unknown;
}

export interface DbBrandAsset {
  id: string;
  brand_id: string;
  name: string;
  filename: string;
  description: string;
  category: BrandAssetCategory;
  variant: string | null;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  embedding: number[] | null;
  metadata: BrandAssetMetadata;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  brandId: string;
  name: string;
  filename: string;
  description: string;
  category: BrandAssetCategory;
  variant?: string;
  storagePath: string;
  mimeType?: string;
  fileSize?: number;
  embedding?: number[];
  metadata: BrandAssetMetadata;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed at runtime
  publicUrl?: string;
}

export interface BrandAssetInsert {
  brand_id: string;
  name: string;
  filename: string;
  description: string;
  category: BrandAssetCategory;
  variant?: string;
  storage_path: string;
  mime_type?: string;
  file_size?: number;
  embedding?: number[];
  metadata?: BrandAssetMetadata;
  is_system?: boolean;
}

export interface BrandAssetUpdate {
  name?: string;
  description?: string;
  variant?: string;
  mime_type?: string;
  file_size?: number;
  embedding?: number[];
  metadata?: BrandAssetMetadata;
}

export function dbBrandAssetToApp(db: DbBrandAsset, publicUrl?: string): BrandAsset {
  return {
    id: db.id,
    brandId: db.brand_id,
    name: db.name,
    filename: db.filename,
    description: db.description,
    category: db.category,
    variant: db.variant || undefined,
    storagePath: db.storage_path,
    mimeType: db.mime_type || undefined,
    fileSize: db.file_size || undefined,
    embedding: db.embedding || undefined,
    metadata: db.metadata || {},
    isSystem: db.is_system ?? false,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    publicUrl,
  };
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
    brandId: db.brand_id,
    category: db.category,
    slug: db.slug,
    title: db.title,
    content: db.content,
    icon: db.icon,
    sortOrder: db.sort_order,
    isSystem: db.is_system,
    isDeleted: db.is_deleted,
    embedding: db.embedding || undefined,
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
// BRAND COLORS (Design System)
// ============================================

export type BrandColorGroup = 'brand' | 'mono-scale' | 'brand-scale' | 'custom';
export type BrandColorRole = 'primary' | 'secondary' | 'accent' | 'neutral';
export type BrandTextColor = 'light' | 'dark';

export interface DbBrandColor {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  hex_value: string;
  rgb_value: string | null;
  hsl_value: string | null;
  color_group: BrandColorGroup;
  color_role: BrandColorRole | null;
  text_color: BrandTextColor;
  description: string | null;
  usage_guidelines: string | null;
  css_variable_name: string | null;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  hexValue: string;
  rgbValue?: string;
  hslValue?: string;
  colorGroup: BrandColorGroup;
  colorRole?: BrandColorRole;
  textColor: BrandTextColor;
  description?: string;
  usageGuidelines?: string;
  cssVariableName?: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandColorInsert {
  brand_id: string;
  name: string;
  slug?: string;
  hex_value: string;
  color_group?: BrandColorGroup;
  color_role?: BrandColorRole | null;
  text_color?: BrandTextColor;
  description?: string;
  usage_guidelines?: string;
  css_variable_name?: string;
  sort_order?: number;
  is_system?: boolean;
}

export interface BrandColorUpdate {
  name?: string;
  slug?: string;
  hex_value?: string;
  color_group?: BrandColorGroup;
  color_role?: BrandColorRole | null;
  text_color?: BrandTextColor;
  description?: string;
  usage_guidelines?: string;
  css_variable_name?: string;
  sort_order?: number;
  is_active?: boolean;
}

export function dbBrandColorToApp(db: DbBrandColor): BrandColor {
  return {
    id: db.id,
    brandId: db.brand_id,
    name: db.name,
    slug: db.slug,
    hexValue: db.hex_value,
    rgbValue: db.rgb_value || undefined,
    hslValue: db.hsl_value || undefined,
    colorGroup: db.color_group,
    colorRole: db.color_role || undefined,
    textColor: db.text_color,
    description: db.description || undefined,
    usageGuidelines: db.usage_guidelines || undefined,
    cssVariableName: db.css_variable_name || undefined,
    sortOrder: db.sort_order,
    isSystem: db.is_system,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================
// BRAND GUIDELINES (Brand Hub)
// ============================================

export type BrandGuidelineType = 'figma' | 'pdf' | 'pptx' | 'ppt' | 'link' | 'notion' | 'google-doc';
export type BrandGuidelineCategory = 'brand-identity' | 'messaging' | 'art-direction' | 'ai-guidance' | 'design-system' | 'other';

export interface BrandGuidelineMetadata {
  pageCount?: number;
  lastEdited?: string;
  author?: string;
  version?: string;
  [key: string]: unknown;
}

export interface DbBrandGuideline {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  guideline_type: BrandGuidelineType;
  url: string | null;
  embed_url: string | null;
  storage_path: string | null;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
  metadata: BrandGuidelineMetadata;
  created_at: string;
  updated_at: string;
}

export interface BrandGuideline {
  id: string;
  brandId: string;
  title: string;
  slug: string;
  guidelineType: BrandGuidelineType;
  url?: string;
  embedUrl?: string;
  storagePath?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  sortOrder: number;
  isPrimary: boolean;
  isActive: boolean;
  metadata: BrandGuidelineMetadata;
  createdAt: string;
  updatedAt: string;
  // Computed at runtime
  publicUrl?: string;
}

export interface BrandGuidelineInsert {
  brand_id: string;
  title: string;
  slug?: string;
  guideline_type: BrandGuidelineType;
  url?: string;
  embed_url?: string;
  storage_path?: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  sort_order?: number;
  is_primary?: boolean;
  metadata?: BrandGuidelineMetadata;
}

export interface BrandGuidelineUpdate {
  title?: string;
  slug?: string;
  guideline_type?: BrandGuidelineType;
  url?: string;
  embed_url?: string;
  storage_path?: string;
  description?: string;
  category?: string;
  thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  sort_order?: number;
  is_primary?: boolean;
  is_active?: boolean;
  metadata?: BrandGuidelineMetadata;
}

export function dbBrandGuidelineToApp(db: DbBrandGuideline, publicUrl?: string): BrandGuideline {
  return {
    id: db.id,
    brandId: db.brand_id,
    title: db.title,
    slug: db.slug,
    guidelineType: db.guideline_type,
    url: db.url || undefined,
    embedUrl: db.embed_url || undefined,
    storagePath: db.storage_path || undefined,
    description: db.description || undefined,
    category: db.category || undefined,
    thumbnailUrl: db.thumbnail_url || undefined,
    fileSize: db.file_size || undefined,
    mimeType: db.mime_type || undefined,
    sortOrder: db.sort_order,
    isPrimary: db.is_primary,
    isActive: db.is_active,
    metadata: db.metadata || {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    publicUrl,
  };
}

// ============================================
// BRAND HUB TYPE ALIASES (for clarity)
// ============================================

// Logo assets use brand_assets with category='logos'
// Default variants - users can add custom ones
export type BrandLogoVariant = 'vanilla' | 'glass' | 'charcoal' | string;
// Default logo types - users can add custom ones  
export type BrandLogoType = 'brandmark' | 'combo' | 'stacked' | 'horizontal' | 'core' | 'outline' | 'filled' | string;
// Logo categories for the three-level hierarchy
export type BrandLogoCategory = 'main' | 'accessory';

export interface BrandLogoMetadata extends BrandAssetMetadata {
  // Three-level hierarchy: Category > Type > Variant
  logoCategory?: BrandLogoCategory;  // Level 1: Main or Accessory
  logoType?: BrandLogoType;          // Level 2: Brandmark, Combo, Core, etc.
  variant?: BrandLogoVariant;        // Level 3: Vanilla, Glass, Charcoal, or custom
  // Optional color name for custom variants (e.g., "Primary", "Secondary")
  colorName?: string;
  // Legacy field - kept for backwards compatibility
  isAccessory?: boolean;
}

// Type alias for logos
export type BrandLogo = BrandAsset & {
  category: 'logos';
  metadata: BrandLogoMetadata;
  isSystem: boolean;
};

// Font assets use brand_assets with category='fonts'
export type FontWeight = '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';

export interface BrandFontMetadata extends BrandAssetMetadata {
  fontFamily?: string;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  fontFormat?: FontFormat;
  usage?: string; // e.g., 'display', 'body', 'accent'
  lineHeight?: string;
}

// Type alias for fonts
export type BrandFont = BrandAsset & {
  category: 'fonts';
  metadata: BrandFontMetadata;
};

// Art direction images use brand_assets with category='images'
export type ArtDirectionCategory = 'Auto' | 'Lifestyle' | 'Move' | 'Escape' | 'Work' | 'Feel';

export interface BrandArtImageMetadata extends BrandAssetMetadata {
  artCategory?: ArtDirectionCategory;
  tags?: string[];
  photographer?: string;
  altText?: string;
}

// Type alias for art direction images
export type BrandArtImage = BrandAsset & {
  category: 'images';
  metadata: BrandArtImageMetadata;
};

// ============================================
// CANVAS (Collaborative Editing)
// ============================================

export type CanvasContentType = 'markdown' | 'text' | 'html';
export type CanvasEditedBy = 'user' | 'assistant';

export interface CanvasThemeConfig {
  primaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  accentColor?: string;
  [key: string]: unknown;
}

export interface DbCanvas {
  id: string;
  chat_id: string | null;
  title: string;
  content: string;
  content_type: CanvasContentType;
  version: number;
  last_edited_by: CanvasEditedBy | null;
  previous_content: string | null;
  edit_summary: string | null;
  brand_id: string | null;
  theme_config: CanvasThemeConfig;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Canvas {
  id: string;
  chatId?: string;
  title: string;
  content: string;
  contentType: CanvasContentType;
  version: number;
  lastEditedBy?: CanvasEditedBy;
  previousContent?: string;
  editSummary?: string;
  brandId?: string;
  themeConfig: CanvasThemeConfig;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasInsert {
  chat_id?: string | null;
  title: string;
  content?: string;
  content_type?: CanvasContentType;
  last_edited_by?: CanvasEditedBy;
  edit_summary?: string;
  brand_id?: string | null;
  theme_config?: CanvasThemeConfig;
}

export interface CanvasUpdate {
  title?: string;
  content?: string;
  content_type?: CanvasContentType;
  last_edited_by?: CanvasEditedBy;
  edit_summary?: string;
  brand_id?: string | null;
  theme_config?: CanvasThemeConfig;
  is_archived?: boolean;
}

export function dbCanvasToApp(db: DbCanvas): Canvas {
  return {
    id: db.id,
    chatId: db.chat_id || undefined,
    title: db.title,
    content: db.content,
    contentType: db.content_type,
    version: db.version,
    lastEditedBy: db.last_edited_by || undefined,
    previousContent: db.previous_content || undefined,
    editSummary: db.edit_summary || undefined,
    brandId: db.brand_id || undefined,
    themeConfig: db.theme_config || {},
    isArchived: db.is_archived,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// Canvas version history
export interface DbCanvasVersion {
  id: string;
  canvas_id: string;
  version: number;
  content: string;
  edited_by: CanvasEditedBy | null;
  edit_summary: string | null;
  created_at: string;
}

export interface CanvasVersion {
  id: string;
  canvasId: string;
  version: number;
  content: string;
  editedBy?: CanvasEditedBy;
  editSummary?: string;
  createdAt: string;
}

export interface CanvasVersionInsert {
  canvas_id: string;
  version: number;
  content: string;
  edited_by?: CanvasEditedBy;
  edit_summary?: string;
}

export function dbCanvasVersionToApp(db: DbCanvasVersion): CanvasVersion {
  return {
    id: db.id,
    canvasId: db.canvas_id,
    version: db.version,
    content: db.content,
    editedBy: db.edited_by || undefined,
    editSummary: db.edit_summary || undefined,
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
      brands: {
        Row: DbBrand;
        Insert: BrandInsert;
        Update: BrandUpdate;
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
      brand_document_chunks: {
        Row: DbBrandDocumentChunk;
        Insert: BrandDocumentChunkInsert;
        Update: BrandDocumentChunkUpdate;
      };
      brand_assets: {
        Row: DbBrandAsset;
        Insert: BrandAssetInsert;
        Update: BrandAssetUpdate;
      };
      brand_colors: {
        Row: DbBrandColor;
        Insert: BrandColorInsert;
        Update: BrandColorUpdate;
      };
      brand_guidelines: {
        Row: DbBrandGuideline;
        Insert: BrandGuidelineInsert;
        Update: BrandGuidelineUpdate;
      };
      canvases: {
        Row: DbCanvas;
        Insert: CanvasInsert;
        Update: CanvasUpdate;
      };
      canvas_versions: {
        Row: DbCanvasVersion;
        Insert: CanvasVersionInsert;
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
