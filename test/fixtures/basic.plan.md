---
name: "EPH-5492: UI Delete Action in Primary Scoring Table"
overview: "Add per-row delete action menu, confirmation dialog, backend service call, and snackbar feedback."
todos:
  - id: b2c3d4e5-2222-4bbb-cccc-000000000001
    content: "Identify the Primary Score A table component"
    status: pending
  - id: b2c3d4e5-2222-4bbb-cccc-000000000002
    content: "Add actions column with mat-menu and Delete menu item"
    status: completed
  - id: b2c3d4e5-2222-4bbb-cccc-000000000003
    content: "Add confirmation dialog before delete"
    status: pending
  - id: phase-4-service
    content: "Call backend delete command from UI service"
    status: pending
isProject: false
---

# EPH-5492: UI Delete Action

## Steps

### Step 1: Identify the table
- [ ] Search `ui/src/app/variant/` for the component
- [ ] Find the `mat-table` displaying primary score data

### Step 2: Add actions column

```typescript
deletePrimaryScoreA(variantId: string): Observable<void> {
  return this.http.post<void>(`${apiPath}/${variantId}`, {});
}
```

| What | Where |
|------|-------|
| Variant module | `ui/src/app/variant/` |
| Service | `variant.service.ts` |
