/**
 * @movebridge/testing - Snapshot testing utilities
 */

import type { SnapshotResult, SnapshotUtils } from './types';

/**
 * Creates snapshot utilities with in-memory storage
 * For file-based snapshots, use with a test framework's snapshot feature
 * @returns SnapshotUtils instance
 */
export function createSnapshotUtils(): SnapshotUtils {
    const snapshots = new Map<string, string>();

    /**
     * Serializes data to a stable JSON string
     */
    function serialize(data: unknown): string {
        return JSON.stringify(data, null, 2);
    }

    /**
     * Generates a simple diff between two strings
     */
    function generateDiff(expected: string, actual: string): string {
        const expectedLines = expected.split('\n');
        const actualLines = actual.split('\n');
        const diff: string[] = [];

        const maxLines = Math.max(expectedLines.length, actualLines.length);

        for (let i = 0; i < maxLines; i++) {
            const expectedLine = expectedLines[i];
            const actualLine = actualLines[i];

            if (expectedLine === actualLine) {
                diff.push(`  ${expectedLine ?? ''}`);
            } else {
                if (expectedLine !== undefined) {
                    diff.push(`- ${expectedLine}`);
                }
                if (actualLine !== undefined) {
                    diff.push(`+ ${actualLine}`);
                }
            }
        }

        return diff.join('\n');
    }

    return {
        /**
         * Creates a new snapshot
         */
        createSnapshot(data: unknown, name: string): void {
            snapshots.set(name, serialize(data));
        },

        /**
         * Matches data against an existing snapshot
         * Creates a new snapshot if one doesn't exist
         */
        matchSnapshot(data: unknown, name: string): SnapshotResult {
            const serialized = serialize(data);
            const existing = snapshots.get(name);

            // Auto-create if doesn't exist
            if (existing === undefined) {
                snapshots.set(name, serialized);
                return { match: true };
            }

            if (existing === serialized) {
                return { match: true };
            }

            return {
                match: false,
                diff: generateDiff(existing, serialized),
            };
        },

        /**
         * Updates an existing snapshot with new data
         */
        updateSnapshot(data: unknown, name: string): void {
            snapshots.set(name, serialize(data));
        },

        /**
         * Deletes a snapshot
         */
        deleteSnapshot(name: string): void {
            snapshots.delete(name);
        },

        /**
         * Lists all snapshot names
         */
        listSnapshots(): string[] {
            return Array.from(snapshots.keys());
        },
    };
}
