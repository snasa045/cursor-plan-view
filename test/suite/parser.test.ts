import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { parsePlanFile } from '../../src/parser';

const fixturesDir = path.join(__dirname, '..', '..', 'test', 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('parsePlanFile', () => {

  it('parses a standard plan file with frontmatter and body', () => {
    const result = parsePlanFile(readFixture('basic.plan.md'));
    assert.strictEqual(result.frontmatter.name, 'EPH-5492: UI Delete Action in Primary Scoring Table');
    assert.strictEqual(result.frontmatter.todos.length, 4);
    assert.strictEqual(result.frontmatter.todos[0].status, 'pending');
    assert.strictEqual(result.frontmatter.todos[1].status, 'completed');
    assert.strictEqual(result.frontmatter.todos[3].id, 'phase-4-service');
    assert.strictEqual(result.frontmatter.isProject, false);
    assert.ok(result.markdownBody.includes('# EPH-5492'));
  });

  it('handles file with no frontmatter', () => {
    const result = parsePlanFile('# Just Markdown\n\nNo YAML here.');
    assert.strictEqual(result.frontmatter.name, 'Untitled Plan');
    assert.strictEqual(result.frontmatter.todos.length, 0);
    assert.ok(result.markdownBody.includes('# Just Markdown'));
  });

  it('handles malformed YAML gracefully', () => {
    const result = parsePlanFile(readFixture('malformed.plan.md'));
    assert.strictEqual(result.frontmatter.name, 'Untitled Plan');
    assert.strictEqual(result.frontmatter.todos.length, 0);
    assert.ok(result.markdownBody.includes('# Fallback Content'));
  });

  it('defaults missing name to "Untitled Plan"', () => {
    const text = '---\noverview: "some overview"\ntodos: []\n---\n# Body';
    const result = parsePlanFile(text);
    assert.strictEqual(result.frontmatter.name, 'Untitled Plan');
  });

  it('defaults missing todos to empty array', () => {
    const text = '---\nname: "Test"\noverview: "test"\n---\n# Body';
    const result = parsePlanFile(text);
    assert.deepStrictEqual(result.frontmatter.todos, []);
  });

  it('handles empty todos array', () => {
    const text = '---\nname: "Test"\ntodos: []\n---\n# Body';
    const result = parsePlanFile(text);
    assert.strictEqual(result.frontmatter.todos.length, 0);
  });

  it('maps unknown status values to "unknown"', () => {
    const result = parsePlanFile(readFixture('large.plan.md'));
    const lastTodo = result.frontmatter.todos[result.frontmatter.todos.length - 1];
    assert.strictEqual(lastTodo.status, 'unknown');
  });

  it('handles UUID IDs', () => {
    const result = parsePlanFile(readFixture('basic.plan.md'));
    assert.strictEqual(result.frontmatter.todos[0].id, 'b2c3d4e5-2222-4bbb-cccc-000000000001');
  });

  it('handles plain string IDs', () => {
    const result = parsePlanFile(readFixture('basic.plan.md'));
    assert.strictEqual(result.frontmatter.todos[3].id, 'phase-4-service');
  });

  it('parses multi-line overview', () => {
    const result = parsePlanFile(readFixture('large.plan.md'));
    assert.ok(result.frontmatter.overview.length > 0);
  });

  it('handles Windows line endings', () => {
    const text = '---\r\nname: "Win"\r\ntodos:\r\n  - id: w1\r\n    content: "task"\r\n    status: pending\r\n---\r\n# Body';
    const result = parsePlanFile(text);
    assert.strictEqual(result.frontmatter.name, 'Win');
    assert.strictEqual(result.frontmatter.todos.length, 1);
  });

  it('handles empty body', () => {
    const result = parsePlanFile(readFixture('empty-body.plan.md'));
    assert.strictEqual(result.markdownBody.trim(), '');
    assert.strictEqual(result.frontmatter.todos.length, 1);
  });

  it('parses large file with 20+ todos', () => {
    const result = parsePlanFile(readFixture('large.plan.md'));
    assert.strictEqual(result.frontmatter.todos.length, 20);
  });

  it('auto-generates ID for todo without id field', () => {
    const text = '---\nname: "Test"\ntodos:\n  - content: "no id task"\n    status: pending\n---\n';
    const result = parsePlanFile(text);
    assert.strictEqual(result.frontmatter.todos[0].id, 'auto-0');
  });

  it('recognizes isProject: true', () => {
    const result = parsePlanFile(readFixture('completed.plan.md'));
    assert.strictEqual(result.frontmatter.isProject, true);
  });

  it('treats "done" as a valid status', () => {
    const result = parsePlanFile(readFixture('completed.plan.md'));
    const doneTodo = result.frontmatter.todos.find(t => t.id === 'done-3');
    assert.strictEqual(doneTodo?.status, 'done');
  });

  it('handles in-progress status', () => {
    const result = parsePlanFile(readFixture('large.plan.md'));
    const inProgressTodo = result.frontmatter.todos.find(t => t.status === 'in-progress');
    assert.ok(inProgressTodo);
    assert.strictEqual(inProgressTodo!.id, 'a1b2c3d4-0001-4000-8000-000000000003');
  });
});
