/**
 * @movebridge/testing - Unit tests for Schema Validator
 */

import { describe, it, expect } from 'vitest';
import { object, string, number } from 'superstruct';
import { MovementError } from '@movebridge/core';
import {
    validateSchema,
    getValidationErrors,
    registerSchema,
    hasSchema,
    PREDEFINED_SCHEMAS,
} from '../validators/schema';

describe('Schema Validator', () => {
    describe('PREDEFINED_SCHEMAS', () => {
        it('should have Resource schema', () => {
            expect(PREDEFINED_SCHEMAS.Resource).toBeDefined();
        });

        it('should have Transaction schema', () => {
            expect(PREDEFINED_SCHEMAS.Transaction).toBeDefined();
        });

        it('should have TransactionResponse schema', () => {
            expect(PREDEFINED_SCHEMAS.TransactionResponse).toBeDefined();
        });

        it('should have WalletState schema', () => {
            expect(PREDEFINED_SCHEMAS.WalletState).toBeDefined();
        });

        it('should have ContractEvent schema', () => {
            expect(PREDEFINED_SCHEMAS.ContractEvent).toBeDefined();
        });
    });

    describe('validateSchema', () => {
        it('should return true for valid Resource', () => {
            const resource = {
                type: '0x1::coin::CoinStore',
                data: { value: '1000' },
            };
            expect(validateSchema(resource, 'Resource')).toBe(true);
        });

        it('should return false for invalid Resource', () => {
            const invalid = { type: 123 }; // type should be string
            expect(validateSchema(invalid, 'Resource')).toBe(false);
        });

        it('should return true for valid WalletState (connected)', () => {
            const state = {
                connected: true,
                address: '0x1234',
                publicKey: '0x5678',
            };
            expect(validateSchema(state, 'WalletState')).toBe(true);
        });

        it('should return true for valid WalletState (disconnected)', () => {
            const state = {
                connected: false,
                address: null,
                publicKey: null,
            };
            expect(validateSchema(state, 'WalletState')).toBe(true);
        });

        it('should return true for valid ContractEvent', () => {
            const event = {
                type: '0x1::test::Event',
                sequenceNumber: '123',
                data: { value: 'test' },
            };
            expect(validateSchema(event, 'ContractEvent')).toBe(true);
        });

        it('should throw for unknown schema', () => {
            expect(() => validateSchema({}, 'UnknownSchema')).toThrow(MovementError);
        });
    });

    describe('getValidationErrors', () => {
        it('should return empty array for valid data', () => {
            const resource = {
                type: '0x1::coin::CoinStore',
                data: { value: '1000' },
            };
            const errors = getValidationErrors(resource, 'Resource');
            expect(errors).toEqual([]);
        });

        it('should return errors for invalid data', () => {
            const invalid = { type: 123 };
            const errors = getValidationErrors(invalid, 'Resource');
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should include path in error', () => {
            const invalid = { type: 123, data: {} };
            const errors = getValidationErrors(invalid, 'Resource');
            const typeError = errors.find(e => e.path === 'type');
            expect(typeError).toBeDefined();
        });

        it('should include expected type in error', () => {
            const invalid = { type: 123, data: {} };
            const errors = getValidationErrors(invalid, 'Resource');
            const typeError = errors.find(e => e.path === 'type');
            expect(typeError?.expected).toBe('string');
        });

        it('should include received type in error', () => {
            const invalid = { type: 123, data: {} };
            const errors = getValidationErrors(invalid, 'Resource');
            const typeError = errors.find(e => e.path === 'type');
            expect(typeError?.received).toBe('number');
        });

        it('should include message in error', () => {
            const invalid = { type: 123, data: {} };
            const errors = getValidationErrors(invalid, 'Resource');
            expect(errors[0]?.message).toBeDefined();
        });
    });

    describe('registerSchema', () => {
        it('should register a custom schema', () => {
            const customSchema = object({
                name: string(),
                age: number(),
            });

            registerSchema('Person', customSchema);
            expect(hasSchema('Person')).toBe(true);
        });

        it('should allow validation with registered schema', () => {
            const person = { name: 'John', age: 30 };
            expect(validateSchema(person, 'Person')).toBe(true);
        });

        it('should reject invalid data for registered schema', () => {
            const invalid = { name: 'John', age: 'thirty' };
            expect(validateSchema(invalid, 'Person')).toBe(false);
        });

        it('should throw when trying to override predefined schema', () => {
            const customSchema = object({ type: string() });
            expect(() => registerSchema('Resource', customSchema)).toThrow(MovementError);
        });
    });

    describe('hasSchema', () => {
        it('should return true for predefined schemas', () => {
            expect(hasSchema('Resource')).toBe(true);
            expect(hasSchema('Transaction')).toBe(true);
            expect(hasSchema('WalletState')).toBe(true);
        });

        it('should return true for registered custom schemas', () => {
            registerSchema('TestSchema', object({ test: string() }));
            expect(hasSchema('TestSchema')).toBe(true);
        });

        it('should return false for unknown schemas', () => {
            expect(hasSchema('NonExistentSchema')).toBe(false);
        });
    });

    describe('Transaction schema', () => {
        it('should validate complete transaction', () => {
            const transaction = {
                hash: '0x123',
                sender: '0x456',
                sequenceNumber: '1',
                payload: {
                    function: '0x1::coin::transfer',
                    typeArguments: [],
                    functionArguments: [],
                },
                timestamp: '1234567890',
            };
            expect(validateSchema(transaction, 'Transaction')).toBe(true);
        });

        it('should reject transaction with missing payload fields', () => {
            const transaction = {
                hash: '0x123',
                sender: '0x456',
                sequenceNumber: '1',
                payload: {
                    function: '0x1::coin::transfer',
                    // missing typeArguments and functionArguments
                },
                timestamp: '1234567890',
            };
            expect(validateSchema(transaction, 'Transaction')).toBe(false);
        });
    });

    describe('TransactionResponse schema', () => {
        it('should validate complete transaction response', () => {
            const response = {
                hash: '0x123',
                success: true,
                vmStatus: 'Executed successfully',
                gasUsed: '100',
                events: [],
            };
            expect(validateSchema(response, 'TransactionResponse')).toBe(true);
        });

        it('should validate response with events', () => {
            const response = {
                hash: '0x123',
                success: true,
                vmStatus: 'Executed successfully',
                gasUsed: '100',
                events: [
                    {
                        type: '0x1::test::Event',
                        sequenceNumber: '1',
                        data: { value: 'test' },
                    },
                ],
            };
            expect(validateSchema(response, 'TransactionResponse')).toBe(true);
        });
    });
});
