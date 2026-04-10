# Cursor Plan View

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/nasares.cursor-plan-view?label=VS%20Code%20Marketplace&color=0078d4)](https://marketplace.visualstudio.com/items?itemName=nasares.cursor-plan-view)

Render `.plan.md` files as rich interactive plan views in VS Code — matching Cursor IDE's native plan experience.

**[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nasares.cursor-plan-view)**

> **What is a `.plan.md` file?** It's a markdown file with YAML frontmatter that defines a plan: a name, overview, and a list of todos with statuses. Cursor IDE renders these as interactive plan views. This extension brings that same experience to VS Code.

## Prerequisites

### File naming

The file **must** end with `.plan.md` — for example `my-project.plan.md`. Regular `.md` files are not affected by this extension.

### Required YAML frontmatter

Every `.plan.md` file must start with a valid YAML frontmatter block. The extension will not render without it.

```yaml
---
name: "Short plan title"
overview: "One-line description of the plan"
todos:
  - id: <uuid>
    content: "Description of the task"
    status: pending
isProject: false
---
```

#### Field reference

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Title shown at the top of the plan view |
| `overview` | string | No | Subtitle shown below the title |
| `todos` | array | Yes | List of task items (can be empty `[]`) |
| `todos[].id` | string (UUID) | Yes | Unique identifier — must be a valid UUID |
| `todos[].content` | string | Yes | The task description |
| `todos[].status` | string | Yes | One of: `pending`, `completed`, `in-progress`, `error` |
| `isProject` | boolean | No | Shows a "Project" badge on the plan view |

### Generating UUIDs for `id`

Each todo requires a unique UUID. There are several ways to generate one:

**Terminal (macOS / Linux):**

```bash
uuidgen
# Example output: A1B2C3D4-0001-4000-8000-000000000001
```

**Node.js / JavaScript:**

```javascript
crypto.randomUUID()
// Example output: "a1b2c3d4-0001-4000-8000-000000000001"
```

**Python:**

```python
import uuid
str(uuid.uuid4())
# Example output: "a1b2c3d4-0001-4000-8000-000000000001"
```

**Online:** [uuidgenerator.net](https://www.uuidgenerator.net)

> **Tip:** You don't need to generate UUIDs manually — use the **+ New** button in the Plan View to add tasks with auto-generated UUIDs.

### Complete working example

Save the following as `my-feature.plan.md`:

```yaml
---
name: "API Integration"
overview: "Integrate the payment gateway into the checkout flow"
todos:
  - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    content: "Read the Stripe API documentation"
    status: completed
  - id: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
    content: "Create a Stripe account and get API keys"
    status: completed
  - id: 6ba7b811-9dad-11d1-80b4-00c04fd430c8
    content: "Implement the checkout session endpoint"
    status: in-progress
  - id: 6ba7b812-9dad-11d1-80b4-00c04fd430c8
    content: "Add webhook handler for payment confirmation"
    status: pending
  - id: 6ba7b813-9dad-11d1-80b4-00c04fd430c8
    content: "Write integration tests"
    status: pending
isProject: false
---

## Notes

Add any context, links, or reference material here. This section renders as formatted markdown.

- [Stripe API Docs](https://stripe.com/docs/api)
- Webhook secret stored in `.env` as `STRIPE_WEBHOOK_SECRET`
```

## Features

Click checkboxes to toggle todos between **pending** and **completed**. Changes write directly to the YAML frontmatter — integrated with VS Code's undo/redo (Cmd+Z / Ctrl+Z).

### Progress Tracking

A progress bar at the bottom shows completion at a glance: `8 / 12 (67%)`.

### Inline Editing

Click any text to edit it in place:

- **Plan title** — click the heading to rename
- **Overview** — click to edit the description
- **Todo content** — click any task's text to rewrite it
- **Markdown body** — click anywhere in the rendered content to edit

No mode switching, no raw YAML — edit the rich view directly.

### Add and Delete Tasks

- **+ New** button below the task list adds a new todo
- Hover any task to reveal the **×** delete button

### Syntax-Highlighted Code Blocks

Fenced code blocks render with syntax highlighting for TypeScript, JavaScript, JSON, YAML, Python, Bash, CSS, and HTML. Each block includes:

- **Language label** in the header
- **Copy button** — one click to copy the code

### Theme-Aware

Adapts to VS Code's light, dark, and high-contrast themes using native CSS variables. Syntax highlighting colors match VS Code's default Dark+ and Light+ themes.

### Markdown Body

Everything below the YAML frontmatter renders as formatted markdown:

- Headings, paragraphs, and blockquotes
- Tables with proper alignment
- Ordered and unordered lists
- Task list checkboxes (clickable)
- Inline code and fenced code blocks
- Links and images

### Auto-Detection

`.plan.md` files automatically open in Plan View — even if they were previously opened as raw text. To see the source, right-click the tab → **Open With → Text Editor**.

### Drag-and-Drop Reordering

Hover over any task to reveal the **≡** drag handle. Grab it and drag to reorder tasks — the new order saves directly to the YAML frontmatter.

### Status Filter

Filter your task list with pill buttons above the todos:

- **All** — show everything
- **Pending** — only uncompleted tasks
- **Completed** — only finished tasks

Filtering is instant (CSS-only, no re-render).

### Scroll Position Preservation

Scroll position is maintained across checkbox toggles, add/delete operations, and undo/redo. No more jumping back to the top after every interaction.

### Status Cycling

Click any task's status badge to cycle through statuses. The badge rotates: **pending → in-progress → completed → pending**. Faster than toggling the checkbox when you want to mark a task as in-progress rather than jumping straight to completed.

### Keyboard Shortcut

Press **Enter** to quickly add a new task. The new task appears at the bottom of the todo list with status `pending` and an auto-generated UUID — ready to edit immediately.

### New Plan File

Open the command palette (`Cmd+Shift+P`) and run **Plan View: New Plan File**. A save dialog lets you choose a location and name. The file is created with valid YAML frontmatter and two placeholder tasks, then immediately opens in Plan View.

### Search

Press **Ctrl+F** / **Cmd+F** to open the search bar at the top of the plan view. As you type:

- Matching text is highlighted in both the todo list and the markdown body
- Non-matching todos are hidden so you can focus on relevant tasks
- A match count shows how many results were found
- Press **Escape** or click **×** to close search and clear highlights

### Export

Click the **$(export) Export** icon in the editor title bar, or run **Plan View: Export Plan** from the command palette. Three formats are available:

| Format | Output |
| --- | --- |
| **HTML** | Standalone `.html` file — opens in any browser, no VS Code required |
| **PDF** | Opens a print-ready page in your browser; use **Cmd+P → Save as PDF** |
| **Docx** | Word-compatible `.docx` file — opens in Word and LibreOffice |

The exported file is saved next to the `.plan.md` source and revealed in Finder / Explorer.

## Plan File Format

The extension reads the YAML frontmatter format used by Cursor's plan feature:

```yaml
---
name: "My Project Plan"
overview: "Short description of the plan"
todos:
  - id: a1b2c3d4-0001-4000-8000-000000000001
    content: "First task to complete"
    status: pending
  - id: a1b2c3d4-0001-4000-8000-000000000002
    content: "Second task"
    status: completed
  - id: a1b2c3d4-0001-4000-8000-000000000003
    content: "Third task in progress"
    status: in-progress
isProject: false
---

# Notes

Any markdown content below the closing `---` renders as formatted text.
```

### Supported Status Values

| Value | Display |
| --- | --- |
| `pending` | Unchecked checkbox |
| `completed` | Checked with strikethrough |
| `in-progress` | Blue badge |
| `error` | Red badge |

## Requirements

- VS Code 1.85.0 or later

## How It Works

The extension registers a `CustomTextEditorProvider` for `*.plan.md` files. When you open a plan file:

1. **Parser** extracts the YAML frontmatter (name, overview, todos) and markdown body
2. **HTML Builder** renders a rich webview with interactive checkboxes, progress bar, and formatted markdown
3. **Webview JS** handles clicks, inline editing, and sends messages back to the extension
4. **Serializer** applies surgical regex updates to the YAML — only the changed field is modified, preserving all formatting

All changes integrate with VS Code's edit history. Undo, redo, and save work as expected.

## Known Limitations

- HTML-to-markdown conversion may lose some inline formatting on save
- No file watcher for external changes outside VS Code

## Release Notes

### 0.4.0

- **New Plan File** — command palette action scaffolds a `.plan.md` with correct frontmatter
- **Search** — Ctrl+F / Cmd+F to search todos and markdown body with live highlights
- **Export** — export as HTML, PDF, or Docx from the editor title bar or command palette

### 0.3.0

- **Status cycling** — click the status badge to cycle through pending → in-progress → completed
- **Keyboard shortcut** — press Enter to quickly add a new task
- **Test coverage** — 43 tests (up from 28), covering all serializer functions

### 0.2.0

- Scroll position preserved across checkbox toggles, add/delete, and undo/redo
- Drag-and-drop todo reordering with drag handle
- Status filter bar (All / Pending / Completed)

### 0.1.0

Initial release.

- Rich plan view for `*.plan.md` files
- Interactive checkboxes with undo/redo
- Inline editing of all fields
- Syntax-highlighted code blocks with copy button
- Add and delete tasks
- Progress bar and theme-aware styling
- Auto-redirect from text editor to plan view
- 28 unit tests (parser + serializer)

## License

MIT
