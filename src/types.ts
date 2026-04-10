// ── Status values ───────────────────────────────────────────────────
// 'pending' and 'completed' are used in all observed plan files.
// 'in-progress' is a valid Cursor status but not yet seen in the wild.
// 'done' is treated as an alias for 'completed' by the parser.
// 'unknown' is the fallback for any unrecognized status value.
export type TodoStatus = 'pending' | 'completed' | 'in-progress' | 'done' | 'unknown';

export interface PlanTodo {
  readonly id: string;
  readonly content: string;
  readonly status: TodoStatus;
}

export interface PlanFrontmatter {
  readonly name: string;
  readonly overview: string;
  readonly todos: readonly PlanTodo[];
  readonly isProject: boolean;
}

export interface ParsedPlan {
  readonly frontmatter: PlanFrontmatter;
  readonly markdownBody: string;
  readonly rawFrontmatter: string;
}

// ── Webview ↔ Extension messages ────────────────────────────────────

export interface ToggleTodoMessage {
  readonly type: 'toggleTodo';
  readonly todoId: string;
  readonly newStatus: TodoStatus;
}

export interface EditTodoContentMessage {
  readonly type: 'editTodoContent';
  readonly todoId: string;
  readonly newContent: string;
}

export interface EditFrontmatterFieldMessage {
  readonly type: 'editFrontmatterField';
  readonly field: 'name' | 'overview';
  readonly newValue: string;
}

export interface EditMarkdownBodyMessage {
  readonly type: 'editMarkdownBody';
  readonly newBody: string;
}

export interface AddTodoMessage {
  readonly type: 'addTodo';
}

export interface DeleteTodoMessage {
  readonly type: 'deleteTodo';
  readonly todoId: string;
}

export interface ReorderTodosMessage {
  readonly type: 'reorderTodos';
  readonly orderedIds: readonly string[];
}

export interface UpdateMessage {
  readonly type: 'update';
  readonly html: string;
}

export interface ExportReadyMessage {
  readonly type: 'exportReady';
  readonly format: 'html' | 'pdf' | 'docx';
  readonly title: string;
  readonly html: string;
}

export type WebviewMessage =
  | ToggleTodoMessage
  | EditTodoContentMessage
  | EditFrontmatterFieldMessage
  | EditMarkdownBodyMessage
  | AddTodoMessage
  | DeleteTodoMessage
  | ReorderTodosMessage
  | ExportReadyMessage;

export type ExtensionMessage = UpdateMessage;
