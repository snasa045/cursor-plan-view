---
name: "Example Plan"
overview: "A sample .plan.md file to demonstrate the Cursor Plan View extension. Open this file to see the rich plan view with interactive checkboxes, progress bar, and rendered markdown."
todos:
  - id: demo-001
    content: "Install the extension and open this file"
    status: completed
  - id: demo-002
    content: "Click a checkbox to toggle its status"
    status: pending
  - id: demo-003
    content: "Click on any text to edit it inline"
    status: pending
  - id: demo-004
    content: "Use the +New button to add a task"
    status: pending
  - id: demo-005
    content: "Hover a task and click × to delete it"
    status: pending
isProject: false
---

## How It Works

This extension renders `.plan.md` files as interactive plan views. The YAML frontmatter above defines the plan metadata (name, overview, todos), and everything below the `---` is rendered as markdown.

### Features

- **Checkboxes** toggle between `pending` and `completed` in the YAML
- **Inline editing** — click any text (title, overview, tasks, or this body) to edit
- **Syntax highlighting** in code blocks:

```typescript
interface PlanTodo {
  id: string;
  content: string;
  status: 'pending' | 'completed' | 'in-progress';
}
```

```json
{
  "contributes": {
    "customEditors": [{
      "viewType": "cursorPlanView.planEditor",
      "selector": [{ "filenamePattern": "*.plan.md" }]
    }]
  }
}
```

### Checklist

- [ ] Try toggling these markdown checkboxes
- [ ] They work inside the rendered body too
- [x] This one is already checked

### Architecture

| Layer | File | Role |
| --- | --- | --- |
| Entry | `extension.ts` | Registers the custom editor |
| Parser | `parser.ts` | YAML frontmatter extraction |
| Serializer | `serializer.ts` | Surgical regex updates |
| View | `htmlBuilder.ts` | Webview HTML generation |

> To see the raw source, right-click the file tab and choose **Open With → Text Editor**.
