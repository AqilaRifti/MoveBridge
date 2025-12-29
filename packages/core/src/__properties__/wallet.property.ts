/**
 * Property-based tests for Wallet Manager
 * @module @movebridge/core
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';
import type { WalletType } from '../types';

describe('Wallet Manager Properties', () => {
    /**
     * Feature: movebridge-sdk, Property 6: Wallet state structure
     * For any WalletManager instance, calling getState SHALL return an object
     * with exactly three properties: connected (boolean), address (string | null),
     * and publicKey (string | null).
     * Validates: Requirements 3.5
     */
    it('Property 6: Wallet state structure', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                const state = walletManager.getState();

                // Check structure
                expect(typeof state.connected).toBe('boolean');
                expect(state.address === null || typeof state.address === 'string').toBe(true);
                expect(state.publicKey === null || typeof state.publicKey === 'string').toBe(true);

                // Check that only these three properties exist
                const keys = Object.keys(state);
                expect(keys).toHaveLength(3);
                expect(keys).toContain('connected');
                expect(keys).toContain('address');
                expect(keys).toContain('publicKey');

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 7: Connect/disconnect event emission
     * For any successful wallet connection, the WalletManager SHALL emit a 'connect' event;
     * for any disconnection, it SHALL emit a 'disconnect' event.
     * Validates: Requirements 3.2, 3.4, 4.1, 4.2
     *
     * Note: This tests the event emission mechanism without actual wallet connection.
     */
    it('Property 7: Event emission mechanism works correctly', () => {
        fc.assert(
            fc.property(
                fc.hexaString({ minLength: 64, maxLength: 64 }).map((h) => `0x${h}`),
                (address) => {
                    const walletManager = new WalletManager();
                    let connectEmitted = false;
                    let disconnectEmitted = false;
                    let emittedAddress: string | null = null;

                    walletManager.on('connect', (addr) => {
                        connectEmitted = true;
                        emittedAddress = addr;
                    });

                    walletManager.on('disconnect', () => {
                        disconnectEmitted = true;
                    });

                    // Manually emit events to test the mechanism
                    walletManager.emit('connect', address);
                    expect(connectEmitted).toBe(true);
                    expect(emittedAddress).toBe(address);

                    walletManager.emit('disconnect');
                    expect(disconnectEmitted).toBe(true);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: movebridge-sdk, Property 8: Invalid wallet error handling
     * For any wallet identifier not in the set of installed wallets, calling connect
     * SHALL throw a MovementError with code 'WALLET_NOT_FOUND'.
     * Validates: Requirements 3.3
     */
    it('Property 8: Invalid wallet error handling', async () => {
        // Test with known valid wallet types that aren't installed in test environment
        const walletTypes: WalletType[] = ['petra', 'pontem', 'nightly'];

        for (const wallet of walletTypes) {
            const walletManager = new WalletManager();

            // In a browser-less environment, no wallets are detected
            const available = walletManager.detectWallets();
            expect(available).toEqual([]);

            // Attempting to connect to any wallet should fail with WALLET_NOT_FOUND
            try {
                await walletManager.connect(wallet);
                // Should not reach here
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeInstanceOf(MovementError);
                expect((error as MovementError).code).toBe('WALLET_NOT_FOUND');
                expect((error as MovementError).details?.wallet).toBe(wallet);
            }
        }
    });

    /**
     * Additional property: Initial state is disconnected
     */
    it('Property: Initial state is disconnected', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                const state = walletManager.getState();

                expect(state.connected).toBe(false);
                expect(state.address).toBeNull();
                expect(state.publicKey).toBeNull();

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: getState returns a copy, not the internal state
     */
    it('Property: getState returns a copy', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                const state1 = walletManager.getState();
                const state2 = walletManager.getState();

                // Should be equal but not the same object
                expect(state1).toEqual(state2);
                expect(state1).not.toBe(state2);

                // Modifying the returned state should not affect internal state
                state1.connected = true;
                const state3 = walletManager.getState();
                expect(state3.connected).toBe(false);

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Additional property: detectWallets returns empty array in non-browser environment
     */
    it('Property: detectWallets returns empty array in non-browser environment', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                const wallets = walletManager.detectWallets();

                expect(Array.isArray(wallets)).toBe(true);
                // In Node.js test environment, no wallets should be detected
                expect(wallets).toEqual([]);

                return true;
            }),
            { numRuns: 100 }
        );
    });
});
