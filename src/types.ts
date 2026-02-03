/**
 * Dify Sync Tool - Type Definitions
 */

// ============================================================================
// Environment Configuration
// ============================================================================

export interface EnvConfig {
  url: string;
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
}

// ============================================================================
// Authentication
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export interface LoginResponse {
  result: "success" | "fail";
  data?: {
    access_token?: string;
    refresh_token?: string;
  };
}

// ============================================================================
// Dify DSL Types (v0.5.0)
// ============================================================================

export type AppMode =
  | "chat"
  | "agent-chat"
  | "advanced-chat"
  | "workflow"
  | "completion";

export interface DifyDSL {
  version: string; // e.g., "0.5.0"
  kind: "app";
  app: AppConfig;
  model_config?: ModelConfig;
  workflow?: WorkflowConfig;
  dependencies?: Dependency[];
}

export interface AppConfig {
  name: string;
  mode: AppMode;
  icon: string;
  icon_background?: string;
  description?: string;
  use_icon_as_answer_icon?: boolean;
}

export interface ModelConfig {
  model: {
    provider: string;
    name: string;
    mode: string;
    completion_params?: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      [key: string]: unknown;
    };
  };
  pre_prompt?: string;
  prompt_type?: "simple" | "advanced";
  user_input_form?: unknown[];
  dataset_query_variable?: string;
  opening_statement?: string;
  suggested_questions?: string[];
  sensitive_word_avoidance?: unknown;
  retriever_resource?: unknown;
  agent_mode?: unknown;
  [key: string]: unknown;
}

export interface WorkflowConfig {
  graph: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  features?: Record<string, unknown>;
  environment_variables?: EnvironmentVariable[];
  conversation_variables?: ConversationVariable[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: unknown;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  value_type: "string" | "number" | "secret";
}

export interface ConversationVariable {
  name: string;
  value_type: string;
  description?: string;
}

export interface Dependency {
  type: "plugin";
  plugin_id: string;
  version: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export type ImportMode = "yaml-content" | "yaml-url";

export interface ImportRequest {
  mode: ImportMode;
  yaml_content?: string;
  yaml_url?: string;
  app_id?: string; // For overwriting existing app
  name?: string;
  description?: string;
  icon_type?: string;
  icon?: string;
  icon_background?: string;
}

export type ImportStatus =
  | "completed"
  | "completed-with-warnings"
  | "pending"
  | "failed";

export interface ImportResponse {
  id: string;
  status: ImportStatus;
  app_id?: string;
  app_mode?: AppMode;
  current_dsl_version: string;
  imported_dsl_version: string;
  error?: string;
  warning?: string;
}

export interface ConfirmImportRequest {
  import_id: string;
}

export interface ExportResponse {
  data: string; // YAML content
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================================================
// CLI Types
// ============================================================================

export type Command = "login" | "logout" | "config" | "import" | "export" | "list" | "help";

export interface CLIArgs {
  command: Command;
  args: string[];
  flags: Record<string, string | boolean>;
}
