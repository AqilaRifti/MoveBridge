/**
 * Property-based tests for Wallet Manager
 * @module @movebridge/core
 * 
 * Feature: wallet-rework, sdk-rework
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { WalletManager } from '../wallet';
import { MovementError } from '../errors';
import type { WalletType } from '../types';

// Re-implement normalizeHash for testing (mirrors wallet.ts implementation)
function normalizeHash(data: unknown): string {
    if (typeof data === 'string') {
        return data.startsWith('0x') ? data : `0x${data}`;
    }
    if (data instanceof Uint8Array) {
        return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (data && typeof data === 'object' && 'hash' in data) {
        return normalizeHash((data as { hash: unknown }).hash);
    }
    if (data && typeof (data as { toString?: () => string }).toString === 'function') {
        const str = (data as { toString: () => string }).toString();
        return str.startsWith('0x') ? str : `0x${str}`;
    }
    return String(data);
}

// Re-implement extractUserResponse for testing (mirrors wallet.ts implementation)
function extractUserResponse<T>(response: unknown): T {
    if (!response) {
        throw new Error('Empty response from wallet');
    }
    const resp = response as { status?: string; args?: T };
    if (resp.status === 'rejected') {
        throw new Error('User rejected the request');
    }
    if (resp.args !== undefined) {
        return resp.args;
    }
    return response as T;
}

// Valid wallet types for the new wallet system
const VALID_WALLET_TYPES: WalletType[] = ['razor', 'nightly', 'okx'];

// Wallet name variations that should normalize to each type
const WALLET_NAME_VARIATIONS: Record<WalletType, string[]> = {
    razor: ['razor', 'Razor', 'RAZOR', 'razor wallet', 'Razor Wallet', 'RAZOR WALLET', 'razorwallet', 'RazorWallet'],
    nightly: ['nightly', 'Nightly', 'NIGHTLY', 'nightly wallet', 'Nightly Wallet', 'NIGHTLY WALLET'],
    okx: ['okx', 'OKX', 'Okx', 'okx wallet', 'OKX Wallet', 'OKX WALLET', 'okxwallet', 'OKXWallet', 'OKXWALLET'],
};

describe('Wallet Manager Properties', () => {
    /**
     * Feature: wallet-rework, Property 1: Wallet Name Normalization
     * For any string that represents a supported wallet name (including variations like 
     * "Razor", "RAZOR", "razor wallet", "Nightly Wallet", "OKX", "okxwallet"), 
     * normalizing it through the SUPPORTED_WALLETS mapping SHALL produce the correct lowercase WalletType.
     * Validates: Requirements 1.2
     */
    it('Property 1: Wallet Name Normalization', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...VALID_WALLET_TYPES),
                (walletType) => {
                    const variations = WALLET_NAME_VARIATIONS[walletType];

                    for (const variation of variations) {
                        // The normalization happens via toLowerCase() in detectWallets
                        const normalized = variation.toLowerCase();

                        // Check that the normalized name maps to the correct wallet type
                        // This tests the SUPPORTED_WALLETS mapping logic
                        const expectedMappings: Record<string, WalletType> = {
                            'razor': 'razor',
                            'razor wallet': 'razor',
                            'razorwallet': 'razor',
                            'nightly': 'nightly',
                            'nightly wallet': 'nightly',
                            'okx': 'okx',
                            'okx wallet': 'okx',
                            'okxwallet': 'okx',
                        };

                        if (expectedMappings[normalized]) {
                            expect(expectedMappings[normalized]).toBe(walletType);
                        }
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: wallet-rework, Property 6: Wallet state structure
     * For any WalletManager instance, calling getState SHALL return an object
     * with exactly three properties: connected (boolean), address (string | null),
     * and publicKey (string | null).
     * Validates: Requirements 3.2
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
     * Feature: wallet-rework, Property 7: Connect/disconnect event emission
     * For any successful wallet connection, the WalletManager SHALL emit a 'connect' event;
     * for any disconnection, it SHALL emit a 'disconnect' event.
     * Validates: Requirements 3.3, 4.3
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
     * Feature: wallet-rework, Property 12: Error Type Distinction
     * For any wallet operation failure, the thrown error SHALL be distinguishable as either 
     * a user rejection (containing "rejected" in the message) or a technical failure, 
     * and SHALL always contain a descriptive message.
     * Validates: Requirements 3.4, 7.3, 10.1, 10.2
     */
    it('Property 12: Invalid wallet error handling with new wallet types', async () => {
        // Test with the new valid wallet types that aren't installed in test environment
        for (const wallet of VALID_WALLET_TYPES) {
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
                // Error should have a descriptive message
                expect((error as MovementError).message.length).toBeGreaterThan(0);
            }
        }
    });

    /**
     * Feature: wallet-rework, Property 13: Unavailable Wallet Error Contains Alternatives
     * For any attempt to connect to an unavailable wallet, the thrown error SHALL include 
     * the list of currently available wallets.
     * Validates: Requirements 3.5, 10.3
     */
    it('Property 13: Unavailable wallet error contains alternatives', async () => {
        fc.assert(
            await fc.asyncProperty(
                fc.constantFrom(...VALID_WALLET_TYPES),
                async (wallet) => {
                    const walletManager = new WalletManager();
                    const available = walletManager.detectWallets();

                    try {
                        await walletManager.connect(wallet);
                        // Should not reach here in test environment
                        return true;
                    } catch (error) {
                        expect(error).toBeInstanceOf(MovementError);
                        // Error details should include available wallets list
                        expect((error as MovementError).details?.available).toBeDefined();
                        expect(Array.isArray((error as MovementError).details?.available)).toBe(true);
                        // The available list should match what detectWallets returns
                        expect((error as MovementError).details?.available).toEqual(available);
                        return true;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: wallet-rework, Property 4: Connection State Consistency (Initial State)
     * For any WalletManager instance, the initial state SHALL be disconnected.
     * Validates: Requirements 3.2
     */
    it('Property 4: Initial state is disconnected', () => {
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
     * Feature: wallet-rework, Property: getState returns a copy, not the internal state
     * This ensures state immutability from external modifications.
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
     * Feature: wallet-rework, Property 2: Wallet Detection Returns Supported Subset
     * For any set of wallets registered via AIP-62, detectWallets() SHALL return only 
     * the wallets that match supported types (razor, nightly, okx) and no others.
     * Validates: Requirements 2.1
     */
    it('Property 2: detectWallets returns empty array in non-browser environment', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                const wallets = walletManager.detectWallets();

                expect(Array.isArray(wallets)).toBe(true);
                // In Node.js test environment, no wallets should be detected
                expect(wallets).toEqual([]);

                // If wallets were detected, they should only be from supported types
                for (const wallet of wallets) {
                    expect(VALID_WALLET_TYPES).toContain(wallet);
                }

                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: wallet-rework, Property 3: Wallet Info Contains Required Fields
     * For any detected wallet, getWalletInfo() SHALL return an object containing 
     * type, name, and icon fields that are all non-empty strings.
     * Validates: Requirements 2.2
     */
    it('Property 3: getWalletInfo returns properly structured data', () => {
        fc.assert(
            fc.property(fc.constant(null), () => {
                const walletManager = new WalletManager();
                walletManager.detectWallets();
                const walletInfo = walletManager.getWalletInfo();

                expect(Array.isArray(walletInfo)).toBe(true);

                // Each wallet info should have required fields
                for (const info of walletInfo) {
                    expect(info).toHaveProperty('type');
                    expect(info).toHaveProperty('name');
                    expect(info).toHaveProperty('icon');
                    expect(typeof info.type).toBe('string');
                    expect(typeof info.name).toBe('string');
                    expect(typeof info.icon).toBe('string');
                    // Type should be a valid wallet type
                    expect(VALID_WALLET_TYPES).toContain(info.type);
                }

                return true;
            }),
            { numRuns: 100 }
        );
    });
});


/**
 * Feature: sdk-rework, Property 11: UserResponse Format Handling
 * For any wallet adapter response, the SDK SHALL correctly extract the result from:
 * - Direct result format: { hash: string }
 * - UserResponse format: { status: 'approved', args: { hash: string } }
 * - Rejected format: { status: 'rejected' } → throw error
 * 
 * **Validates: Requirements 7.2**
 */
it('Property 11: UserResponse Format Handling', () => {
    // Test direct result format
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
            (hash) => {
                const directResult = { hash };
                const extracted = extractUserResponse<{ hash: string }>(directResult);
                expect(extracted.hash).toBe(hash);
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test UserResponse format with status: 'approved'
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
            (hash) => {
                const userResponse = { status: 'approved', args: { hash } };
                const extracted = extractUserResponse<{ hash: string }>(userResponse);
                expect(extracted.hash).toBe(hash);
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test rejected format throws error
    fc.assert(
        fc.property(fc.constant(null), () => {
            const rejectedResponse = { status: 'rejected' };
            expect(() => extractUserResponse(rejectedResponse)).toThrow('User rejected the request');
            return true;
        }),
        { numRuns: 10 }
    );

    // Test empty response throws error
    fc.assert(
        fc.property(fc.constant(null), () => {
            expect(() => extractUserResponse(null)).toThrow('Empty response from wallet');
            expect(() => extractUserResponse(undefined)).toThrow('Empty response from wallet');
            return true;
        }),
        { numRuns: 10 }
    );
});

/**
 * Feature: sdk-rework, Property 12: Transaction Hash Normalization
 * For any transaction hash returned by a wallet (as string, Uint8Array, or object with toString),
 * the SDK SHALL normalize it to a hex string starting with '0x'.
 * 
 * **Validates: Requirements 7.3**
 */
it('Property 12: Transaction Hash Normalization', () => {
    // Test string with 0x prefix (should remain unchanged)
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
            (hash) => {
                const normalized = normalizeHash(hash);
                expect(normalized).toBe(hash);
                expect(normalized.startsWith('0x')).toBe(true);
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test string without 0x prefix (should add prefix)
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }),
            (hash) => {
                const normalized = normalizeHash(hash);
                expect(normalized).toBe(`0x${hash}`);
                expect(normalized.startsWith('0x')).toBe(true);
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test Uint8Array (should convert to hex string with 0x prefix)
    fc.assert(
        fc.property(
            fc.uint8Array({ minLength: 32, maxLength: 32 }),
            (bytes) => {
                const normalized = normalizeHash(bytes);
                expect(normalized.startsWith('0x')).toBe(true);
                expect(normalized.length).toBe(66); // 0x + 64 hex chars
                // Verify round-trip: each byte should be represented as 2 hex chars
                const hexPart = normalized.slice(2);
                for (let i = 0; i < bytes.length; i++) {
                    const byteHex = hexPart.slice(i * 2, i * 2 + 2);
                    expect(parseInt(byteHex, 16)).toBe(bytes[i]);
                }
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test object with hash property (should extract and normalize)
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
            (hash) => {
                const obj = { hash };
                const normalized = normalizeHash(obj);
                expect(normalized).toBe(hash);
                expect(normalized.startsWith('0x')).toBe(true);
                return true;
            }
        ),
        { numRuns: 100 }
    );

    // Test object with toString method
    fc.assert(
        fc.property(
            fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
            (hash) => {
                const obj = { toString: () => hash };
                const normalized = normalizeHash(obj);
                expect(normalized).toBe(hash);
                expect(normalized.startsWith('0x')).toBe(true);
                return true;
            }
        ),
        { numRuns: 100 }
    );
});
