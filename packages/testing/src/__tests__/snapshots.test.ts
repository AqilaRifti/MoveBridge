/**
 * @movebridge/testing - Unit tests for Snapshot Utils
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createSnapshotUtils } from '../snapshots';
import type { SnapshotUtils } from '../types';

describe('Snapshot Utils', () => {
    let snapshots: SnapshotUtils;

    beforeEach(() => {
        snapshots = createSnapshotUtils();
    });

    describe('createSnapshot', () => {
        it('should create a snapshot', () => {
            snapshots.createSnapshot({ foo: 'bar' }, 'test-snapshot');

            expect(snapshots.listSnapshots()).toContain('test-snapshot');
        });

        it('should serialize objects to JSON', () => {
            const data = { nested: { value: 123 } };
            snapshots.createSnapshot(data, 'nested');

            const result = snapshots.matchSnapshot(data, 'nested');
            expect(result.match).toBe(true);
        });

        it('should handle arrays', () => {
            const data = [1, 2, 3, { a: 'b' }];
            snapshots.createSnapshot(data, 'array');

            const result = snapshots.matchSnapshot(data, 'array');
            expect(result.match).toBe(true);
        });

        it('should handle primitive values', () => {
            snapshots.createSnapshot('string', 'string-snap');
            snapshots.createSnapshot(123, 'number-snap');
            snapshots.createSnapshot(true, 'bool-snap');
            snapshots.createSnapshot(null, 'null-snap');

            expect(snapshots.matchSnapshot('string', 'string-snap').match).toBe(true);
            expect(snapshots.matchSnapshot(123, 'number-snap').match).toBe(true);
            expect(snapshots.matchSnapshot(true, 'bool-snap').match).toBe(true);
            expect(snapshots.matchSnapshot(null, 'null-snap').match).toBe(true);
        });

        it('should overwrite existing snapshot', () => {
            snapshots.createSnapshot({ old: true }, 'overwrite');
            snapshots.createSnapshot({ new: true }, 'overwrite');

            const result = snapshots.matchSnapshot({ new: true }, 'overwrite');
            expect(result.match).toBe(true);
        });
    });

    describe('matchSnapshot', () => {
        it('should return match: true for matching data', () => {
            const data = { test: 'value' };
            snapshots.createSnapshot(data, 'match-test');

            const result = snapshots.matchSnapshot(data, 'match-test');
            expect(result.match).toBe(true);
            expect(result.diff).toBeUndefined();
        });

        it('should return match: false for non-matching data', () => {
            snapshots.createSnapshot({ original: true }, 'mismatch-test');

            const result = snapshots.matchSnapshot({ different: true }, 'mismatch-test');
            expect(result.match).toBe(false);
            expect(result.diff).toBeDefined();
        });

        it('should auto-create snapshot if not exists', () => {
            const data = { auto: 'created' };

            const result = snapshots.matchSnapshot(data, 'auto-create');
            expect(result.match).toBe(true);
            expect(snapshots.listSnapshots()).toContain('auto-create');
        });

        it('should provide diff on mismatch', () => {
            snapshots.createSnapshot({ value: 'original' }, 'diff-test');

            const result = snapshots.matchSnapshot({ value: 'changed' }, 'diff-test');
            expect(result.match).toBe(false);
            expect(result.diff).toContain('original');
            expect(result.diff).toContain('changed');
        });

        it('should detect added properties', () => {
            snapshots.createSnapshot({ a: 1 }, 'added-prop');

            const result = snapshots.matchSnapshot({ a: 1, b: 2 }, 'added-prop');
            expect(result.match).toBe(false);
            expect(result.diff).toBeDefined();
        });

        it('should detect removed properties', () => {
            snapshots.createSnapshot({ a: 1, b: 2 }, 'removed-prop');

            const result = snapshots.matchSnapshot({ a: 1 }, 'removed-prop');
            expect(result.match).toBe(false);
            expect(result.diff).toBeDefined();
        });

        it('should detect type changes', () => {
            snapshots.createSnapshot({ value: '123' }, 'type-change');

            const result = snapshots.matchSnapshot({ value: 123 }, 'type-change');
            expect(result.match).toBe(false);
        });
    });

    describe('updateSnapshot', () => {
        it('should update existing snapshot', () => {
            snapshots.createSnapshot({ old: true }, 'update-test');
            snapshots.updateSnapshot({ new: true }, 'update-test');

            const result = snapshots.matchSnapshot({ new: true }, 'update-test');
            expect(result.match).toBe(true);
        });

        it('should create snapshot if not exists', () => {
            snapshots.updateSnapshot({ created: true }, 'new-update');

            expect(snapshots.listSnapshots()).toContain('new-update');
            const result = snapshots.matchSnapshot({ created: true }, 'new-update');
            expect(result.match).toBe(true);
        });
    });

    describe('deleteSnapshot', () => {
        it('should delete existing snapshot', () => {
            snapshots.createSnapshot({ test: true }, 'delete-test');
            expect(snapshots.listSnapshots()).toContain('delete-test');

            snapshots.deleteSnapshot('delete-test');
            expect(snapshots.listSnapshots()).not.toContain('delete-test');
        });

        it('should not throw for non-existent snapshot', () => {
            expect(() => snapshots.deleteSnapshot('non-existent')).not.toThrow();
        });
    });

    describe('listSnapshots', () => {
        it('should return empty array initially', () => {
            expect(snapshots.listSnapshots()).toEqual([]);
        });

        it('should return all snapshot names', () => {
            snapshots.createSnapshot({}, 'snap1');
            snapshots.createSnapshot({}, 'snap2');
            snapshots.createSnapshot({}, 'snap3');

            const list = snapshots.listSnapshots();
            expect(list).toContain('snap1');
            expect(list).toContain('snap2');
            expect(list).toContain('snap3');
            expect(list).toHaveLength(3);
        });

        it('should not include deleted snapshots', () => {
            snapshots.createSnapshot({}, 'keep');
            snapshots.createSnapshot({}, 'delete');
            snapshots.deleteSnapshot('delete');

            const list = snapshots.listSnapshots();
            expect(list).toContain('keep');
            expect(list).not.toContain('delete');
        });
    });

    describe('diff generation', () => {
        it('should show added lines with +', () => {
            snapshots.createSnapshot({ a: 1 }, 'diff-add');

            const result = snapshots.matchSnapshot({ a: 1, b: 2 }, 'diff-add');
            expect(result.diff).toContain('+');
        });

        it('should show removed lines with -', () => {
            snapshots.createSnapshot({ a: 1, b: 2 }, 'diff-remove');

            const result = snapshots.matchSnapshot({ a: 1 }, 'diff-remove');
            expect(result.diff).toContain('-');
        });

        it('should show unchanged lines with space prefix', () => {
            snapshots.createSnapshot({ a: 1, b: 2 }, 'diff-unchanged');

            const result = snapshots.matchSnapshot({ a: 1, b: 3 }, 'diff-unchanged');
            // The opening brace and "a": 1 should be unchanged
            expect(result.diff).toContain('  {');
        });
    });

    describe('complex data structures', () => {
        it('should handle deeply nested objects', () => {
            const data = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                        },
                    },
                },
            };

            snapshots.createSnapshot(data, 'deep');
            const result = snapshots.matchSnapshot(data, 'deep');
            expect(result.match).toBe(true);
        });

        it('should handle arrays of objects', () => {
            const data = [
                { id: 1, name: 'first' },
                { id: 2, name: 'second' },
            ];

            snapshots.createSnapshot(data, 'array-objects');
            const result = snapshots.matchSnapshot(data, 'array-objects');
            expect(result.match).toBe(true);
        });

        it('should handle mixed types', () => {
            const data = {
                string: 'text',
                number: 42,
                boolean: true,
                null: null,
                array: [1, 2, 3],
                object: { nested: true },
            };

            snapshots.createSnapshot(data, 'mixed');
            const result = snapshots.matchSnapshot(data, 'mixed');
            expect(result.match).toBe(true);
        });
    });
});
