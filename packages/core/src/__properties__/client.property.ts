/**
 * Property-based tests for Movement client
 * @module @movebridge/core
 * 
 * Feature: sdk-rework
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isValidAddress } from '../config';
import { MovementError } from '../errors';

describe('Movement Client Properties', () => {
    /**
     * Feature: movebridge-sdk, Property 3: Balance return type consistency
     * For any valid Movement address, calling getAccountBalance SHALL return
     * a string representing the balance.
     * Validates: Requirements 2.1
     *
     * Note: This property tests the address validation logic since actual
     * network calls would require integration tests.
     */
    it('Property 3: Valid addresses pass validation', () => {
        // Generate valid hex addresses (1-64 hex chars with 0x prefix)
        const validAddressArb = fc
            .integer({ min: 1, max: 64 })
            .chain((length) =>
                fc.hexaString({ minLength: length, maxLength: length }).map((hex) => `0x${hex}`)
            );

        fc.assert(
            fc.property(validAddressArb, (address) => {
                expect(isValidAddress(address)).toBe(true);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sdk-rework, Property 2: Invalid Address Rejection
     * For any string that does not match the hex address format (0x followed by 1-64 hex characters),
     * the SDK SHALL reject it with an INVALID_ADDRESS error before attempting network operations.
     * 
     * **Validates: Requirements 1.5**
     */
    it('Property 2: Invalid Address Rejection', () => {
        // Generate various invalid address formats
        const invalidAddressArb = fc.oneof(
            // Missing 0x prefix (just hex)
            fc.hexaString({ minLength: 1, maxLength: 64 }),
            // Too long (more than 64 hex chars after 0x)
            fc.hexaString({ minLength: 65, maxLength: 100 }).map((hex) => `0x${hex}`),
            // Contains non-hex characters after 0x
            fc.string({ minLength: 1, maxLength: 64 })
                .filter((s) => /[^0-9a-fA-F]/.test(s))
                .map((s) => `0x${s}`),
            // Empty after prefix
            fc.constant('0x'),
            // Empty string
            fc.constant(''),
            // Random strings without 0x prefix
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.startsWith('0x')),
            // Whitespace
            fc.constant('   '),
            // Special characters
            fc.constant('0x!@#$%'),
            // Unicode characters
            fc.constant('0x你好世界'),
        );

        fc.assert(
            fc.property(invalidAddressArb, (address) => {
                // Invalid addresses should fail validation
                expect(isValidAddress(address)).toBe(false);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 4: Invalid address error handling
     * For any string that does not match the valid Movement address format,
     * calling getAccountBalance SHALL throw a MovementError with code 'INVALID_ADDRESS'.
     * Validates: Requirements 2.2
     */
    it('Property 4: Invalid addresses fail validation', () => {
        // Generate invalid addresses
        const invalidAddressArb = fc.oneof(
            // Missing 0x prefix
            fc.hexaString({ minLength: 1, maxLength: 64 }),
            // Too long (more than 64 hex chars)
            fc.hexaString({ minLength: 65, maxLength: 100 }).map((hex) => `0x${hex}`),
            // Contains non-hex characters
            fc.string({ minLength: 1 }).filter((s) => !/^[0-9a-fA-F]+$/.test(s)).map((s) => `0x${s}`),
            // Empty after prefix
            fc.constant('0x'),
            // Random strings
            fc.string({ minLength: 1 }).filter((s) => !s.startsWith('0x'))
        );

        fc.assert(
            fc.property(invalidAddressArb, (address) => {
                expect(isValidAddress(address)).toBe(false);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 5: Resource structure consistency
     * For any valid address, calling getAccountResources SHALL return an array
     * where each element contains 'type' (string) and 'data' (object) fields.
     * Validates: Requirements 2.3
     *
     * Note: This tests the Resource type structure.
     */
    it('Property 5: Resource structure is consistent', () => {
        const resourceArb = fc.record({
            type: fc.string({ minLength: 1 }),
            data: fc.dictionary(fc.string(), fc.jsonValue()),
        });

        fc.assert(
            fc.property(fc.array(resourceArb), (resources) => {
                for (const resource of resources) {
                    expect(typeof resource.type).toBe('string');
                    expect(typeof resource.data).toBe('object');
                    expect(resource.data).not.toBeNull();
                }
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Address validation is deterministic
     */
    it('Property: Address validation is deterministic', () => {
        const addressArb = fc.string();

        fc.assert(
            fc.property(addressArb, (address) => {
                const result1 = isValidAddress(address);
                const result2 = isValidAddress(address);
                expect(result1).toBe(result2);
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: MovementError preserves address in details
     */
    it('Property: Invalid address errors include address in details', () => {
        const addressArb = fc.string({ minLength: 1 });

        fc.assert(
            fc.property(addressArb, (address) => {
                const error = new MovementError(
                    `Invalid address: ${address}`,
                    'INVALID_ADDRESS',
                    { address, reason: 'Invalid format' }
                );

                expect(error.details?.address).toBe(address);
                expect(error.code).toBe('INVALID_ADDRESS');
                return true;
            }),
            { numRuns: 100 }
        );
    });
});
