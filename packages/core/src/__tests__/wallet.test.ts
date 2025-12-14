/**
 * Unit tests for Wallet Manager
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';

describe('WalletManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear any global window mocks
        if (typeof globalThis.window !== 'undefined') {
            delete (globalThis.window as Record<string, unknown>).petra;
            delete (globalThis.window as Record<string, unknown>).martian;
            delete (globalThis.window as Record<string, unknown>).pontem;
        }
    });

    describe('detectWallets', () => {
        it('should return empty array when no wallets are installed', () => {
            const walletManager = new WalletManager();
            const wallets = walletManager.detectWallets();
            expect(wallets).toEqual([]);
        });

        it('should detect petra wallet when installed', () => {
            // Mock window.petra
            (globalThis as Record<string, unknown>).window = {
                petra: { connect: vi.fn() },
            };

            const walletManager = new WalletManager();
            const wallets = walletManager.detectWallets();
            expect(wallets).toContain('petra');
        });

        it('should detect multiple wallets when installed', () => {
            // Mock multiple wallets
            (globalThis as Record<string, unknown>).window = {
                petra: { connect: vi.fn() },
                martian: { connect: vi.fn() },
                pontem: { connect: vi.fn() },
            };

            const walletManager = new WalletManager();
            const wallets = walletManager.detectWallets();
            expect(wallets).toContain('petra');
            expect(wallets).toContain('martian');
            expect(wallets).toContain('pontem');
            expect(wallets).toHaveLength(3);
        });
    });

    describe('getState', () => {
        it('should return initial disconnected state', () => {
            const walletManager = new WalletManager();
            const state = walletManager.getState();

            expect(state.connected).toBe(false);
            expect(state.address).toBeNull();
            expect(state.publicKey).toBeNull();
        });

        it('should return a copy of the state', () => {
            const walletManager = new WalletManager();
            const state1 = walletManager.getState();
            const state2 = walletManager.getState();

            expect(state1).not.toBe(state2);
            expect(state1).toEqual(state2);
        });
    });

    describe('connect', () => {
        it('should throw WALLET_NOT_FOUND when wallet is not installed', async () => {
            const walletManager = new WalletManager();

            await expect(walletManager.connect('petra')).rejects.toThrow(MovementError);
            await expect(walletManager.connect('petra')).rejects.toMatchObject({
                code: 'WALLET_NOT_FOUND',
            });
        });

        it('should include available wallets in error details', async () => {
            const walletManager = new WalletManager();

            try {
                await walletManager.connect('petra');
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).details?.available).toEqual([]);
            }
        });

        it('should connect successfully when wallet is available', async () => {
            const mockAddress = '0x' + 'a'.repeat(64);
            const mockPublicKey = '0x' + 'b'.repeat(64);

            // Mock window.petra
            (globalThis as Record<string, unknown>).window = {
                petra: {
                    connect: vi.fn().mockResolvedValue({
                        address: mockAddress,
                        publicKey: mockPublicKey,
                    }),
                    onAccountChange: vi.fn(),
                    onNetworkChange: vi.fn(),
                },
            };

            const walletManager = new WalletManager();
            await walletManager.connect('petra');

            const state = walletManager.getState();
            expect(state.connected).toBe(true);
            expect(state.address).toBe(mockAddress);
            expect(state.publicKey).toBe(mockPublicKey);
        });

        it('should emit connect event on successful connection', async () => {
            const mockAddress = '0x' + 'a'.repeat(64);

            // Mock window.petra
            (globalThis as Record<string, unknown>).window = {
                petra: {
                    connect: vi.fn().mockResolvedValue({
                        address: mockAddress,
                        publicKey: '0x' + 'b'.repeat(64),
                    }),
                    onAccountChange: vi.fn(),
                    onNetworkChange: vi.fn(),
                },
            };

            const walletManager = new WalletManager();
            const connectHandler = vi.fn();
            walletManager.on('connect', connectHandler);

            await walletManager.connect('petra');

            expect(connectHandler).toHaveBeenCalledWith(mockAddress);
        });

        it('should throw WALLET_CONNECTION_FAILED when connection fails', async () => {
            // Mock window.petra with failing connect
            (globalThis as Record<string, unknown>).window = {
                petra: {
                    connect: vi.fn().mockRejectedValue(new Error('User rejected')),
                },
            };

            const walletManager = new WalletManager();

            await expect(walletManager.connect('petra')).rejects.toThrow(MovementError);
            await expect(walletManager.connect('petra')).rejects.toMatchObject({
                code: 'WALLET_CONNECTION_FAILED',
            });
        });
    });

    describe('disconnect', () => {
        it('should reset state on disconnect', async () => {
            const mockAddress = '0x' + 'a'.repeat(64);

            // Mock window.petra
            (globalThis as Record<string, unknown>).window = {
                petra: {
                    connect: vi.fn().mockResolvedValue({
                        address: mockAddress,
                        publicKey: '0x' + 'b'.repeat(64),
                    }),
                    disconnect: vi.fn().mockResolvedValue(undefined),
                    onAccountChange: vi.fn(),
                    onNetworkChange: vi.fn(),
                },
            };

            const walletManager = new WalletManager();
            await walletManager.connect('petra');

            expect(walletManager.getState().connected).toBe(true);

            await walletManager.disconnect();

            const state = walletManager.getState();
            expect(state.connected).toBe(false);
            expect(state.address).toBeNull();
            expect(state.publicKey).toBeNull();
        });

        it('should emit disconnect event', async () => {
            const walletManager = new WalletManager();
            const disconnectHandler = vi.fn();
            walletManager.on('disconnect', disconnectHandler);

            await walletManager.disconnect();

            expect(disconnectHandler).toHaveBeenCalled();
        });
    });

    describe('getWallet', () => {
        it('should return null when not connected', () => {
            const walletManager = new WalletManager();
            expect(walletManager.getWallet()).toBeNull();
        });

        it('should return wallet type when connected', async () => {
            // Mock window.petra
            (globalThis as Record<string, unknown>).window = {
                petra: {
                    connect: vi.fn().mockResolvedValue({
                        address: '0x' + 'a'.repeat(64),
                        publicKey: '0x' + 'b'.repeat(64),
                    }),
                    onAccountChange: vi.fn(),
                    onNetworkChange: vi.fn(),
                },
            };

            const walletManager = new WalletManager();
            await walletManager.connect('petra');

            expect(walletManager.getWallet()).toBe('petra');
        });
    });

    describe('Event handling', () => {
        it('should support on/off for events', () => {
            const walletManager = new WalletManager();
            const handler = vi.fn();

            walletManager.on('connect', handler);
            walletManager.emit('connect', '0x123');
            expect(handler).toHaveBeenCalledWith('0x123');

            walletManager.off('connect', handler);
            walletManager.emit('connect', '0x456');
            expect(handler).toHaveBeenCalledTimes(1);
        });

        it('should support multiple event listeners', () => {
            const walletManager = new WalletManager();
            const handler1 = vi.fn();
            const handler2 = vi.fn();

            walletManager.on('connect', handler1);
            walletManager.on('connect', handler2);
            walletManager.emit('connect', '0x123');

            expect(handler1).toHaveBeenCalledWith('0x123');
            expect(handler2).toHaveBeenCalledWith('0x123');
        });
    });
});
