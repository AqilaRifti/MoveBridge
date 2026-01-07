/**
 * @movebridge/testing - Unit tests for Transaction Validator
 */

import { describe, it, expect } from 'vitest';
import { MovementError } from '@movebridge/core';
import {
    validateTransferPayload,
    validateEntryFunctionPayload,
    validatePayload,
} from '../validators/transaction';

describe('Transaction Validator', () => {
    describe('validateTransferPayload', () => {
        const validAddress = '0x' + 'a'.repeat(64);

        it('should accept valid transfer payload', () => {
            expect(
                validateTransferPayload({
                    to: validAddress,
                    amount: '1000000',
                })
            ).toBe(true);
        });

        it('should accept transfer with coinType', () => {
            expect(
                validateTransferPayload({
                    to: validAddress,
                    amount: '1000000',
                    coinType: '0x1::aptos_coin::AptosCoin',
                })
            ).toBe(true);
        });

        it('should reject invalid recipient address', () => {
            expect(() =>
                validateTransferPayload({
                    to: 'invalid',
                    amount: '1000000',
                })
            ).toThrow(MovementError);
        });

        it('should reject negative amount', () => {
            try {
                validateTransferPayload({
                    to: validAddress,
                    amount: '-100',
                });
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).code).toBe('INVALID_ARGUMENT');
                expect((error as MovementError).details?.argument).toBe('amount');
            }
        });

        it('should reject zero amount', () => {
            expect(() =>
                validateTransferPayload({
                    to: validAddress,
                    amount: '0',
                })
            ).toThrow(MovementError);
        });

        it('should reject non-numeric amount', () => {
            expect(() =>
                validateTransferPayload({
                    to: validAddress,
                    amount: 'abc',
                })
            ).toThrow(MovementError);
        });

        it('should reject decimal amount', () => {
            expect(() =>
                validateTransferPayload({
                    to: validAddress,
                    amount: '100.5',
                })
            ).toThrow(MovementError);
        });

        it('should reject empty coinType', () => {
            expect(() =>
                validateTransferPayload({
                    to: validAddress,
                    amount: '1000',
                    coinType: '',
                })
            ).toThrow(MovementError);
        });
    });

    describe('validateEntryFunctionPayload', () => {
        const validFunction = '0x' + 'a'.repeat(64) + '::module::function';

        it('should accept valid entry function payload', () => {
            expect(
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: [],
                    arguments: [],
                })
            ).toBe(true);
        });

        it('should accept payload with type arguments', () => {
            expect(
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: ['0x1::aptos_coin::AptosCoin'],
                    arguments: [],
                })
            ).toBe(true);
        });

        it('should accept payload with arguments', () => {
            expect(
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: [],
                    arguments: ['arg1', 123, true],
                })
            ).toBe(true);
        });

        it('should reject invalid function format - missing module', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: '0x1::function',
                    typeArguments: [],
                    arguments: [],
                })
            ).toThrow(MovementError);
        });

        it('should reject invalid function format - no address', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: 'module::function',
                    typeArguments: [],
                    arguments: [],
                })
            ).toThrow(MovementError);
        });

        it('should reject invalid function format - invalid address', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: 'invalid::module::function',
                    typeArguments: [],
                    arguments: [],
                })
            ).toThrow(MovementError);
        });

        it('should reject non-array typeArguments', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: 'not-an-array' as unknown as string[],
                    arguments: [],
                })
            ).toThrow(MovementError);
        });

        it('should reject non-string typeArguments elements', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: [123 as unknown as string],
                    arguments: [],
                })
            ).toThrow(MovementError);
        });

        it('should reject non-array arguments', () => {
            expect(() =>
                validateEntryFunctionPayload({
                    function: validFunction,
                    typeArguments: [],
                    arguments: 'not-an-array' as unknown as unknown[],
                })
            ).toThrow(MovementError);
        });
    });

    describe('validatePayload', () => {
        const validFunction = '0x' + 'a'.repeat(64) + '::module::function';

        it('should accept valid transaction payload', () => {
            expect(
                validatePayload({
                    function: validFunction,
                    typeArguments: [],
                    functionArguments: [],
                })
            ).toBe(true);
        });

        it('should reject null payload', () => {
            expect(() => validatePayload(null as unknown as any)).toThrow(MovementError);
        });

        it('should reject non-object payload', () => {
            expect(() => validatePayload('string' as unknown as any)).toThrow(MovementError);
        });

        it('should validate function format in payload', () => {
            expect(() =>
                validatePayload({
                    function: 'invalid',
                    typeArguments: [],
                    functionArguments: [],
                })
            ).toThrow(MovementError);
        });
    });
});
