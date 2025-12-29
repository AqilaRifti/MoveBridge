/**
 * @movebridge/testing - Property tests for Address Validator
 * 
 * Feature: testing-validation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MovementError } from '@movebridge/core';
import {
    isValidAddress,
    validateAddress,
    normalizeAddress,
    getAddressValidationDetails,
} from '../validators/address';

/**
 * Arbitrary for valid hex strings of specified length
 */
const hexString = (length: number) =>
    fc.stringOf(fc.constantFrom(...'0123456789abcdefABCDEF'.split('')), {
        minLength: length,
        maxLength: length,
    });

/**
 * Arbitrary for valid addresses (1-64 hex chars, with or without 0x)
 */
const validAddressArb = fc.oneof(
    // Without 0x prefix
    fc.integer({ min: 1, max: 64 }).chain((len) =>
        hexString(len).map((hex) => hex)
    ),
    // With 0x prefix
    fc.integer({ min: 1, max: 64 }).chain((len) =>
        hexString(len).map((hex) => `0x${hex}`)
    ),
    // With 0X prefix (uppercase)
    fc.integer({ min: 1, max: 64 }).chain((len) =>
        hexString(len).map((hex) => `0X${hex}`)
    )
);

/**
 * Arbitrary for invalid addresses
 */
const invalidAddressArb = fc.oneof(
    // Empty string
    fc.constant(''),
    // Just 0x
    fc.constant('0x'),
    // Too long (more than 64 hex chars)
    hexString(65).map((hex) => `0x${hex}`),
    // Contains non-hex characters
    fc.stringOf(fc.constantFrom(...'ghijklmnopqrstuvwxyz!@#$%'.split('')), {
        minLength: 1,
        maxLength: 64,
    }),
    // Mixed valid and invalid
    fc.tuple(hexString(10), fc.constant('xyz'), hexString(10)).map(
        ([a, b, c]) => `0x${a}${b}${c}`
    )
);

describe('Address Validator Properties', () => {
    /**
     * Feature: testing-validation, Property 9: Valid address acceptance
     * For any string that is exactly 64 hexadecimal characters (with or without '0x' prefix),
     * isValidAddress SHALL return true.
     */
    it('Property 9: Valid address acceptance - accepts valid hex addresses', () => {
        fc.assert(
            fc.property(validAddressArb, (address) => {
                expect(isValidAddress(address)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 10: Invalid address rejection
     * For any string that does not match the valid address format,
     * isValidAddress SHALL return false.
     */
    it('Property 10: Invalid address rejection - rejects invalid addresses', () => {
        fc.assert(
            fc.property(invalidAddressArb, (address) => {
                expect(isValidAddress(address)).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 11: Address validation error structure
     * For any invalid address string, validateAddress SHALL throw a MovementError
     * with code 'INVALID_ADDRESS' and details containing the validation failure reason.
     */
    it('Property 11: Address validation error structure - throws MovementError with correct structure', () => {
        fc.assert(
            fc.property(invalidAddressArb, (address) => {
                try {
                    validateAddress(address);
                    // Should not reach here
                    expect.fail('Expected validateAddress to throw');
                } catch (error) {
                    expect(error).toBeInstanceOf(MovementError);
                    const movementError = error as MovementError;
                    expect(movementError.code).toBe('INVALID_ADDRESS');
                    expect(movementError.details).toBeDefined();
                    expect(movementError.details?.address).toBe(address);
                    expect(movementError.details?.reason).toBeDefined();
                }
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 12: Address normalization format
     * For any valid address (with or without '0x' prefix, any case),
     * normalizeAddress SHALL return the address in lowercase with '0x' prefix.
     */
    it('Property 12: Address normalization format - normalizes to lowercase with 0x prefix', () => {
        fc.assert(
            fc.property(validAddressArb, (address) => {
                const normalized = normalizeAddress(address);

                // Should start with 0x
                expect(normalized.startsWith('0x')).toBe(true);

                // Should be lowercase
                expect(normalized).toBe(normalized.toLowerCase());

                // Should be exactly 66 characters (0x + 64 hex)
                expect(normalized.length).toBe(66);

                // Should only contain valid hex characters after 0x
                expect(/^0x[a-f0-9]{64}$/.test(normalized)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Normalization is idempotent
     * Normalizing an already normalized address should return the same result.
     */
    it('Property: Normalization is idempotent', () => {
        fc.assert(
            fc.property(validAddressArb, (address) => {
                const normalized1 = normalizeAddress(address);
                const normalized2 = normalizeAddress(normalized1);
                expect(normalized1).toBe(normalized2);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: getValidationDetails returns consistent results
     */
    it('Property: getValidationDetails consistency with isValidAddress', () => {
        fc.assert(
            fc.property(
                fc.oneof(validAddressArb, invalidAddressArb),
                (address) => {
                    const isValid = isValidAddress(address);
                    const details = getAddressValidationDetails(address);
                    expect(details.valid).toBe(isValid);

                    if (isValid) {
                        expect(details.normalized).toBeDefined();
                        expect(details.error).toBeUndefined();
                    } else {
                        expect(details.error).toBeDefined();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
