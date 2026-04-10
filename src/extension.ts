import * as vscode from 'vscode';
import { PlanEditorProvider } from './planEditorProvider';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(PlanEditorProvider.register(context));

  // Auto-redirect .plan.md files from the default text editor to Plan View.
  // This handles the case where VS Code cached a text editor association
  // before the extension was installed.
  const redirecting = new Set<string>();

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (!editor) { return; }
      const uri = editor.document.uri;
      if (!uri.path.endsWith('.plan.md')) { return; }

      const key = uri.toString();
      if (redirecting.has(key)) { return; }

      redirecting.add(key);
      try {
        await vscode.commands.executeCommand(
          'vscode.openWith',
          uri,
          PlanEditorProvider.viewType
        );
      } finally {
        redirecting.delete(key);
      }
    })
  );
}

export function deactivate(): void {}
