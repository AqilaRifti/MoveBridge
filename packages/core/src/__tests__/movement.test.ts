/**
 * Unit tests for Movement client
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Movement } from '../client';
import { NETWORK_CONFIG, isValidAddress } from '../config';
import { MovementError } from '../errors';

// Mock the Aptos SDK
vi.mock('@aptos-labs/ts-sdk', () => ({
    Aptos: vi.fn().mockImplementation(() => ({
        getAccountResources: vi.fn(),
        getTransactionByHash: vi.fn(),
        view: vi.fn(),
    })),
    AptosConfig: vi.fn().mockImplementation((config) => config),
    Network: {
        CUSTOM: 'custom',
    },
}));

describe('Movement Client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with mainnet configuration', () => {
            const movement = new Movement({ network: 'mainnet' });

            expect(movement.config.network).toBe('mainnet');
            expect(movement.config.chainId).toBe(126);
            expect(movement.config.rpcUrl).toBe(NETWORK_CONFIG.mainnet.rpcUrl);
            expect(movement.config.indexerUrl).toBe(NETWORK_CONFIG.mainnet.indexerUrl);
        });

        it('should initialize with testnet configuration', () => {
            const movement = new Movement({ network: 'testnet' });

            expect(movement.config.network).toBe('testnet');
            expect(movement.config.chainId).toBe(250);
            expect(movement.config.rpcUrl).toBe(NETWORK_CONFIG.testnet.rpcUrl);
            expect(movement.config.indexerUrl).toBe(NETWORK_CONFIG.testnet.indexerUrl);
        });

        it('should use custom RPC URL when provided', () => {
            const customRpcUrl = 'https://custom.rpc.url/v1';
            const movement = new Movement({
                network: 'testnet',
                rpcUrl: customRpcUrl,
            });

            expect(movement.config.rpcUrl).toBe(customRpcUrl);
            expect(movement.config.chainId).toBe(250); // Chain ID should still be correct
        });

        it('should use custom indexer URL when provided', () => {
            const customIndexerUrl = 'https://custom.indexer.url/v1/graphql';
            const movement = new Movement({
                network: 'mainnet',
                indexerUrl: customIndexerUrl,
            });

            expect(movement.config.indexerUrl).toBe(customIndexerUrl);
        });

        it('should default autoConnect to false', () => {
            const movement = new Movement({ network: 'testnet' });
            expect(movement.config.autoConnect).toBe(false);
        });

        it('should respect autoConnect option', () => {
            const movement = new Movement({
                network: 'testnet',
                autoConnect: true,
            });
            expect(movement.config.autoConnect).toBe(true);
        });

        it('should expose wallet manager', () => {
            const movement = new Movement({ network: 'testnet' });
            expect(movement.wallet).toBeDefined();
            expect(typeof movement.wallet.connect).toBe('function');
            expect(typeof movement.wallet.disconnect).toBe('function');
        });

        it('should expose transaction builder', () => {
            const movement = new Movement({ network: 'testnet' });
            expect(movement.transaction).toBeDefined();
            expect(typeof movement.transaction.transfer).toBe('function');
            expect(typeof movement.transaction.build).toBe('function');
        });

        it('should expose event listener', () => {
            const movement = new Movement({ network: 'testnet' });
            expect(movement.events).toBeDefined();
            expect(typeof movement.events.subscribe).toBe('function');
            expect(typeof movement.events.unsubscribe).toBe('function');
        });
    });

    describe('Address Validation', () => {
        it('should validate correct addresses', () => {
            expect(isValidAddress('0x1')).toBe(true);
            expect(isValidAddress('0x123abc')).toBe(true);
            expect(isValidAddress('0x' + 'a'.repeat(64))).toBe(true);
            expect(isValidAddress('0xABCDEF123456')).toBe(true);
        });

        it('should reject invalid addresses', () => {
            expect(isValidAddress('')).toBe(false);
            expect(isValidAddress('0x')).toBe(false);
            expect(isValidAddress('123abc')).toBe(false); // Missing 0x
            expect(isValidAddress('0x' + 'a'.repeat(65))).toBe(false); // Too long
            expect(isValidAddress('0xGHIJKL')).toBe(false); // Invalid hex
            expect(isValidAddress('not an address')).toBe(false);
        });
    });

    describe('Contract Interface', () => {
        it('should create contract interface with correct options', () => {
            const movement = new Movement({ network: 'testnet' });
            const contract = movement.contract({
                address: '0x123',
                module: 'counter',
            });

            expect(contract.address).toBe('0x123');
            expect(contract.module).toBe('counter');
        });

        it('should generate correct full function name', () => {
            const movement = new Movement({ network: 'testnet' });
            const contract = movement.contract({
                address: '0x123',
                module: 'counter',
            });

            expect(contract.getFullFunctionName('increment')).toBe('0x123::counter::increment');
            expect(contract.getFullFunctionName('get_count')).toBe('0x123::counter::get_count');
        });
    });

    describe('Error Handling', () => {
        it('should throw MovementError for invalid address in getAccountBalance', async () => {
            const movement = new Movement({ network: 'testnet' });

            await expect(movement.getAccountBalance('invalid')).rejects.toThrow(MovementError);
            await expect(movement.getAccountBalance('invalid')).rejects.toMatchObject({
                code: 'INVALID_ADDRESS',
            });
        });

        it('should throw MovementError for invalid address in getAccountResources', async () => {
            const movement = new Movement({ network: 'testnet' });

            await expect(movement.getAccountResources('invalid')).rejects.toThrow(MovementError);
            await expect(movement.getAccountResources('invalid')).rejects.toMatchObject({
                code: 'INVALID_ADDRESS',
            });
        });
    });
});
