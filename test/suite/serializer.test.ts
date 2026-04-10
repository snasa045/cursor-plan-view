import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { updateTodoStatus, updateTodoContent, addTodo, deleteTodo, reorderTodos } from '../../src/serializer';

const fixturesDir = path.join(__dirname, '..', '..', 'test', 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('updateTodoStatus', () => {

  it('changes pending to completed (UUID ID)', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    const match = result.match(/b2c3d4e5-2222-4bbb-cccc-000000000001[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match?.[1], 'completed');
  });

  it('changes completed to pending', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000002', 'pending');
    const match = result.match(/b2c3d4e5-2222-4bbb-cccc-000000000002[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match?.[1], 'pending');
  });

  it('returns unchanged text for non-existent ID', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'non-existent-id-12345', 'completed');
    assert.strictEqual(result, text);
  });

  it('handles short string ID', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'phase-4-service', 'completed');
    const match = result.match(/phase-4-service[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match?.[1], 'completed');
  });

  it('preserves formatting of other parts', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    assert.ok(result.includes('name: "EPH-5492: UI Delete Action in Primary Scoring Table"'));
    assert.ok(result.includes('overview: "Add per-row delete action'));
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000003'));
  });

  it('handles the first todo in the list', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    assert.notStrictEqual(result, text);
  });

  it('handles the last todo in the list', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'phase-4-service', 'completed');
    assert.notStrictEqual(result, text);
  });

  it('only modifies the targeted todo, not adjacent ones', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    const match3 = result.match(/b2c3d4e5-2222-4bbb-cccc-000000000003[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match3?.[1], 'pending');
  });

  it('handles quoted IDs in large file', () => {
    const text = readFixture('large.plan.md');
    const result = updateTodoStatus(text, 'quoted-id-1', 'pending');
    const match = result.match(/quoted-id-1[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match?.[1], 'pending');
  });

  it('handles single-quoted IDs', () => {
    const text = readFixture('large.plan.md');
    const result = updateTodoStatus(text, 'single-quoted-id', 'completed');
    const match = result.match(/single-quoted-id[\s\S]*?status:\s*(\S+)/);
    assert.strictEqual(match?.[1], 'completed');
  });

  it('preserves markdown body unchanged', () => {
    const text = readFixture('basic.plan.md');
    const bodyMarker = '# EPH-5492: UI Delete Action';
    const bodyBefore = text.substring(text.indexOf(bodyMarker));
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    const bodyAfter = result.substring(result.indexOf(bodyMarker));
    assert.strictEqual(bodyAfter, bodyBefore);
  });
});

describe('updateTodoContent', () => {

  it('updates content of a quoted-content task', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoContent(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'Updated task description');
    assert.ok(result.includes('Updated task description'));
    assert.ok(!result.includes('Identify the Primary Score A table component'));
  });

  it('returns unchanged text for non-existent ID', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoContent(text, 'non-existent-id', 'New content');
    assert.strictEqual(result, text);
  });

  it('preserves other tasks unchanged', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoContent(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'Changed');
    assert.ok(result.includes('Add actions column with mat-menu and Delete menu item'));
    assert.ok(result.includes('Add confirmation dialog before delete'));
  });

  it('handles special characters in new content', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoContent(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'Task with "quotes" and special chars');
    assert.ok(result.includes('Task with'));
  });
});

describe('addTodo', () => {

  it('adds a new task to the file', () => {
    const text = readFixture('basic.plan.md');
    const result = addTodo(text);
    assert.ok(result.includes('content: "New task"'));
    assert.ok(result.includes('status: pending'));
  });

  it('preserves existing tasks', () => {
    const text = readFixture('basic.plan.md');
    const result = addTodo(text);
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000001'));
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000002'));
    assert.ok(result.includes('phase-4-service'));
  });

  it('inserts before isProject field', () => {
    const text = readFixture('basic.plan.md');
    const result = addTodo(text);
    const newTaskIdx = result.indexOf('content: "New task"');
    const isProjectIdx = result.indexOf('isProject:');
    assert.ok(newTaskIdx < isProjectIdx);
  });

  it('generates a unique UUID for each call', () => {
    const text = readFixture('basic.plan.md');
    const result1 = addTodo(text);
    const result2 = addTodo(text);
    const idPattern = /- id: ([\w-]+)\n\s*content: "New task"/;
    const id1 = idPattern.exec(result1)?.[1];
    const id2 = idPattern.exec(result2)?.[1];
    assert.ok(id1);
    assert.ok(id2);
    assert.notStrictEqual(id1, id2);
  });
});

describe('deleteTodo', () => {

  it('removes a task by ID', () => {
    const text = readFixture('basic.plan.md');
    const result = deleteTodo(text, 'b2c3d4e5-2222-4bbb-cccc-000000000002');
    assert.ok(!result.includes('b2c3d4e5-2222-4bbb-cccc-000000000002'));
  });

  it('preserves other tasks', () => {
    const text = readFixture('basic.plan.md');
    const result = deleteTodo(text, 'b2c3d4e5-2222-4bbb-cccc-000000000002');
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000001'));
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000003'));
    assert.ok(result.includes('phase-4-service'));
  });

  it('returns unchanged text for non-existent ID', () => {
    const text = readFixture('basic.plan.md');
    const result = deleteTodo(text, 'non-existent-id');
    assert.strictEqual(result, text);
  });

  it('preserves markdown body', () => {
    const text = readFixture('basic.plan.md');
    const bodyMarker = '# EPH-5492: UI Delete Action';
    const result = deleteTodo(text, 'b2c3d4e5-2222-4bbb-cccc-000000000002');
    assert.ok(result.includes(bodyMarker));
  });
});

describe('reorderTodos', () => {

  it('reverses the order of tasks', () => {
    const text = readFixture('basic.plan.md');
    const reversed = [
      'phase-4-service',
      'b2c3d4e5-2222-4bbb-cccc-000000000003',
      'b2c3d4e5-2222-4bbb-cccc-000000000002',
      'b2c3d4e5-2222-4bbb-cccc-000000000001',
    ];
    const result = reorderTodos(text, reversed);
    const idx1 = result.indexOf('phase-4-service');
    const idx2 = result.indexOf('b2c3d4e5-2222-4bbb-cccc-000000000003');
    const idx3 = result.indexOf('b2c3d4e5-2222-4bbb-cccc-000000000002');
    const idx4 = result.indexOf('b2c3d4e5-2222-4bbb-cccc-000000000001');
    assert.ok(idx1 < idx2);
    assert.ok(idx2 < idx3);
    assert.ok(idx3 < idx4);
  });

  it('preserves all task content after reorder', () => {
    const text = readFixture('basic.plan.md');
    const reversed = [
      'phase-4-service',
      'b2c3d4e5-2222-4bbb-cccc-000000000003',
      'b2c3d4e5-2222-4bbb-cccc-000000000002',
      'b2c3d4e5-2222-4bbb-cccc-000000000001',
    ];
    const result = reorderTodos(text, reversed);
    assert.ok(result.includes('Identify the Primary Score A table component'));
    assert.ok(result.includes('Add actions column with mat-menu'));
    assert.ok(result.includes('Add confirmation dialog'));
    assert.ok(result.includes('Call backend delete command'));
  });

  it('preserves markdown body after reorder', () => {
    const text = readFixture('basic.plan.md');
    const same = [
      'b2c3d4e5-2222-4bbb-cccc-000000000001',
      'b2c3d4e5-2222-4bbb-cccc-000000000002',
      'b2c3d4e5-2222-4bbb-cccc-000000000003',
      'phase-4-service',
    ];
    const result = reorderTodos(text, same);
    assert.ok(result.includes('# EPH-5492: UI Delete Action'));
  });
});
