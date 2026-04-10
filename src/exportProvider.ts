import * as vscode from 'vscode';
import * as path from 'node:path';

export type ExportFormat = 'html' | 'pdf' | 'docx';

/**
 * Show the export format picker, then tell the webview to send its HTML snapshot.
 * `postToWebview` is a callback that sends a message to the active webview panel.
 */
export async function promptAndExport(
  postToWebview: (msg: object) => void
): Promise<void> {
  const pick = await vscode.window.showQuickPick(
    [
      { label: '$(globe) HTML', description: 'Standalone HTML file', format: 'html' as ExportFormat },
      { label: '$(file-pdf) PDF', description: 'PDF via system print dialog', format: 'pdf' as ExportFormat },
      { label: '$(file) Docx', description: 'Word document (.docx)', format: 'docx' as ExportFormat },
    ],
    { title: 'Export Plan As', placeHolder: 'Choose export format' }
  );
  if (!pick) { return; }

  postToWebview({ type: 'requestExport', format: pick.format });
}

/**
 * Called when the webview replies with `exportReady`.
 * Writes the exported file next to the source .plan.md and reveals it in the OS.
 */
export async function handleExportReady(
  sourceUri: vscode.Uri,
  format: ExportFormat,
  title: string,
  html: string
): Promise<void> {
  const baseName = path.basename(sourceUri.fsPath, '.plan.md');
  const dir = path.dirname(sourceUri.fsPath);

  if (format === 'html') { await exportHtml(dir, baseName, html); }
  else if (format === 'pdf') { await exportPdf(dir, baseName, html); }
  else if (format === 'docx') { await exportDocx(dir, baseName, title, html); }
}

// ── HTML export ────────────────────────────────────────────────────────────

async function exportHtml(dir: string, baseName: string, html: string): Promise<void> {
  // Remove VS Code webview-specific attributes so the file works in any browser.
  const cleaned = stripWebviewArtifacts(html);
  const outPath = path.join(dir, `${baseName}.html`);
  await writeAndReveal(outPath, cleaned);
}

// ── PDF export ─────────────────────────────────────────────────────────────

async function exportPdf(dir: string, baseName: string, html: string): Promise<void> {
  // Write a print-ready HTML file and open it in the browser.
  // The page auto-triggers the print dialog; user saves as PDF.
  const printCss = `<style>
    @media print {
      .plan-search-bar, .add-todo-btn, .todo-delete-btn,
      .todo-drag-handle, .todo-filter-bar, .code-copy-btn { display: none !important; }
      body { background: #fff !important; color: #000 !important; }
      .plan-container { max-width: 100% !important; padding: 0 !important; }
    }
  </style>
  <script>window.onload = () => window.print();</script>`;

  const cleaned = stripWebviewArtifacts(html).replace('</head>', `${printCss}\n</head>`);
  const tmpPath = path.join(dir, `${baseName}.print-preview.html`);
  await vscode.workspace.fs.writeFile(vscode.Uri.file(tmpPath), Buffer.from(cleaned, 'utf-8'));
  await vscode.env.openExternal(vscode.Uri.file(tmpPath));
  vscode.window.showInformationMessage(
    `Use the browser print dialog (Cmd+P) → "Save as PDF". Temp file: ${path.basename(tmpPath)}`
  );
}

// ── Docx export ────────────────────────────────────────────────────────────

async function exportDocx(dir: string, baseName: string, title: string, html: string): Promise<void> {
  // Word 2003 XML format — opens in Word and LibreOffice without extra dependencies.
  const wordHtml = [
    `<html xmlns:o='urn:schemas-microsoft-com:office:office'`,
    `      xmlns:w='urn:schemas-microsoft-com:office:word'`,
    `      xmlns='http://www.w3.org/TR/REC-html40'>`,
    `<head>`,
    `  <meta charset="UTF-8">`,
    `  <meta name=ProgId content=Word.Document>`,
    `  <title>${escapeXml(title)}</title>`,
    `  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->`,
    `  <style>`,
    `    body { font-family: Calibri, sans-serif; font-size: 11pt; }`,
    `    h1 { font-size: 16pt; } h2 { font-size: 13pt; } h3 { font-size: 12pt; }`,
    `    .todo-drag-handle, .todo-delete-btn, .todo-filter-bar,`,
    `    .plan-search-bar, .add-todo-btn, .code-copy-btn,`,
    `    .progress-bar-track { display: none; }`,
    `    .todo-item { margin: 4pt 0; }`,
    `    .status-badge-completed { color: green; }`,
    `    .status-badge-in-progress { color: navy; }`,
    `    .status-badge-pending { color: gray; }`,
    `  </style>`,
    `</head>`,
    `<body>`,
    extractBodyContent(html),
    `</body>`,
    `</html>`,
  ].join('\n');

  const outPath = path.join(dir, `${baseName}.docx`);
  await writeAndReveal(outPath, wordHtml);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function stripWebviewArtifacts(html: string): string {
  return html
    .replaceAll(/<meta http-equiv="Content-Security-Policy"[^>]*>/gi, '')
    .replaceAll(/vscode-webview-resource:[^"']*/g, '')
    .replaceAll(/ nonce="[^"]*"/g, '');
}

async function writeAndReveal(filePath: string, content: string): Promise<void> {
  await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(content, 'utf-8'));
  await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filePath));
  vscode.window.showInformationMessage(`Exported: ${path.basename(filePath)}`);
}

function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
