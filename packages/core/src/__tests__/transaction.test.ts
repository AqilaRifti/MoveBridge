/**
 * Unit tests for Transaction Builder
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionBuilder } from '../transaction';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';
import { DEFAULT_COIN_TYPE } from '../config';

// Mock Aptos client
const mockAptosClient = {
    transaction: {
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
        it('should build transfer payload with default coin type', async () => {
            const payload = await transactionBuilder.transfer({
                to: '0x123',
                amount: '1000000',
            });

            expect(payload.type).toBe('entry_function_payload');
            expect(payload.function).toBe('0x1::coin::transfer');
            expect(payload.typeArguments).toEqual([DEFAULT_COIN_TYPE]);
            expect(payload.arguments).toEqual(['0x123', '1000000']);
        });

        it('should build transfer payload with custom coin type', async () => {
            const customCoinType = '0x1::custom_coin::CustomCoin';
            const payload = await transactionBuilder.transfer({
                to: '0x456',
                amount: '2000000',
                coinType: customCoinType,
            });

            expect(payload.typeArguments).toEqual([customCoinType]);
            expect(payload.arguments).toEqual(['0x456', '2000000']);
        });

        it('should preserve amount as string', async () => {
            const payload = await transactionBuilder.transfer({
                to: '0x123',
                amount: '999999999999999999',
            });

            expect(payload.arguments[1]).toBe('999999999999999999');
            expect(typeof payload.arguments[1]).toBe('string');
        });
    });

    describe('build', () => {
        it('should build generic transaction payload', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::counter::increment',
                typeArguments: [],
                arguments: [],
            });

            expect(payload.type).toBe('entry_function_payload');
            expect(payload.function).toBe('0x1::counter::increment');
            expect(payload.typeArguments).toEqual([]);
            expect(payload.arguments).toEqual([]);
        });

        it('should include type arguments', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::coin::transfer',
                typeArguments: ['0x1::aptos_coin::AptosCoin'],
                arguments: ['0x123', '1000'],
            });

            expect(payload.typeArguments).toEqual(['0x1::aptos_coin::AptosCoin']);
        });

        it('should include all arguments', async () => {
            const args = ['0x123', '1000', true, [1, 2, 3]];
            const payload = await transactionBuilder.build({
                function: '0x1::test::func',
                typeArguments: [],
                arguments: args,
            });

            expect(payload.arguments).toEqual(args);
        });
    });

    describe('sign', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            const payload = await transactionBuilder.build({
                function: '0x1::test::func',
                typeArguments: [],
                arguments: [],
            });

            await expect(transactionBuilder.sign(payload)).rejects.toThrow(MovementError);
            await expect(transactionBuilder.sign(payload)).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
        });
    });

    describe('submit', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            const signedTx = {
                payload: {
                    type: 'entry_function_payload' as const,
                    function: '0x1::test::func',
                    typeArguments: [],
                    arguments: [],
                },
                signature: '0x123',
                sender: '0x456',
            };

            await expect(transactionBuilder.submit(signedTx)).rejects.toThrow(MovementError);
            await expect(transactionBuilder.submit(signedTx)).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
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
});
