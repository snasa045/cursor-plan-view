# Changelog

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
