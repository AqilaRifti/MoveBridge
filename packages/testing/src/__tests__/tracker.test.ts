/**
 * @movebridge/testing - Unit tests for Call Tracker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MovementError } from '@movebridge/core';
import { createCallTracker } from '../tracker';
import type { CallTracker } from '../types';

describe('Call Tracker', () => {
    let tracker: CallTracker;

    beforeEach(() => {
        tracker = createCallTracker();
    });

    describe('recordCall', () => {
        it('should record a call with method and arguments', () => {
            tracker.recordCall('testMethod', ['arg1', 'arg2']);

            const calls = tracker.getCalls('testMethod');
            expect(calls.length).toBe(1);
            expect(calls[0]?.method).toBe('testMethod');
            expect(calls[0]?.arguments).toEqual(['arg1', 'arg2']);
        });

        it('should record timestamp', () => {
            const before = Date.now();
            tracker.recordCall('testMethod', []);
            const after = Date.now();

            const calls = tracker.getCalls('testMethod');
            expect(calls[0]?.timestamp).toBeGreaterThanOrEqual(before);
            expect(calls[0]?.timestamp).toBeLessThanOrEqual(after);
        });

        it('should record result when provided', () => {
            tracker.recordCall('testMethod', [], 'result');

            const calls = tracker.getCalls('testMethod');
            expect(calls[0]?.result).toBe('result');
        });

        it('should record error when provided', () => {
            const error = new Error('test error');
            tracker.recordCall('testMethod', [], undefined, error);

            const calls = tracker.getCalls('testMethod');
            expect(calls[0]?.error).toBe(error);
        });
    });

    describe('getCalls', () => {
        it('should return empty array for uncalled method', () => {
            const calls = tracker.getCalls('uncalled');
            expect(calls).toEqual([]);
        });

        it('should return all calls for a method', () => {
            tracker.recordCall('method', ['a']);
            tracker.recordCall('method', ['b']);
            tracker.recordCall('method', ['c']);

            const calls = tracker.getCalls('method');
            expect(calls.length).toBe(3);
        });

        it('should only return calls for specified method', () => {
            tracker.recordCall('method1', ['a']);
            tracker.recordCall('method2', ['b']);
            tracker.recordCall('method1', ['c']);

            const calls = tracker.getCalls('method1');
            expect(calls.length).toBe(2);
            expect(calls.every(c => c.method === 'method1')).toBe(true);
        });
    });

    describe('getCallCount', () => {
        it('should return 0 for uncalled method', () => {
            expect(tracker.getCallCount('uncalled')).toBe(0);
        });

        it('should return correct count', () => {
            tracker.recordCall('method', []);
            tracker.recordCall('method', []);
            tracker.recordCall('method', []);

            expect(tracker.getCallCount('method')).toBe(3);
        });
    });

    describe('getAllCalls', () => {
        it('should return empty array initially', () => {
            expect(tracker.getAllCalls()).toEqual([]);
        });

        it('should return all calls across methods', () => {
            tracker.recordCall('method1', []);
            tracker.recordCall('method2', []);
            tracker.recordCall('method1', []);

            expect(tracker.getAllCalls().length).toBe(3);
        });
    });

    describe('assertCalled', () => {
        it('should not throw when method was called', () => {
            tracker.recordCall('method', []);
            expect(() => tracker.assertCalled('method')).not.toThrow();
        });

        it('should throw when method was not called', () => {
            expect(() => tracker.assertCalled('uncalled')).toThrow(MovementError);
        });

        it('should include method name in error', () => {
            try {
                tracker.assertCalled('uncalled');
                expect.fail('Should have thrown');
            } catch (error) {
                expect((error as MovementError).details?.method).toBe('uncalled');
            }
        });
    });

    describe('assertCalledTimes', () => {
        it('should not throw when count matches', () => {
            tracker.recordCall('method', []);
            tracker.recordCall('method', []);
            expect(() => tracker.assertCalledTimes('method', 2)).not.toThrow();
        });

        it('should throw when count does not match', () => {
            tracker.recordCall('method', []);
            expect(() => tracker.assertCalledTimes('method', 2)).toThrow(MovementError);
        });

        it('should work with 0 expected calls', () => {
            expect(() => tracker.assertCalledTimes('uncalled', 0)).not.toThrow();
        });
    });

    describe('assertCalledWith', () => {
        it('should not throw when arguments match', () => {
            tracker.recordCall('method', ['arg1', 'arg2']);
            expect(() => tracker.assertCalledWith('method', 'arg1', 'arg2')).not.toThrow();
        });

        it('should throw when arguments do not match', () => {
            tracker.recordCall('method', ['arg1']);
            expect(() => tracker.assertCalledWith('method', 'different')).toThrow(MovementError);
        });

        it('should throw when method was not called', () => {
            expect(() => tracker.assertCalledWith('uncalled', 'arg')).toThrow(MovementError);
        });

        it('should match any call with correct arguments', () => {
            tracker.recordCall('method', ['wrong']);
            tracker.recordCall('method', ['correct']);
            tracker.recordCall('method', ['also wrong']);

            expect(() => tracker.assertCalledWith('method', 'correct')).not.toThrow();
        });

        it('should match complex arguments', () => {
            tracker.recordCall('method', [{ a: 1, b: [2, 3] }]);
            expect(() => tracker.assertCalledWith('method', { a: 1, b: [2, 3] })).not.toThrow();
        });
    });

    describe('assertNotCalled', () => {
        it('should not throw when method was not called', () => {
            expect(() => tracker.assertNotCalled('uncalled')).not.toThrow();
        });

        it('should throw when method was called', () => {
            tracker.recordCall('method', []);
            expect(() => tracker.assertNotCalled('method')).toThrow(MovementError);
        });
    });

    describe('clearCalls', () => {
        it('should clear all recorded calls', () => {
            tracker.recordCall('method1', []);
            tracker.recordCall('method2', []);

            tracker.clearCalls();

            expect(tracker.getAllCalls()).toEqual([]);
            expect(tracker.getCallCount('method1')).toBe(0);
            expect(tracker.getCallCount('method2')).toBe(0);
        });
    });
});
