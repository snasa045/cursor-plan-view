import * as vscode from 'vscode';
import { parsePlanFile } from './parser';
import { updateTodoStatus, updateTodoContent, updateFrontmatterField, updateMarkdownBody, addTodo, deleteTodo, reorderTodos } from './serializer';
import { buildWebviewHtml } from './htmlBuilder';
import { WebviewMessage } from './types';

export class PlanEditorProvider implements vscode.CustomTextEditorProvider {

  static readonly viewType = 'cursorPlanView.planEditor';

  /**
   * When true, the next onDidChangeTextDocument event is suppressed
   * (the change came from the webview — no need to re-render).
   */
  private suppressNextRerender = false;

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      PlanEditorProvider.viewType,
      new PlanEditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }
    );
  }

  private constructor(private readonly context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void {
    const webview = webviewPanel.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
      ],
    };

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'planView.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'planView.js')
    );

    // Initial render
    this.updateWebview(document, webview, cssUri, jsUri);

    // Re-render only on external changes (undo, redo, revert, other editors).
    // Webview-initiated edits set suppressNextRerender to avoid a flash.
    const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        if (this.suppressNextRerender) {
          this.suppressNextRerender = false;
          return;
        }
        this.updateWebview(document, webview, cssUri, jsUri);
      }
    });

    const messageSubscription = webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      if (message.type === 'toggleTodo') {
        // Checkbox toggles DO re-render (progress bar needs updating)
        this.handleToggleTodo(document, message.todoId, message.newStatus);
      } else if (message.type === 'editTodoContent') {
        this.handleInlineEdit(document, (text) => updateTodoContent(text, message.todoId, message.newContent));
      } else if (message.type === 'editFrontmatterField') {
        this.handleInlineEdit(document, (text) => updateFrontmatterField(text, message.field, message.newValue));
      } else if (message.type === 'editMarkdownBody') {
        this.handleInlineEdit(document, (text) => updateMarkdownBody(text, message.newBody));
      } else if (message.type === 'addTodo') {
        const currentText = document.getText();
        await this.applyEdit(document, currentText, addTodo(currentText));
      } else if (message.type === 'deleteTodo') {
        const currentText = document.getText();
        await this.applyEdit(document, currentText, deleteTodo(currentText, message.todoId));
      } else if (message.type === 'reorderTodos') {
        const currentText = document.getText();
        await this.applyEdit(document, currentText, reorderTodos(currentText, message.orderedIds));
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
      messageSubscription.dispose();
    });
  }

  private updateWebview(
    document: vscode.TextDocument,
    webview: vscode.Webview,
    cssUri: vscode.Uri,
    jsUri: vscode.Uri
  ): void {
    const plan = parsePlanFile(document.getText());
    webview.html = buildWebviewHtml(webview, plan, cssUri, jsUri);
  }

  /** Inline text edits suppress re-render (the webview already shows the edit). */
  private async handleInlineEdit(
    document: vscode.TextDocument,
    transform: (text: string) => string
  ): Promise<void> {
    this.suppressNextRerender = true;
    const currentText = document.getText();
    await this.applyEdit(document, currentText, transform(currentText));
  }

  private async handleToggleTodo(
    document: vscode.TextDocument,
    todoId: string,
    newStatus: string
  ): Promise<void> {
    const currentText = document.getText();
    await this.applyEdit(document, currentText, updateTodoStatus(currentText, todoId, newStatus as any));
  }

  private async applyEdit(
    document: vscode.TextDocument,
    currentText: string,
    updatedText: string
  ): Promise<void> {
    if (updatedText === currentText) {
      this.suppressNextRerender = false;
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      updatedText
    );
    await vscode.workspace.applyEdit(edit);
    await document.save();
  }
}
