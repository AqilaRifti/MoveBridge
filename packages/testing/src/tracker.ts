/**
 * @movebridge/testing - Call tracker for recording and asserting method calls
 */

import { MovementError } from '@movebridge/core';
import type { CallRecord, CallTracker } from './types';

/**
 * Creates a call tracker instance
 * @returns CallTracker instance
 */
export function createCallTracker(): CallTracker {
    const calls: CallRecord[] = [];

    /**
     * Deep equality check for arguments
     */
    function deepEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        if (a === null || b === null) return false;
        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, index) => deepEqual(item, b[index]));
        }

        if (typeof a === 'object' && typeof b === 'object') {
            const aKeys = Object.keys(a as object);
            const bKeys = Object.keys(b as object);
            if (aKeys.length !== bKeys.length) return false;
            return aKeys.every((key) =>
                deepEqual(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key]
                )
            );
        }

        return false;
    }

    return {
        /**
         * Records a method call
         */
        recordCall(method: string, args: unknown[], result?: unknown, error?: Error): void {
            calls.push({
                method,
                arguments: args,
                timestamp: Date.now(),
                result,
                error,
            });
        },

        /**
         * Gets all calls to a specific method
         */
        getCalls(method: string): CallRecord[] {
            return calls.filter((call) => call.method === method);
        },

        /**
         * Gets the count of calls to a specific method
         */
        getCallCount(method: string): number {
            return calls.filter((call) => call.method === method).length;
        },

        /**
         * Gets all recorded calls
         */
        getAllCalls(): CallRecord[] {
            return [...calls];
        },

        /**
         * Asserts that a method was called at least once
         */
        assertCalled(method: string): void {
            const count = this.getCallCount(method);
            if (count === 0) {
                throw new MovementError(
                    `Expected method "${method}" to be called, but it was never called`,
                    'INVALID_ARGUMENT',
                    { method, expected: 'at least 1 call', actual: 0 }
                );
            }
        },

        /**
         * Asserts that a method was called exactly N times
         */
        assertCalledTimes(method: string, times: number): void {
            const count = this.getCallCount(method);
            if (count !== times) {
                throw new MovementError(
                    `Expected method "${method}" to be called ${times} times, but it was called ${count} times`,
                    'INVALID_ARGUMENT',
                    { method, expected: times, actual: count }
                );
            }
        },

        /**
         * Asserts that a method was called with specific arguments
         */
        assertCalledWith(method: string, ...expectedArgs: unknown[]): void {
            const methodCalls = this.getCalls(method);

            if (methodCalls.length === 0) {
                throw new MovementError(
                    `Expected method "${method}" to be called with arguments, but it was never called`,
                    'INVALID_ARGUMENT',
                    { method, expectedArgs, actualCalls: [] }
                );
            }

            const hasMatch = methodCalls.some((call) =>
                deepEqual(call.arguments, expectedArgs)
            );

            if (!hasMatch) {
                throw new MovementError(
                    `Expected method "${method}" to be called with specific arguments, but no matching call found`,
                    'INVALID_ARGUMENT',
                    {
                        method,
                        expectedArgs,
                        actualCalls: methodCalls.map((c) => c.arguments),
                    }
                );
            }
        },

        /**
         * Asserts that a method was never called
         */
        assertNotCalled(method: string): void {
            const count = this.getCallCount(method);
            if (count > 0) {
                throw new MovementError(
                    `Expected method "${method}" to not be called, but it was called ${count} times`,
                    'INVALID_ARGUMENT',
                    { method, expected: 0, actual: count }
                );
            }
        },

        /**
         * Clears all recorded calls
         */
        clearCalls(): void {
            calls.length = 0;
        },
    };
}
