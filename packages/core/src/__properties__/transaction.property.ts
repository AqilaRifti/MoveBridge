/**
 * Property-based tests for Transaction Builder
 * @module @movebridge/core
 * 
 * These tests validate the SDK rework correctness properties.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TransactionBuilder } from '../transaction';
import { WalletManager } from '../wallet';
import type { TransferOptions, BuildOptions, TransactionPayload } from '../types';

// Mock Aptos client
const mockAptosClient = {
    transaction: {
        build: { simple: vi.fn() },
        simulate: { simple: vi.fn() },
    },
} as unknown as Parameters<typeof TransactionBuilder>[0];

describe('Transaction Builder Properties', () => {
    let walletManager: WalletManager;
    let transactionBuilder: TransactionBuilder;

    beforeEach(() => {
        vi.clearAllMocks();
        walletManager = new WalletManager();
        transactionBuilder = new TransactionBuilder(mockAptosClient, walletManager);
    });

    /**
     * Feature: sdk-rework, Property 1: Transfer Payload Construction
     * For any valid recipient address and amount, calling transfer() SHALL produce a payload with:
     * - function equal to '0x1::aptos_account::transfer'
     * - functionArguments containing [recipientAddress, amount] in that order
     * 
     * **Validates: Requirements 1.1**
     */
    it('Property 1: Transfer Payload Construction', async () => {
        // Generate valid hex addresses (0x followed by 1-64 hex chars)
        const addressArb = fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`);
        // Generate amounts as strings (to handle large numbers)
        const amountArb = fc.nat({ max: Number.MAX_SAFE_INTEGER }).map(String);

        await fc.assert(
            fc.asyncProperty(addressArb, amountArb, async (to, amount) => {
                const payload = await transactionBuilder.transfer({ to, amount });

                // Verify function is aptos_account::transfer
                expect(payload.function).toBe('0x1::aptos_account::transfer');

                // Verify no type arguments (aptos_account::transfer doesn't need them)
                expect(payload.typeArguments).toEqual([]);

                // Verify functionArguments contains [to, amount] in order
                expect(payload.functionArguments).toHaveLength(2);
                expect(payload.functionArguments[0]).toBe(to);
                expect(payload.functionArguments[1]).toBe(amount);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sdk-rework, Property 10: AIP-62 Payload Formatting
     * For any transaction submission, the payload SHALL have the structure:
     * { function: string, typeArguments: string[], functionArguments: unknown[] }
     * 
     * **Validates: Requirements 7.1**
     */
    it('Property 10: AIP-62 Payload Formatting', async () => {
        const functionArb = fc.tuple(
            fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
        ).map(([addr, mod, fn]) => `${addr}::${mod}::${fn}`);

        const typeArgsArb = fc.array(fc.string({ minLength: 1 }), { maxLength: 3 });
        const argsArb = fc.array(
            fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            { maxLength: 5 }
        );

        await fc.assert(
            fc.asyncProperty(functionArb, typeArgsArb, argsArb, async (func, typeArguments, args) => {
                const payload = await transactionBuilder.build({
                    function: func,
                    typeArguments,
                    arguments: args,
                });

                // Verify AIP-62 structure
                expect(typeof payload.function).toBe('string');
                expect(Array.isArray(payload.typeArguments)).toBe(true);
                expect(Array.isArray(payload.functionArguments)).toBe(true);

                // Verify content matches input
                expect(payload.function).toBe(func);
                expect(payload.typeArguments).toEqual(typeArguments);
                expect(payload.functionArguments).toEqual(args);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: sdk-rework, Property 5: Entry Function Type Arguments
     * For any entry function call with type arguments, the transaction payload
     * SHALL include those type arguments in the typeArguments field.
     * 
     * **Validates: Requirements 3.5**
     */
    it('Property 5: Entry Function Type Arguments', async () => {
        const typeArgsArb = fc.array(
            fc.tuple(
                fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`),
                fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
                fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
            ).map(([addr, mod, type]) => `${addr}::${mod}::${type}`),
            { minLength: 1, maxLength: 3 }
        );

        await fc.assert(
            fc.asyncProperty(typeArgsArb, async (typeArguments) => {
                const payload = await transactionBuilder.build({
                    function: '0x1::coin::transfer',
                    typeArguments,
                    arguments: ['0x123', '1000'],
                });

                // Verify type arguments are preserved exactly
                expect(payload.typeArguments).toEqual(typeArguments);
                expect(payload.typeArguments).toHaveLength(typeArguments.length);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Build preserves all arguments exactly
     */
    it('Property: Build preserves all arguments exactly', async () => {
        const argsArb = fc.array(
            fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.array(fc.integer(), { maxLength: 5 })
            ),
            { maxLength: 10 }
        );

        await fc.assert(
            fc.asyncProperty(argsArb, async (args) => {
                const payload = await transactionBuilder.build({
                    function: '0x1::test::func',
                    typeArguments: [],
                    arguments: args,
                });

                expect(payload.functionArguments).toEqual(args);
                expect(payload.functionArguments).toHaveLength(args.length);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: Transfer amount is preserved as string
     */
    it('Property: Transfer amount is preserved as string', async () => {
        const addressArb = fc.hexaString({ minLength: 1, maxLength: 64 }).map((h) => `0x${h}`);
        // Test with large numbers that would lose precision as floats
        const amountArb = fc.bigInt({ min: 0n, max: BigInt('999999999999999999') }).map(String);

        await fc.assert(
            fc.asyncProperty(addressArb, amountArb, async (to, amount) => {
                const payload = await transactionBuilder.transfer({ to, amount });

                // Amount should be preserved exactly as string
                expect(payload.functionArguments[1]).toBe(amount);
                expect(typeof payload.functionArguments[1]).toBe('string');

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
