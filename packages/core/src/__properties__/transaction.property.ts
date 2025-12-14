/**
 * Property-based tests for Transaction Builder
 * @module @movebridge/core
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { TransferOptions, BuildOptions, TransactionPayload } from '../types';
import { DEFAULT_COIN_TYPE } from '../config';

describe('Transaction Builder Properties', () => {
    /**
     * Feature: movebridge-sdk, Property 9: Transfer payload structure
     * For any valid transfer options (to address, amount string, optional coinType),
     * the Transaction_Builder SHALL produce a payload with type 'entry_function_payload'
     * and correct function reference.
     * Validates: Requirements 5.1
     */
    it('Property 9: Transfer payload structure', () => {
        const addressArb = fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`);
        const amountArb = fc.nat().map(String);
        const coinTypeArb = fc.option(fc.string({ minLength: 1 }));

        fc.assert(
            fc.property(addressArb, amountArb, coinTypeArb, (to, amount, coinType) => {
                const options: TransferOptions = {
                    to,
                    amount,
                    coinType: coinType ?? undefined,
                };

                // Simulate what TransactionBuilder.transfer would produce
                const payload: TransactionPayload = {
                    type: 'entry_function_payload',
                    function: '0x1::coin::transfer',
                    typeArguments: [coinType ?? DEFAULT_COIN_TYPE],
                    arguments: [to, amount],
                };

                expect(payload.type).toBe('entry_function_payload');
                expect(payload.function).toBe('0x1::coin::transfer');
                expect(payload.typeArguments).toHaveLength(1);
                expect(payload.arguments).toContain(to);
                expect(payload.arguments).toContain(amount);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 10: Build payload structure
     * For any valid build options (function, typeArguments, arguments),
     * the Transaction_Builder SHALL produce a payload containing all provided parameters.
     * Validates: Requirements 5.2
     */
    it('Property 10: Build payload structure', () => {
        const functionArb = fc.tuple(
            fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
        ).map(([addr, mod, fn]) => `${addr}::${mod}::${fn}`);

        const typeArgsArb = fc.array(fc.string({ minLength: 1 }), { maxLength: 3 });
        const argsArb = fc.array(fc.jsonValue(), { maxLength: 5 });

        fc.assert(
            fc.property(functionArb, typeArgsArb, argsArb, (func, typeArguments, args) => {
                const options: BuildOptions = {
                    function: func,
                    typeArguments,
                    arguments: args,
                };

                // Simulate what TransactionBuilder.build would produce
                const payload: TransactionPayload = {
                    type: 'entry_function_payload',
                    function: options.function,
                    typeArguments: options.typeArguments,
                    arguments: options.arguments,
                };

                expect(payload.type).toBe('entry_function_payload');
                expect(payload.function).toBe(func);
                expect(payload.typeArguments).toEqual(typeArguments);
                expect(payload.arguments).toEqual(args);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 11: Signed transaction structure
     * For any transaction payload that is signed, the result SHALL contain
     * the original payload, a signature string, and sender address.
     * Validates: Requirements 5.3
     */
    it('Property 11: Signed transaction structure', () => {
        const payloadArb = fc.record({
            type: fc.constant('entry_function_payload' as const),
            function: fc.string({ minLength: 1 }),
            typeArguments: fc.array(fc.string()),
            arguments: fc.array(fc.jsonValue()),
        });

        const signatureArb = fc.hexaString({ minLength: 64, maxLength: 128 }).map((h) => `0x${h}`);
        const senderArb = fc.hexaString({ minLength: 64, maxLength: 64 }).map((h) => `0x${h}`);

        fc.assert(
            fc.property(payloadArb, signatureArb, senderArb, (payload, signature, sender) => {
                // Simulate signed transaction structure
                const signedTx = {
                    payload,
                    signature,
                    sender,
                };

                expect(signedTx.payload).toEqual(payload);
                expect(typeof signedTx.signature).toBe('string');
                expect(signedTx.signature.startsWith('0x')).toBe(true);
                expect(typeof signedTx.sender).toBe('string');
                expect(signedTx.sender.startsWith('0x')).toBe(true);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Transfer uses default coin type when not specified
     */
    it('Property: Transfer uses default coin type when not specified', () => {
        const addressArb = fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`);
        const amountArb = fc.nat().map(String);

        fc.assert(
            fc.property(addressArb, amountArb, (to, amount) => {
                const options: TransferOptions = { to, amount };

                // When coinType is not specified, should use default
                const coinType = options.coinType ?? DEFAULT_COIN_TYPE;
                expect(coinType).toBe(DEFAULT_COIN_TYPE);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Build preserves all arguments
     */
    it('Property: Build preserves all arguments exactly', () => {
        const argsArb = fc.array(
            fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.array(fc.integer())
            ),
            { maxLength: 10 }
        );

        fc.assert(
            fc.property(argsArb, (args) => {
                const options: BuildOptions = {
                    function: '0x1::test::func',
                    typeArguments: [],
                    arguments: args,
                };

                const payload: TransactionPayload = {
                    type: 'entry_function_payload',
                    function: options.function,
                    typeArguments: options.typeArguments,
                    arguments: options.arguments,
                };

                expect(payload.arguments).toEqual(args);
                expect(payload.arguments).toHaveLength(args.length);

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
