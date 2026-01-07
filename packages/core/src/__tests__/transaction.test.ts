/**
 * Unit tests for Transaction Builder
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionBuilder } from '../transaction';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';

// Mock Aptos client
const mockAptosClient = {
    transaction: {
        build: {
            simple: vi.fn(),
        },
        simulate: {
            simple: vi.fn(),
        },
    },
} as unknown as Parameters<typeof TransactionBuilder>[0];

describe('TransactionBuilder', () => {
    let walletManager: WalletManager;
    let transactionBuilder: TransactionBuilder;

    beforeEach(() => {
        vi.clearAllMocks();
        walletManager = new WalletManager();
        transactionBuilder = new TransactionBuilder(mockAptosClient, walletManager);
    });

    describe('transfer', () => {
        it('should build transfer payload using aptos_account::transfer', async () => {
            const payload = await transactionBuilder.transfer({
                to: '0x123',
                amount: '1000000',
            });

            // New format uses aptos_account::transfer (no coin type needed)
            expect(payload.function).toBe('0x1::aptos_account::transfer');
            expect(payload.typeArguments).toEqual([]);
            expect(payload.functionArguments).toEqual(['0x123', '1000000']);
        });

        it('should preserve amount as string', async () => {
            const payload = await transactionBuilder.transfer({
                to: '0x123',
                amount: '999999999999999999',
            });

            expect(payload.functionArguments[1]).toBe('999999999999999999');
            expect(typeof payload.functionArguments[1]).toBe('string');
        });
    });

    describe('build', () => {
        it('should build generic transaction payload', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::counter::increment',
                typeArguments: [],
                arguments: [],
            });

            expect(payload.function).toBe('0x1::counter::increment');
            expect(payload.typeArguments).toEqual([]);
            expect(payload.functionArguments).toEqual([]);
        });

        it('should include type arguments', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::coin::transfer',
                typeArguments: ['0x1::aptos_coin::AptosCoin'],
                arguments: ['0x123', '1000'],
            });

            expect(payload.typeArguments).toEqual(['0x1::aptos_coin::AptosCoin']);
        });

        it('should include all arguments as functionArguments', async () => {
            const args = ['0x123', '1000', true, [1, 2, 3]];
            const payload = await transactionBuilder.build({
                function: '0x1::test::func',
                typeArguments: [],
                arguments: args,
            });

            expect(payload.functionArguments).toEqual(args);
        });
    });

    describe('signAndSubmit', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::test::func',
                typeArguments: [],
                arguments: [],
            });

            await expect(transactionBuilder.signAndSubmit(payload)).rejects.toThrow(MovementError);
            await expect(transactionBuilder.signAndSubmit(payload)).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
        });
    });

    describe('simulate', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::test::func',
                typeArguments: [],
                arguments: [],
            });

            await expect(transactionBuilder.simulate(payload)).rejects.toThrow(MovementError);
            await expect(transactionBuilder.simulate(payload)).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
        });
    });

    describe('transferAndSubmit', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            await expect(
                transactionBuilder.transferAndSubmit({
                    to: '0x123',
                    amount: '1000000',
                })
            ).rejects.toThrow(MovementError);
            await expect(
                transactionBuilder.transferAndSubmit({
                    to: '0x123',
                    amount: '1000000',
                })
            ).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
        });
    });
});
