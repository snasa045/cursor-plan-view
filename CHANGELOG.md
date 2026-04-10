# Changelog

## 0.4.0

- **New Plan File** — command palette action "New Plan File" scaffolds a `.plan.md` with correct frontmatter and two placeholder tasks
- **Search** — press Ctrl+F / Cmd+F to open an in-webview search bar; highlights matches in todos and markdown body, with match count and Escape to close
- **Export** — export plan as HTML (standalone), PDF (browser print dialog), or Docx (Word-compatible); accessible via command palette and editor title bar icon

## 0.3.0

- **Status cycling** — click the status badge to cycle through pending → in-progress → completed
- **Keyboard shortcut** — press Enter to quickly add a new task
- **Test coverage** — 43 tests (up from 28), covering all serializer functions

## 0.2.0

- **Scroll position preservation** — scroll position is maintained across checkbox toggles, add/delete, and undo/redo
- **Drag-and-drop todo reordering** — grab the drag handle (visible on hover) to reorder tasks
- **Status filter** — filter todos by All / Pending / Completed using the pill buttons above the task list

## 0.1.0 — Initial Release

- Custom editor for `*.plan.md` files with rich interactive plan view
- Interactive todo checkboxes — toggle between pending and completed
- Progress bar showing completion percentage
- Inline editing of title, overview, and todo content
- Rendered markdown body with contenteditable editing
- Syntax-highlighted code blocks (TypeScript, JavaScript, JSON, YAML, Python, Bash, CSS, HTML)
- Copy code button on code blocks
- "+New" button to add tasks
- Delete button (hover) to remove tasks
- Clickable markdown task list checkboxes
- Theme-aware styling using VS Code CSS variables (dark + light)
- Auto-redirect: `.plan.md` files always open in Plan View
- 28 unit tests (parser + serializer)
