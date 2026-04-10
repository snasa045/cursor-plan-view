import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';
import xml from 'highlight.js/lib/languages/xml';
import { ParsedPlan, PlanTodo, TodoStatus } from './types';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      let result: string;
      if (lang && hljs.getLanguage(lang)) {
        result = hljs.highlight(code, { language: lang }).value;
      } else {
        result = hljs.highlightAuto(code).value;
      }
      // highlight.js only produces <span> tags. Any other HTML tag in the output
      // means the grammar failed to escape it (e.g. JSX tags like <body>, <main>).
      // Escape them so the browser renders them as text, not elements.
      return result.replaceAll(/<(?!\/?span[\s>])/g, '&lt;');
    },
  }) as any
);

export function buildWebviewHtml(
  webview: vscode.Webview,
  plan: ParsedPlan,
  cssUri: vscode.Uri,
  jsUri: vscode.Uri
): string {
  const nonce = generateNonce();
  const cspSource = webview.cspSource;

  const { name, overview, todos, isProject } = plan.frontmatter;
  const completedCount = todos.filter(t => isCompleted(t.status)).length;
  const totalCount = todos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const todosHtml = todos.map(todo => buildTodoItem(todo)).join('\n');
  const renderedMarkdown = wrapCodeBlocks(marked.parse(plan.markdownBody) as string);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
      style-src ${cspSource} 'unsafe-inline';
      script-src 'nonce-${nonce}';
      img-src ${cspSource} https: data:;
      font-src ${cspSource};">
  <link rel="stylesheet" href="${cssUri}">
  <title>${escapeHtml(name)}</title>
</head>
<body>
  <div class="plan-search-bar" id="planSearchBar" hidden>
    <input class="plan-search-input" id="planSearchInput" type="search"
           placeholder="Search todos and notes\u2026" autocomplete="off" spellcheck="false">
    <span class="plan-search-count" id="planSearchCount"></span>
    <button class="plan-search-close" id="planSearchClose" type="button" title="Close search (Escape)">\u00d7</button>
  </div>

  <div class="plan-container">
    <header class="plan-header">
      <h1 class="plan-title editable-field"
          contenteditable="true"
          data-field="name"
          spellcheck="false">${escapeHtml(name)}</h1>
      ${isProject ? '<span class="plan-badge">Project</span>' : ''}
      ${overview
        ? `<p class="plan-overview editable-field"
              contenteditable="true"
              data-field="overview">${escapeHtml(overview)}</p>`
        : `<p class="plan-overview editable-field plan-overview-empty"
              contenteditable="true"
              data-field="overview"
              data-placeholder="Add an overview\u2026"></p>`}
    </header>

    <section class="plan-body markdown-body"
             contenteditable="true"
             spellcheck="true"
             data-placeholder="Click to add notes\u2026">${renderedMarkdown}</section>

    <hr class="plan-divider">
    <section class="plan-progress">
      <div class="progress-label">
        <span>Progress</span>
        <span class="progress-count">${completedCount} / ${totalCount} (${progressPercent}%)</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
      </div>
    </section>

    <section class="plan-todos" data-filter="all">
      <div class="todo-filter-bar">
        <button class="todo-filter-btn active" data-filter-value="all" type="button">All</button>
        <button class="todo-filter-btn" data-filter-value="pending" type="button">Pending</button>
        <button class="todo-filter-btn" data-filter-value="completed" type="button">Completed</button>
      </div>
      ${todosHtml}
      <button class="add-todo-btn" type="button">+ New</button>
    </section>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

function buildTodoItem(todo: PlanTodo): string {
  const checked = isCompleted(todo.status) ? 'checked' : '';
  const statusClass = `todo-${todo.status}`;
  const badgeClass = `status-badge-${todo.status}`;
  const displayStatus = todo.status === 'in-progress' ? 'in progress' : todo.status;

  return `<label class="todo-item ${statusClass}" data-todo-id="${escapeHtml(todo.id)}" draggable="true">
  <span class="todo-drag-handle" title="Drag to reorder">\u2261</span>
  <input type="checkbox" class="todo-checkbox" ${checked}>
  <span class="todo-content">${escapeHtml(todo.content)}</span>
  <span class="todo-status-badge ${badgeClass}" data-status="${todo.status}">${escapeHtml(displayStatus)}</span>
  <button class="todo-delete-btn" type="button" title="Delete">\u00d7</button>
</label>`;
}

function isCompleted(status: TodoStatus): boolean {
  return status === 'completed' || status === 'done';
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const copyIconSvg = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M5 11H3.5A1.5 1.5 0 0 1 2 9.5v-7A1.5 1.5 0 0 1 3.5 1h7A1.5 1.5 0 0 1 12 2.5V5"/></svg>';

function wrapCodeBlocks(html: string): string {
  return html.replaceAll(
    /<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g,
    (_match, attrs: string, code: string) => {
      const langMatch = /language-(\w+)/.exec(attrs);
      const lang = langMatch ? langMatch[1] : '';
      return `<div class="code-block-wrapper">
        <div class="code-block-header" contenteditable="false">
          <span class="code-block-lang">${lang}</span>
          <button class="code-copy-btn" type="button" title="Copy code">${copyIconSvg}</button>
        </div>
        <pre><code${attrs}>${code}</code></pre>
      </div>`;
    }
  );
}
