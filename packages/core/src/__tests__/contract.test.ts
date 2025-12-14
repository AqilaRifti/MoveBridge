/**
 * Unit tests for Contract Interface
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractInterface } from '../contract';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';

// Mock Aptos client
const mockAptosClient = {
    view: vi.fn(),
    getAccountResource: vi.fn(),
} as unknown as Parameters<typeof ContractInterface>[0];

describe('ContractInterface', () => {
    let walletManager: WalletManager;
    let contract: ContractInterface;

    beforeEach(() => {
        vi.clearAllMocks();
        walletManager = new WalletManager();
        contract = new ContractInterface(mockAptosClient, walletManager, {
            address: '0x123',
            module: 'counter',
        });
    });

    describe('Configuration', () => {
        it('should preserve address and module', () => {
            expect(contract.address).toBe('0x123');
            expect(contract.module).toBe('counter');
        });

        it('should generate correct full function name', () => {
            expect(contract.getFullFunctionName('increment')).toBe('0x123::counter::increment');
            expect(contract.getFullFunctionName('get_count')).toBe('0x123::counter::get_count');
        });
    });

    describe('view', () => {
        it('should call view function with correct parameters', async () => {
            mockAptosClient.view.mockResolvedValue([42]);

            const result = await contract.view('get_count', []);

            expect(mockAptosClient.view).toHaveBeenCalledWith({
                payload: {
                    function: '0x123::counter::get_count',
                    typeArguments: [],
                    functionArguments: [],
                },
            });
            expect(result).toBe(42);
        });

        it('should pass arguments to view function', async () => {
            mockAptosClient.view.mockResolvedValue(['result']);

            await contract.view('get_value', ['arg1', 'arg2']);

            expect(mockAptosClient.view).toHaveBeenCalledWith({
                payload: {
                    function: '0x123::counter::get_value',
                    typeArguments: [],
                    functionArguments: ['arg1', 'arg2'],
                },
            });
        });

        it('should pass type arguments to view function', async () => {
            mockAptosClient.view.mockResolvedValue([100]);

            await contract.view('get_balance', ['0x456'], ['0x1::aptos_coin::AptosCoin']);

            expect(mockAptosClient.view).toHaveBeenCalledWith({
                payload: {
                    function: '0x123::counter::get_balance',
                    typeArguments: ['0x1::aptos_coin::AptosCoin'],
                    functionArguments: ['0x456'],
                },
            });
        });

        it('should return array when multiple results', async () => {
            mockAptosClient.view.mockResolvedValue([1, 2, 3]);

            const result = await contract.view('get_multiple', []);

            expect(result).toEqual([1, 2, 3]);
        });

        it('should throw VIEW_FUNCTION_FAILED on error', async () => {
            mockAptosClient.view.mockRejectedValue(new Error('Function not found'));

            await expect(contract.view('invalid_func', [])).rejects.toThrow(MovementError);
            await expect(contract.view('invalid_func', [])).rejects.toMatchObject({
                code: 'VIEW_FUNCTION_FAILED',
            });
        });

        it('should include function name in error details', async () => {
            mockAptosClient.view.mockRejectedValue(new Error('Error'));

            try {
                await contract.view('failing_func', ['arg1']);
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).details?.function).toBe('0x123::counter::failing_func');
                expect((error as MovementError).details?.args).toEqual(['arg1']);
            }
        });
    });

    describe('call', () => {
        it('should throw WALLET_NOT_CONNECTED when no wallet is connected', async () => {
            await expect(contract.call('increment', [])).rejects.toThrow(MovementError);
            await expect(contract.call('increment', [])).rejects.toMatchObject({
                code: 'WALLET_NOT_CONNECTED',
            });
        });
    });

    describe('hasResource', () => {
        it('should return true when resource exists', async () => {
            mockAptosClient.getAccountResource.mockResolvedValue({ data: {} });

            const result = await contract.hasResource('0x1::coin::CoinStore');

            expect(result).toBe(true);
        });

        it('should return false when resource does not exist', async () => {
            mockAptosClient.getAccountResource.mockRejectedValue(new Error('Not found'));

            const result = await contract.hasResource('0x1::coin::CoinStore');

            expect(result).toBe(false);
        });
    });

    describe('getResource', () => {
        it('should return resource data when exists', async () => {
            const resourceData = { coin: { value: '1000' } };
            mockAptosClient.getAccountResource.mockResolvedValue(resourceData);

            const result = await contract.getResource('0x1::coin::CoinStore');

            expect(result).toEqual(resourceData);
        });

        it('should return null when resource does not exist', async () => {
            mockAptosClient.getAccountResource.mockRejectedValue(new Error('Not found'));

            const result = await contract.getResource('0x1::coin::CoinStore');

            expect(result).toBeNull();
        });
    });
});
