import * as crypto from 'node:crypto';
import { TodoStatus } from './types';

/**
 * Surgically update a single todo's status in the raw file text.
 */
export function updateTodoStatus(
  fileText: string,
  todoId: string,
  newStatus: TodoStatus
): string {
  const escapedId = escapeRegex(todoId);
  const pattern = new RegExp(
    String.raw`(- id:\s*["']?${escapedId}["']?\s*\n(?:(?!- id:)[\s\S])*?)(status:\s*)([a-z_-]+)`,
  );
  if (!fileText.match(pattern)) { return fileText; }
  return fileText.replace(pattern, `$1$2${newStatus}`);
}

/**
 * Surgically update a single todo's content string in the raw file text.
 */
export function updateTodoContent(
  fileText: string,
  todoId: string,
  newContent: string
): string {
  const escapedId = escapeRegex(todoId);
  const pattern = new RegExp(
    String.raw`(- id:\s*["']?${escapedId}["']?\s*\n(?:(?!- id:)[\s\S])*?)(content:\s*)(["']?)([\s\S]*?)\3(\s*\n)`
  );
  const match = fileText.match(pattern);
  if (!match) { return fileText; }
  const quoteChar = match[3] || '"';
  const escapedContent = newContent
    .replaceAll('\\', '\\\\')
    .replaceAll(quoteChar, `\\${quoteChar}`);
  return fileText.replace(pattern, `$1$2${quoteChar}${escapedContent}${quoteChar}$5`);
}

/**
 * Update a top-level YAML frontmatter string field (name, overview, etc.).
 * Preserves existing quoting style. Only operates within the frontmatter block.
 */
export function updateFrontmatterField(
  fileText: string,
  field: 'name' | 'overview',
  newValue: string
): string {
  // Match only inside the leading frontmatter block (between the two --- delimiters)
  const frontmatterMatch = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) { return fileText; }

  const escapedField = escapeRegex(field);
  // Matches: <field>: "value" or <field>: 'value' or <field>: bare value
  const pattern = new RegExp(
    String.raw`(^${escapedField}:\s*)(["']?)(.*?)\2(\s*$)`,
    'm'
  );

  const frontmatter = frontmatterMatch[1];
  const match = frontmatter.match(pattern);
  if (!match) { return fileText; }

  const quoteChar = match[2] || '"';
  const escapedValue = newValue
    .replaceAll('\\', '\\\\')
    .replaceAll(quoteChar, `\\${quoteChar}`);

  const updatedFrontmatter = frontmatter.replace(
    pattern,
    `$1${quoteChar}${escapedValue}${quoteChar}$4`
  );

  return fileText.replace(frontmatterMatch[1], updatedFrontmatter);
}

/**
 * Replace the markdown body — everything after the closing --- delimiter.
 */
export function updateMarkdownBody(
  fileText: string,
  newBody: string
): string {
  // Split at the closing --- of the frontmatter
  const closingDelimiter = /^---\r?\n/m;
  // Find the second occurrence (first is the opening, second is the closing)
  const firstDelimiterEnd = fileText.indexOf('---\n') + 4;
  const rest = fileText.slice(firstDelimiterEnd);
  const closingMatch = rest.match(closingDelimiter);
  if (!closingMatch || closingMatch.index === undefined) { return fileText; }

  const frontmatterSection = fileText.slice(0, firstDelimiterEnd + closingMatch.index + closingMatch[0].length);
  const separator = newBody.startsWith('\n') ? '' : '\n';
  return `${frontmatterSection}${separator}${newBody}`;
}

/**
 * Insert a new task entry at the end of the tasks list in the YAML frontmatter.
 * Generates a UUID and sets status to "pending".
 */
export function addTodo(fileText: string): string {
  const id = crypto.randomUUID();
  const newEntry = `  - id: ${id}\n    content: "New task"\n    status: pending\n`;

  // Find the boundary — the line before `isProject:` or the closing `---`
  const insertPattern = /(\n)(isProject:)/;
  const insertPoint = insertPattern.exec(fileText);
  if (insertPoint?.index !== undefined) {
    return fileText.slice(0, insertPoint.index + 1) + newEntry + fileText.slice(insertPoint.index + 1);
  }

  // Fallback: insert before the closing ---
  const closingIdx = fileText.indexOf('---', fileText.indexOf('---') + 3);
  if (closingIdx !== -1) {
    return fileText.slice(0, closingIdx) + newEntry + fileText.slice(closingIdx);
  }

  return fileText;
}

/**
 * Remove a task entry from the YAML frontmatter by ID.
 */
export function deleteTodo(fileText: string, todoId: string): string {
  const escapedId = escapeRegex(todoId);
  // Match the entire todo block: `  - id: <targetId>\n    content: ...\n    status: ...\n`
  const pattern = new RegExp(
    String.raw`\s*- id:\s*["']?${escapedId}["']?\s*\n(?:(?!- id:)[\s\S])*?(?=\s*- id:|\s*isProject:|---)`
  );
  return fileText.replace(pattern, '');
}

/**
 * Reorder the tasks in the YAML frontmatter to match the given ID sequence.
 * Extracts each task block by ID, then reassembles them in the new order.
 */
export function reorderTodos(fileText: string, orderedIds: readonly string[]): string {
  // Find the todos section boundaries
  const todosStart = fileText.search(/^ {2}- id:/m);
  const todosEndMatch = /\nisProject:/.exec(fileText) ?? /\n---/.exec(fileText.slice(fileText.indexOf('---') + 3));
  if (todosStart === -1 || !todosEndMatch?.index) { return fileText; }

  const todosEnd = todosEndMatch.index + (fileText.indexOf('---') + 3);
  const todosSection = fileText.slice(todosStart, todosEnd);

  // Split into individual blocks at each `  - id:` boundary
  const blockStarts = [...todosSection.matchAll(/^ {2}- id:/gm)].map(m => m.index);
  const blocks = new Map<string, string>();

  for (let i = 0; i < blockStarts.length; i++) {
    const start = blockStarts[i];
    const end = i + 1 < blockStarts.length ? blockStarts[i + 1] : todosSection.length;
    const block = todosSection.slice(start, end);
    const idMatch = /- id:\s*["']?([\w-]+)/.exec(block);
    if (idMatch) { blocks.set(idMatch[1], block); }
  }

  if (blocks.size === 0) { return fileText; }

  const reordered = orderedIds
    .filter(id => blocks.has(id))
    .map(id => blocks.get(id)!)
    .join('');

  return fileText.slice(0, todosStart) + reordered + fileText.slice(todosEnd);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

