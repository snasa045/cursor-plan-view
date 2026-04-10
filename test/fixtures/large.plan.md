---
name: "Large Plan with 20+ Todos"
overview: "Stress test with many todos covering all status types and various ID formats."
todos:
  - id: a1b2c3d4-0001-4000-8000-000000000001
    content: "UUID format task 1"
    status: completed
  - id: a1b2c3d4-0001-4000-8000-000000000002
    content: "UUID format task 2"
    status: pending
  - id: a1b2c3d4-0001-4000-8000-000000000003
    content: "UUID format task 3"
    status: in-progress
  - id: phase-1-setup
    content: "Short string ID task"
    status: completed
  - id: phase-2-impl
    content: "Another short string ID"
    status: pending
  - id: "quoted-id-1"
    content: "Quoted ID task"
    status: completed
  - id: 'single-quoted-id'
    content: "Single quoted ID task"
    status: pending
  - id: task-8
    content: "Task eight"
    status: completed
  - id: task-9
    content: "Task nine"
    status: pending
  - id: task-10
    content: "Task ten"
    status: completed
  - id: task-11
    content: "Task eleven"
    status: pending
  - id: task-12
    content: "Task twelve"
    status: completed
  - id: task-13
    content: "Task thirteen"
    status: pending
  - id: task-14
    content: "Task fourteen"
    status: completed
  - id: task-15
    content: "Task fifteen"
    status: pending
  - id: task-16
    content: "Task sixteen"
    status: completed
  - id: task-17
    content: "Task seventeen"
    status: pending
  - id: task-18
    content: "Task eighteen"
    status: completed
  - id: task-19
    content: "Task nineteen with a very long content string that spans multiple words to test wrapping behavior in the plan view"
    status: pending
  - id: task-20
    content: "Task twenty — the final one"
    status: unknown-custom
isProject: false
---

# Large Plan

## Phase 1: Setup

Steps for setup...

## Phase 2: Implementation

- [ ] Sub-task A
- [x] Sub-task B
- [ ] Sub-task C

## Phase 3: Verification

```bash
npm test
npm run lint
```

> Note: This is a blockquote in the markdown body.
