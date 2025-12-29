/**
 * @movebridge/testing - Property tests for Schema Validator
 * 
 * Feature: testing-validation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { object, string, number } from 'superstruct';
import { MovementError } from '@movebridge/core';
import {
    validateSchema,
    getValidationErrors,
    registerSchema,
    hasSchema,
} from '../validators/schema';
import { createFaker } from '../faker';

/**
 * Arbitrary for valid Resource objects
 */
const validResourceArb = fc.record({
    type: fc.string({ minLength: 1 }),
    data: fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }), fc.jsonValue()),
});

/**
 * Arbitrary for valid WalletState objects
 */
const validWalletStateArb = fc.oneof(
    fc.record({
        connected: fc.constant(true),
        address: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
        publicKey: fc.hexaString({ minLength: 64, maxLength: 64 }).map(s => `0x${s}`),
    }),
    fc.record({
        connected: fc.constant(false),
        address: fc.constant(null),
        publicKey: fc.constant(null),
    })
);

/**
 * Arbitrary for invalid data (missing required fields)
 */
const invalidResourceArb = fc.oneof(
    // Missing type
    fc.record({ data: fc.dictionary(fc.string(), fc.jsonValue()) }),
    // Missing data
    fc.record({ type: fc.string() }),
    // Wrong type for type field
    fc.record({ type: fc.integer(), data: fc.dictionary(fc.string(), fc.jsonValue()) }),
    // Wrong type for data field
    fc.record({ type: fc.string(), data: fc.string() }),
);

describe('Schema Validator Properties', () => {
    /**
     * Feature: testing-validation, Property 29: Schema validation correctness
     * For any data that conforms to a predefined schema, validateSchema SHALL return true;
     * for non-conforming data, it SHALL return false.
     */
    it('Property 29: Schema validation correctness - valid Resource', () => {
        fc.assert(
            fc.property(validResourceArb, (resource) => {
                expect(validateSchema(resource, 'Resource')).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 29: Schema validation correctness - invalid Resource', () => {
        fc.assert(
            fc.property(invalidResourceArb, (resource) => {
                expect(validateSchema(resource, 'Resource')).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    it('Property 29: Schema validation correctness - valid WalletState', () => {
        fc.assert(
            fc.property(validWalletStateArb, (state) => {
                expect(validateSchema(state, 'WalletState')).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 30: Validation error details
     * For any data that fails schema validation, getValidationErrors SHALL return
     * an array containing at least one error with path, expected, received, and message.
     */
    it('Property 30: Validation error details', () => {
        fc.assert(
            fc.property(invalidResourceArb, (resource) => {
                const errors = getValidationErrors(resource, 'Resource');
                expect(errors.length).toBeGreaterThan(0);

                for (const error of errors) {
                    expect(error).toHaveProperty('path');
                    expect(error).toHaveProperty('expected');
                    expect(error).toHaveProperty('received');
                    expect(error).toHaveProperty('message');
                }
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 31: Custom schema registration
     * For any valid schema definition registered with registerSchema,
     * subsequent validateSchema calls with that schema name SHALL use the registered schema.
     */
    it('Property 31: Custom schema registration', () => {
        // Register a custom schema
        const customSchema = object({
            name: string(),
            value: number(),
        });

        registerSchema('CustomTest', customSchema);

        fc.assert(
            fc.property(
                fc.record({
                    name: fc.string({ minLength: 1 }),
                    value: fc.integer(),
                }),
                (data) => {
                    expect(hasSchema('CustomTest')).toBe(true);
                    expect(validateSchema(data, 'CustomTest')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: testing-validation, Property 32: Unknown schema error
     * For any schema name not in the predefined set and not registered,
     * validateSchema SHALL throw a MovementError with code 'INVALID_ARGUMENT'.
     */
    it('Property 32: Unknown schema error', () => {
        fc.assert(
            fc.property(
                // Generate random strings that are unlikely to match known schemas
                fc.string({ minLength: 10, maxLength: 50 }).map(s => `Unknown_${s}_Schema`),
                (schemaName) => {
                    // Skip if somehow matches a known schema
                    if (hasSchema(schemaName)) {
                        return true;
                    }

                    try {
                        validateSchema({}, schemaName);
                        expect.fail('Expected validateSchema to throw');
                    } catch (error) {
                        expect(error).toBeInstanceOf(MovementError);
                        expect((error as MovementError).code).toBe('INVALID_ARGUMENT');
                        expect((error as MovementError).details?.schemaName).toBe(schemaName);
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Faker outputs pass schema validation
     */
    it('Property: Faker outputs pass schema validation', () => {
        const faker = createFaker({ seed: 12345 });

        // Test multiple faker outputs
        for (let i = 0; i < 100; i++) {
            const resource = faker.fakeResource('0x1::test::Type');
            expect(validateSchema(resource, 'Resource')).toBe(true);

            const walletState = faker.fakeWalletState(i % 2 === 0);
            expect(validateSchema(walletState, 'WalletState')).toBe(true);

            const event = faker.fakeEvent('0x1::test::Event');
            expect(validateSchema(event, 'ContractEvent')).toBe(true);
        }
    });
});
