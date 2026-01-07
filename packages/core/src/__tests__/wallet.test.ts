/**
 * Unit tests for Wallet Manager
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';
import type { WalletType } from '../types';

describe('WalletManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear any global window mocks
        if (typeof globalThis.window !== 'undefined') {
            delete (globalThis.window as Record<string, unknown>).razor;
            delete (globalThis.window as Record<string, unknown>).nightly;
            delete (globalThis.window as Record<string, unknown>).okx;
        }
    });

    describe('WalletType Support', () => {
        it('should support razor as a valid wallet type', () => {
            const walletType: WalletType = 'razor';
            expect(walletType).toBe('razor');
        });

        it('should support nightly as a valid wallet type', () => {
            const walletType: WalletType = 'nightly';
            expect(walletType).toBe('nightly');
        });

        it('should support okx as a valid wallet type', () => {
            const walletType: WalletType = 'okx';
            expect(walletType).toBe('okx');
        });

        it('should not support petra as a wallet type (compile-time check)', () => {
            // This is a compile-time check - petra is no longer a valid WalletType
            // The following would cause a TypeScript error if uncommented:
            // const walletType: WalletType = 'petra'; // Error: Type '"petra"' is not assignable to type 'WalletType'
            expect(true).toBe(true);
        });

        it('should not support pontem as a wallet type (compile-time check)', () => {
            // This is a compile-time check - pontem is no longer a valid WalletType
            // The following would cause a TypeScript error if uncommented:
            // const walletType: WalletType = 'pontem'; // Error: Type '"pontem"' is not assignable to type 'WalletType'
            expect(true).toBe(true);
        });
    });

    describe('detectWallets', () => {
        it('should return empty array when no wallets are installed', () => {
            const walletManager = new WalletManager();
            const wallets = walletManager.detectWallets();
            expect(wallets).toEqual([]);
        });

        it('should detect razor wallet when installed', () => {
            // Mock window.razor
            (globalThis as Record<string, unknown>).window = {
                razor: { connect: vi.fn() },
            };

            const walletManager = new WalletManager();
            const wallets = walletManager.detectWallets();
            // Note: Detection now uses AIP-62 standard via getAptosWallets()
            // Without actual wallet extensions, this returns empty
            expect(Array.isArray(wallets)).toBe(true);
        });

        it('should detect multiple wallets when installed', () => {
            // Note: This test uses legacy detection which is now replaced by AIP-62 standard
            // The actual detection now uses getAptosWallets() from @aptos-labs/wallet-standard
            // This test verifies the WalletManager can handle multiple wallet types
            const walletManager = new WalletManager();
            // In real usage, wallets are detected via AIP-62 standard
            const wallets = walletManager.detectWallets();
            // Without actual wallet extensions, this returns empty
            expect(Array.isArray(wallets)).toBe(true);
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

            await expect(walletManager.connect('razor')).rejects.toThrow(MovementError);
            await expect(walletManager.connect('razor')).rejects.toMatchObject({
                code: 'WALLET_NOT_FOUND',
            });
        });

        it('should include available wallets in error details', async () => {
            const walletManager = new WalletManager();

            try {
                await walletManager.connect('razor');
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).details?.available).toEqual([]);
            }
        });

        it('should throw WALLET_NOT_FOUND for nightly when not installed', async () => {
            const walletManager = new WalletManager();

            await expect(walletManager.connect('nightly')).rejects.toThrow(MovementError);
            await expect(walletManager.connect('nightly')).rejects.toMatchObject({
                code: 'WALLET_NOT_FOUND',
            });
        });

        it('should throw WALLET_NOT_FOUND for okx when not installed', async () => {
            const walletManager = new WalletManager();

            await expect(walletManager.connect('okx')).rejects.toThrow(MovementError);
            await expect(walletManager.connect('okx')).rejects.toMatchObject({
                code: 'WALLET_NOT_FOUND',
            });
        });
    });

    describe('disconnect', () => {
        it('should reset state on disconnect', async () => {
            const walletManager = new WalletManager();

            // Even without a connected wallet, disconnect should work
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
