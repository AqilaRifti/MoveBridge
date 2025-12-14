/**
 * Property-based tests for error handling
 * @module @movebridge/core
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MovementError, Errors, isMovementError, wrapError, type ErrorCode } from '../errors';

describe('Error Handling Properties', () => {
    const errorCodeArb = fc.constantFrom<ErrorCode>(
        'INVALID_ADDRESS',
        'WALLET_NOT_FOUND',
        'WALLET_CONNECTION_FAILED',
        'WALLET_NOT_CONNECTED',
        'TRANSACTION_FAILED',
        'TRANSACTION_TIMEOUT',
        'VIEW_FUNCTION_FAILED',
        'INVALID_EVENT_HANDLE',
        'NETWORK_ERROR',
        'ABI_FETCH_FAILED',
        'CODEGEN_FAILED',
        'INVALID_ARGUMENT'
    );

    /**
     * Feature: movebridge-sdk, Property 22: MovementError structure
     * For any SDK operation that fails, the thrown error SHALL be a MovementError
     * instance with message (string), code (ErrorCode), and optional details (object).
     * Validates: Requirements 17.1
     */
    it('Property 22: MovementError structure', () => {
        const messageArb = fc.string({ minLength: 1 });
        const detailsArb = fc.option(fc.dictionary(fc.string(), fc.jsonValue()));

        fc.assert(
            fc.property(messageArb, errorCodeArb, detailsArb, (message, code, details) => {
                const error = new MovementError(message, code, details ?? undefined);

                // Verify structure
                expect(error).toBeInstanceOf(MovementError);
                expect(error).toBeInstanceOf(Error);
                expect(typeof error.message).toBe('string');
                expect(error.message).toBe(message);
                expect(error.code).toBe(code);
                expect(error.name).toBe('MovementError');

                // Details should be undefined or an object
                if (details !== null) {
                    expect(error.details).toEqual(details);
                } else {
                    expect(error.details).toBeUndefined();
                }

                // toJSON should return proper structure
                const json = error.toJSON();
                expect(json.name).toBe('MovementError');
                expect(json.message).toBe(message);
                expect(json.code).toBe(code);

                // toString should include code and message
                const str = error.toString();
                expect(str).toContain(code);
                expect(str).toContain(message);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 23: Error details inclusion
     * For any network, wallet, or transaction failure, the MovementError details
     * SHALL include relevant context.
     * Validates: Requirements 17.2, 17.3, 17.4
     */
    it('Property 23: Error details inclusion - network errors', () => {
        const urlArb = fc.webUrl();
        const statusArb = fc.integer({ min: 400, max: 599 });
        const bodyArb = fc.option(fc.jsonValue());

        fc.assert(
            fc.property(urlArb, statusArb, bodyArb, (url, httpStatus, responseBody) => {
                const error = Errors.networkError(url, httpStatus, responseBody);

                expect(error.code).toBe('NETWORK_ERROR');
                expect(error.details).toBeDefined();
                expect(error.details?.url).toBe(url);
                expect(error.details?.httpStatus).toBe(httpStatus);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 23: Error details inclusion - wallet errors', () => {
        const walletArb = fc.constantFrom('petra', 'martian', 'pontem', 'unknown');
        const availableArb = fc.array(fc.constantFrom('petra', 'martian', 'pontem'));

        fc.assert(
            fc.property(walletArb, availableArb, (wallet, available) => {
                const error = Errors.walletNotFound(wallet, available);

                expect(error.code).toBe('WALLET_NOT_FOUND');
                expect(error.details).toBeDefined();
                expect(error.details?.wallet).toBe(wallet);
                expect(error.details?.available).toEqual(available);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    it('Property 23: Error details inclusion - transaction errors', () => {
        const hashArb = fc.hexaString({ minLength: 64, maxLength: 64 }).map((h) => `0x${h}`);
        const vmStatusArb = fc.string({ minLength: 1 });
        const gasUsedArb = fc.option(fc.nat().map(String));

        fc.assert(
            fc.property(hashArb, vmStatusArb, gasUsedArb, (hash, vmStatus, gasUsed) => {
                const error = Errors.transactionFailed(hash, vmStatus, gasUsed ?? undefined);

                expect(error.code).toBe('TRANSACTION_FAILED');
                expect(error.details).toBeDefined();
                expect(error.details?.hash).toBe(hash);
                expect(error.details?.vmStatus).toBe(vmStatus);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: isMovementError type guard works correctly
     */
    it('Property: isMovementError type guard', () => {
        const messageArb = fc.string({ minLength: 1 });

        fc.assert(
            fc.property(messageArb, errorCodeArb, (message, code) => {
                const movementError = new MovementError(message, code);
                const regularError = new Error(message);
                const notAnError = { message, code };

                expect(isMovementError(movementError)).toBe(true);
                expect(isMovementError(regularError)).toBe(false);
                expect(isMovementError(notAnError)).toBe(false);
                expect(isMovementError(null)).toBe(false);
                expect(isMovementError(undefined)).toBe(false);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: wrapError preserves MovementError
     */
    it('Property: wrapError preserves MovementError', () => {
        const messageArb = fc.string({ minLength: 1 });

        fc.assert(
            fc.property(messageArb, errorCodeArb, errorCodeArb, (message, originalCode, newCode) => {
                const originalError = new MovementError(message, originalCode);
                const wrapped = wrapError(originalError, newCode);

                // Should return the original error unchanged
                expect(wrapped).toBe(originalError);
                expect(wrapped.code).toBe(originalCode);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: wrapError converts regular errors
     */
    it('Property: wrapError converts regular errors', () => {
        const messageArb = fc.string({ minLength: 1 });
        const contextArb = fc.option(fc.string({ minLength: 1 }));

        fc.assert(
            fc.property(messageArb, errorCodeArb, contextArb, (message, code, context) => {
                const regularError = new Error(message);
                const wrapped = wrapError(regularError, code, context ?? undefined);

                expect(isMovementError(wrapped)).toBe(true);
                expect(wrapped.code).toBe(code);
                expect(wrapped.details?.originalError).toBe(regularError);

                if (context) {
                    expect(wrapped.message).toContain(context);
                }

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
