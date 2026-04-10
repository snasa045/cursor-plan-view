import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { updateTodoStatus } from '../../src/serializer';

const fixturesDir = path.join(__dirname, '..', '..', 'test', 'fixtures');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('updateTodoStatus', () => {

  it('changes pending to completed (UUID ID)', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000001'));
    // The first todo should now be completed
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
    // The overview and name should be unchanged
    assert.ok(result.includes('name: "EPH-5492: UI Delete Action in Primary Scoring Table"'));
    assert.ok(result.includes('overview: "Add per-row delete action'));
    // Other todos should be unchanged
    assert.ok(result.includes('b2c3d4e5-2222-4bbb-cccc-000000000003'));
  });

  it('handles the first todo in the list', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    assert.notStrictEqual(result, text); // Should have changed
  });

  it('handles the last todo in the list', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'phase-4-service', 'completed');
    assert.notStrictEqual(result, text);
  });

  it('only modifies the targeted todo, not adjacent ones', () => {
    const text = readFixture('basic.plan.md');
    const result = updateTodoStatus(text, 'b2c3d4e5-2222-4bbb-cccc-000000000001', 'completed');
    // Todo 3 should still be pending
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
