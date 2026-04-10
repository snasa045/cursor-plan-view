import * as vscode from 'vscode';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { PlanEditorProvider } from './planEditorProvider';

export function activate(context: vscode.ExtensionContext): void {
  const redirecting = new Set<string>();

  context.subscriptions.push(
    PlanEditorProvider.register(context),

    // ── "New Plan File" command ────────────────────────────────────────
    vscode.commands.registerCommand('cursorPlanView.newPlanFile', async () => {
      // Pick the folder: active file's directory → first workspace folder → home
      const activeFile = vscode.window.activeTextEditor?.document.uri;
      const defaultFolder = activeFile
        ? vscode.Uri.joinPath(activeFile, '..')
        : vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(os.homedir());

      const destUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.joinPath(defaultFolder, 'my-plan.plan.md'),
        filters: { 'Plan File': ['plan.md'] },
        title: 'Create New Plan File',
        saveLabel: 'Create',
      });
      if (!destUri) { return; }

      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      const name = path.basename(destUri.fsPath, '.plan.md');
      const template = [
        '---',
        `name: "${name}"`,
        'overview: "Short description of this plan"',
        'todos:',
        `  - id: ${id1}`,
        '    content: "First task"',
        '    status: pending',
        `  - id: ${id2}`,
        '    content: "Second task"',
        '    status: pending',
        'isProject: false',
        '---',
        '',
        '## Notes',
        '',
        'Add context, links, or reference material here.',
        '',
      ].join('\n');

      await vscode.workspace.fs.writeFile(destUri, Buffer.from(template, 'utf-8'));
      await vscode.commands.executeCommand('vscode.openWith', destUri, PlanEditorProvider.viewType);
    }),

    // ── Auto-redirect .plan.md files from the default text editor to Plan View.
    // Handles the case where VS Code cached a text editor association
    // before the extension was installed.
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
