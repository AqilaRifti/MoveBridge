/**
 * @movebridge/testing - Property tests for Call Tracker
 * 
 * Feature: testing-validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { MovementError } from '@movebridge/core';
import { createCallTracker } from '../tracker';
import type { CallTracker } from '../types';

describe('Call Tracker Properties', () => {
    let tracker: CallTracker;

    beforeEach(() => {
        tracker = createCallTracker();
    });

    /**
     * Feature: testing-validation, Property 22: Call recording completeness
     * For any mock method call, the call tracker SHALL record an entry
     * containing the method name, arguments array, and timestamp.
     */
    it('Property 22: Call recording completeness', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 30 }),
                fc.array(fc.jsonValue(), { maxLength: 5 }),
                (method, args) => {
                    const beforeTime = Date.now();
                    tracker.recordCall(method, args);
                    const afterTime = Date.now();

                    const calls = tracker.getCalls(method);
                    expect(calls.length).toBe(1);

                    const call = calls[0]!;
                    expect(call.method).toBe(method);
                    expect(call.arguments).toEqual(args);
                    expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
                    expect(call.timestamp).toBeLessThanOrEqual(afterTime);

                    // Clean up for next iteration
                    tracker.clearCalls();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 23: Call retrieval accuracy
     * For any sequence of N calls to a method, getCalls SHALL return
     * an array of exactly N CallRecord objects in chronological order.
     */
    it('Property 23: Call retrieval accuracy', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer({ min: 1, max: 20 }),
                (method, n) => {
                    // Record N calls
                    for (let i = 0; i < n; i++) {
                        tracker.recordCall(method, [i]);
                    }

                    const calls = tracker.getCalls(method);
                    expect(calls.length).toBe(n);
                    expect(tracker.getCallCount(method)).toBe(n);

                    // Verify chronological order
                    for (let i = 1; i < calls.length; i++) {
                        expect(calls[i]!.timestamp).toBeGreaterThanOrEqual(calls[i - 1]!.timestamp);
                    }

                    // Verify arguments match
                    for (let i = 0; i < n; i++) {
                        expect(calls[i]!.arguments).toEqual([i]);
                    }

                    tracker.clearCalls();
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: testing-validation, Property 24: Assert called behavior
     * For any method name, assertCalled SHALL throw if and only if
     * getCallCount for that method is zero.
     */
    it('Property 24: Assert called behavior', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.boolean(),
                (method, shouldCall) => {
                    if (shouldCall) {
                        tracker.recordCall(method, []);
                    }

                    if (shouldCall) {
                        // Should not throw
                        expect(() => tracker.assertCalled(method)).not.toThrow();
                    } else {
                        // Should throw
                        expect(() => tracker.assertCalled(method)).toThrow(MovementError);
                    }

                    tracker.clearCalls();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 25: Assert called with matching
     * For any method name and arguments, assertCalledWith SHALL throw
     * if and only if no recorded call has matching arguments.
     */
    it('Property 25: Assert called with matching', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.array(fc.integer(), { minLength: 1, maxLength: 3 }),
                fc.boolean(),
                (method, args, shouldMatch) => {
                    if (shouldMatch) {
                        tracker.recordCall(method, args);
                    } else {
                        // Record with different args
                        tracker.recordCall(method, [...args, 'extra']);
                    }

                    if (shouldMatch) {
                        expect(() => tracker.assertCalledWith(method, ...args)).not.toThrow();
                    } else {
                        expect(() => tracker.assertCalledWith(method, ...args)).toThrow(MovementError);
                    }

                    tracker.clearCalls();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 26: Clear calls reset
     * For any call tracker with recorded calls, after calling clearCalls,
     * getCalls for any method SHALL return an empty array.
     */
    it('Property 26: Clear calls reset', () => {
        fc.assert(
            fc.property(
                fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
                (methods) => {
                    // Record calls to various methods
                    for (const method of methods) {
                        tracker.recordCall(method, ['arg']);
                    }

                    // Verify calls were recorded
                    expect(tracker.getAllCalls().length).toBeGreaterThan(0);

                    // Clear
                    tracker.clearCalls();

                    // Verify all cleared
                    expect(tracker.getAllCalls().length).toBe(0);
                    for (const method of methods) {
                        expect(tracker.getCalls(method).length).toBe(0);
                        expect(tracker.getCallCount(method)).toBe(0);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: assertNotCalled behavior
     */
    it('Property: assertNotCalled throws when method was called', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.boolean(),
                (method, shouldCall) => {
                    if (shouldCall) {
                        tracker.recordCall(method, []);
                    }

                    if (shouldCall) {
                        expect(() => tracker.assertNotCalled(method)).toThrow(MovementError);
                    } else {
                        expect(() => tracker.assertNotCalled(method)).not.toThrow();
                    }

                    tracker.clearCalls();
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: assertCalledTimes accuracy
     */
    it('Property: assertCalledTimes accuracy', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 0, max: 10 }),
                (method, actualCalls, expectedCalls) => {
                    for (let i = 0; i < actualCalls; i++) {
                        tracker.recordCall(method, [i]);
                    }

                    if (actualCalls === expectedCalls) {
                        expect(() => tracker.assertCalledTimes(method, expectedCalls)).not.toThrow();
                    } else {
                        expect(() => tracker.assertCalledTimes(method, expectedCalls)).toThrow(MovementError);
                    }

                    tracker.clearCalls();
                }
            ),
            { numRuns: 100 }
        );
    });
});
