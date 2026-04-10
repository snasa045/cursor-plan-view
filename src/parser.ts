import * as yaml from 'js-yaml';
import { ParsedPlan, PlanFrontmatter, PlanTodo, TodoStatus } from './types';

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const KNOWN_STATUSES: ReadonlySet<string> = new Set([
  'pending', 'completed', 'in-progress', 'done', 'unknown',
]);

/**
 * Parse a .plan.md file into structured data.
 * Gracefully handles: no frontmatter, malformed YAML, missing fields.
 */
export function parsePlanFile(text: string): ParsedPlan {
  const match = text.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: defaultFrontmatter(),
      markdownBody: text,
      rawFrontmatter: '',
    };
  }

  const rawFrontmatter = match[1];
  const markdownBody = match[2];

  let parsed: Record<string, unknown>;
  try {
    parsed = yaml.load(rawFrontmatter) as Record<string, unknown>;
  } catch {
    return {
      frontmatter: defaultFrontmatter(),
      markdownBody,
      rawFrontmatter,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      frontmatter: defaultFrontmatter(),
      markdownBody,
      rawFrontmatter,
    };
  }

  const frontmatter: PlanFrontmatter = {
    name: typeof parsed.name === 'string' ? parsed.name : 'Untitled Plan',
    overview: typeof parsed.overview === 'string' ? parsed.overview : '',
    todos: normalizeTodos(parsed.todos),
    isProject: typeof parsed.isProject === 'boolean' ? parsed.isProject : false,
  };

  return { frontmatter, markdownBody, rawFrontmatter };
}

function normalizeTodos(raw: unknown): PlanTodo[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((item: unknown, index: number): PlanTodo => {
    if (!item || typeof item !== 'object') {
      return {
        id: `auto-${index}`,
        content: String(item ?? ''),
        status: 'unknown',
      };
    }

    const obj = item as Record<string, unknown>;

    return {
      id: typeof obj.id === 'string' ? obj.id : `auto-${index}`,
      content: typeof obj.content === 'string' ? obj.content : String(obj.content ?? ''),
      status: normalizeStatus(obj.status),
    };
  });
}

function normalizeStatus(raw: unknown): TodoStatus {
  if (typeof raw !== 'string') {
    return 'unknown';
  }
  const lower = raw.toLowerCase().trim();
  return KNOWN_STATUSES.has(lower) ? (lower as TodoStatus) : 'unknown';
}

function defaultFrontmatter(): PlanFrontmatter {
  return {
    name: 'Untitled Plan',
    overview: '',
    todos: [],
    isProject: false,
  };
}
