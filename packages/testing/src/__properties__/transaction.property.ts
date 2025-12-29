/**
 * @movebridge/testing - Property tests for Transaction Validator
 * 
 * Feature: testing-validation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MovementError } from '@movebridge/core';
import {
    validateTransferPayload,
    validateEntryFunctionPayload,
    validatePayload,
} from '../validators/transaction';

/**
 * Arbitrary for valid hex strings
 */
const hexString = (length: number) =>
    fc.stringOf(fc.constantFrom(...'0123456789abcdef'.split('')), {
        minLength: length,
        maxLength: length,
    });

/**
 * Arbitrary for valid addresses
 */
const validAddressArb = hexString(64).map((hex) => `0x${hex}`);

/**
 * Arbitrary for valid positive integer amounts
 */
const validAmountArb = fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }).map(String);

/**
 * Arbitrary for valid function identifiers
 */
const validFunctionArb = fc.tuple(
    hexString(64),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')), { minLength: 1, maxLength: 20 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz_'.split('')), { minLength: 1, maxLength: 20 })
).map(([addr, module, func]) => `0x${addr}::${module}::${func}`);

/**
 * Arbitrary for valid transfer payloads
 */
const validTransferPayloadArb = fc.record({
    to: validAddressArb,
    amount: validAmountArb,
    coinType: fc.option(fc.constant('0x1::aptos_coin::AptosCoin'), { nil: undefined }),
});

/**
 * Arbitrary for valid entry function payloads
 */
const validEntryFunctionPayloadArb = fc.record({
    function: validFunctionArb,
    typeArguments: fc.array(fc.constant('0x1::aptos_coin::AptosCoin'), { maxLength: 3 }),
    arguments: fc.array(fc.oneof(fc.string(), fc.integer()), { maxLength: 5 }),
});

/**
 * Arbitrary for invalid amounts
 */
const invalidAmountArb = fc.oneof(
    // Negative numbers
    fc.integer({ min: -1000000, max: -1 }).map(String),
    // Zero
    fc.constant('0'),
    // Non-numeric strings
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 1, maxLength: 10 }),
    // Decimal numbers
    fc.tuple(fc.integer({ min: 1, max: 1000 }), fc.integer({ min: 1, max: 99 }))
        .map(([whole, decimal]) => `${whole}.${decimal}`),
);

/**
 * Arbitrary for invalid function identifiers
 */
const invalidFunctionArb = fc.oneof(
    // Missing parts
    fc.constant('0x1::module'),
    fc.constant('0x1'),
    fc.constant('module::function'),
    // Invalid address
    fc.constant('invalid::module::function'),
    // Empty parts
    fc.constant('0x1::::function'),
    fc.constant('0x1::module::'),
);

describe('Transaction Validator Properties', () => {
    /**
     * Feature: testing-validation, Property 13: Valid transfer payload acceptance
     * For any transfer payload with valid address, positive numeric amount string,
     * and optional coinType, validateTransferPayload SHALL return true.
     */
    it('Property 13: Valid transfer payload acceptance', () => {
        fc.assert(
            fc.property(validTransferPayloadArb, (payload) => {
                expect(validateTransferPayload(payload)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 14: Invalid amount error
     * For any transfer payload with negative, zero, or non-numeric amount,
     * validateTransferPayload SHALL throw a MovementError with code 'INVALID_ARGUMENT'.
     */
    it('Property 14: Invalid amount error', () => {
        fc.assert(
            fc.property(
                fc.record({
                    to: validAddressArb,
                    amount: invalidAmountArb,
                }),
                (payload) => {
                    try {
                        validateTransferPayload(payload);
                        expect.fail('Expected validateTransferPayload to throw');
                    } catch (error) {
                        expect(error).toBeInstanceOf(MovementError);
                        const movementError = error as MovementError;
                        expect(movementError.code).toBe('INVALID_ARGUMENT');
                        expect(movementError.details?.argument).toBe('amount');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 15: Valid entry function payload acceptance
     * For any entry function payload with valid function identifier,
     * validateEntryFunctionPayload SHALL return true.
     */
    it('Property 15: Valid entry function payload acceptance', () => {
        fc.assert(
            fc.property(validEntryFunctionPayloadArb, (payload) => {
                expect(validateEntryFunctionPayload(payload)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 16: Invalid function identifier error
     * For any entry function payload with malformed function identifier,
     * validateEntryFunctionPayload SHALL throw a MovementError with code 'INVALID_ARGUMENT'.
     */
    it('Property 16: Invalid function identifier error', () => {
        fc.assert(
            fc.property(
                fc.record({
                    function: invalidFunctionArb,
                    typeArguments: fc.constant([]),
                    arguments: fc.constant([]),
                }),
                (payload) => {
                    try {
                        validateEntryFunctionPayload(payload);
                        expect.fail('Expected validateEntryFunctionPayload to throw');
                    } catch (error) {
                        expect(error).toBeInstanceOf(MovementError);
                        const movementError = error as MovementError;
                        expect(movementError.code).toBe('INVALID_ARGUMENT');
                        expect(movementError.details?.argument).toBe('function');
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: validatePayload correctly validates entry_function_payload type
     */
    it('Property: validatePayload accepts valid entry_function_payload', () => {
        fc.assert(
            fc.property(validEntryFunctionPayloadArb, (payload) => {
                const fullPayload = {
                    type: 'entry_function_payload' as const,
                    ...payload,
                };
                expect(validatePayload(fullPayload)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });
});
