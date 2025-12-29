/**
 * @movebridge/testing - Property tests for Snapshot Utils
 *
 * Properties tested:
 * - Property 27: Snapshot round-trip
 * - Property 28: Snapshot update overwrites
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createSnapshotUtils } from '../snapshots';
import type { SnapshotUtils } from '../types';

describe('Snapshot Utils Properties', () => {
    let snapshots: SnapshotUtils;

    beforeEach(() => {
        snapshots = createSnapshotUtils();
    });

    /**
     * Property 27: Snapshot round-trip
     * Creating a snapshot and matching against the same data should always succeed
     */
    describe('Property 27: Snapshot round-trip', () => {
        it('should match after creating with same data', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    (name, data) => {
                        snapshots.createSnapshot(data, name);
                        const result = snapshots.matchSnapshot(data, name);

                        expect(result.match).toBe(true);
                        expect(result.diff).toBeUndefined();
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should not match with different data', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    fc.jsonValue(),
                    (name, data1, data2) => {
                        // Skip if data is the same
                        if (JSON.stringify(data1) === JSON.stringify(data2)) {
                            return;
                        }

                        snapshots.createSnapshot(data1, name);
                        const result = snapshots.matchSnapshot(data2, name);

                        expect(result.match).toBe(false);
                        expect(result.diff).toBeDefined();
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should auto-create snapshot if not exists', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    (name, data) => {
                        // First match should auto-create
                        const result1 = snapshots.matchSnapshot(data, name);
                        expect(result1.match).toBe(true);

                        // Second match should still succeed
                        const result2 = snapshots.matchSnapshot(data, name);
                        expect(result2.match).toBe(true);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 28: Snapshot update overwrites
     * Updating a snapshot should overwrite the previous value
     */
    describe('Property 28: Snapshot update overwrites', () => {
        it('should overwrite existing snapshot', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    fc.jsonValue(),
                    (name, data1, data2) => {
                        // Create initial snapshot
                        snapshots.createSnapshot(data1, name);

                        // Update with new data
                        snapshots.updateSnapshot(data2, name);

                        // Should match new data
                        const result = snapshots.matchSnapshot(data2, name);
                        expect(result.match).toBe(true);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should not match old data after update', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    fc.jsonValue(),
                    (name, data1, data2) => {
                        // Skip if data is the same
                        if (JSON.stringify(data1) === JSON.stringify(data2)) {
                            return;
                        }

                        // Create initial snapshot
                        snapshots.createSnapshot(data1, name);

                        // Update with new data
                        snapshots.updateSnapshot(data2, name);

                        // Should not match old data
                        const result = snapshots.matchSnapshot(data1, name);
                        expect(result.match).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('Additional properties', () => {
        it('should list all created snapshots', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
                        minLength: 1,
                        maxLength: 10,
                    }),
                    (names) => {
                        // Create fresh instance for each test
                        const freshSnapshots = createSnapshotUtils();
                        const uniqueNames = [...new Set(names)];

                        for (const name of uniqueNames) {
                            freshSnapshots.createSnapshot({ test: name }, name);
                        }

                        const listed = freshSnapshots.listSnapshots();
                        expect(listed.sort()).toEqual(uniqueNames.sort());
                    }
                ),
                { numRuns: 30 }
            );
        });

        it('should remove snapshot on delete', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.jsonValue(),
                    (name, data) => {
                        // Create fresh instance for each test
                        const freshSnapshots = createSnapshotUtils();

                        freshSnapshots.createSnapshot(data, name);
                        expect(freshSnapshots.listSnapshots()).toContain(name);

                        freshSnapshots.deleteSnapshot(name);
                        expect(freshSnapshots.listSnapshots()).not.toContain(name);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
