/**
 * @movebridge/testing - Property tests for Mock Client
 *
 * Properties tested:
 * - Property 4: Mock response configuration
 * - Property 5: Mock error configuration
 * - Property 6: Mock once behavior
 * - Property 7: Mock clearing
 * - Property 8: Default response validity
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createMockClient } from '../mock-client';
import { createCallTracker } from '../tracker';
import { createNetworkSimulator } from '../simulator';
import { createFaker } from '../faker';
import type { MockMovementClient } from '../types';

describe('Mock Client Properties', () => {
    let client: MockMovementClient;

    beforeEach(() => {
        const tracker = createCallTracker();
        const simulator = createNetworkSimulator();
        const faker = createFaker({ seed: 12345 });
        client = createMockClient({ tracker, simulator, faker });
    });

    /**
     * Property 4: Mock response configuration
     * When a mock response is configured, the method should return that response
     */
    describe('Property 4: Mock response configuration', () => {
        it('should return configured mock response for getAccountBalance', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    async (mockBalance) => {
                        client.clearMocks();
                        client.mockResponse('getAccountBalance', mockBalance);

                        const result = await client.getAccountBalance('0x1');
                        expect(result).toBe(mockBalance);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should return configured mock response for getTransaction', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        hash: fc.hexaString({ minLength: 64, maxLength: 64 }),
                        sender: fc.hexaString({ minLength: 64, maxLength: 64 }),
                        sequenceNumber: fc.nat().map(String),
                        payload: fc.constant({ type: 'entry_function_payload' }),
                        timestamp: fc.nat().map(String),
                    }),
                    async (mockTx) => {
                        client.clearMocks();
                        client.mockResponse('getTransaction', mockTx);

                        const result = await client.getTransaction('0xabc');
                        expect(result).toEqual(mockTx);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 5: Mock error configuration
     * When a mock error is configured, the method should throw that error
     */
    describe('Property 5: Mock error configuration', () => {
        it('should throw configured error', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        code: fc.constantFrom(
                            'NETWORK_ERROR',
                            'VALIDATION_ERROR',
                            'TIMEOUT'
                        ),
                        message: fc.string({ minLength: 1, maxLength: 100 }),
                    }),
                    async (errorConfig) => {
                        client.clearMocks();
                        const error = {
                            code: errorConfig.code,
                            message: errorConfig.message,
                            name: 'MovementError',
                        };
                        client.mockError('getAccountBalance', error as any);

                        await expect(
                            client.getAccountBalance('0x1')
                        ).rejects.toMatchObject({
                            code: errorConfig.code,
                            message: errorConfig.message,
                        });
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 6: Mock once behavior
     * mockResponseOnce should only return the mock for the first call
     */
    describe('Property 6: Mock once behavior', () => {
        it('should return mock only on first call', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    async (mockBalance) => {
                        client.clearMocks();
                        client.mockResponseOnce('getAccountBalance', mockBalance);

                        // First call returns mock
                        const first = await client.getAccountBalance('0x1');
                        expect(first).toBe(mockBalance);

                        // Second call returns default (faker-generated)
                        const second = await client.getAccountBalance('0x1');
                        expect(second).not.toBe(mockBalance);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 7: Mock clearing
     * clearMocks should remove all configured mocks
     */
    describe('Property 7: Mock clearing', () => {
        it('should clear all mocks', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    async (mockBalance) => {
                        client.mockResponse('getAccountBalance', mockBalance);

                        // Verify mock is active
                        const before = await client.getAccountBalance('0x1');
                        expect(before).toBe(mockBalance);

                        // Clear mocks
                        client.clearMocks();

                        // Verify mock is cleared (returns faker default)
                        const after = await client.getAccountBalance('0x1');
                        expect(after).not.toBe(mockBalance);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 8: Default response validity
     * Default responses should be valid data structures
     */
    describe('Property 8: Default response validity', () => {
        it('should return valid balance format by default', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.hexaString({ minLength: 64, maxLength: 64 }).map(
                        (s) => '0x' + s
                    ),
                    async (address) => {
                        client.clearMocks();
                        const balance = await client.getAccountBalance(address);

                        // Balance should be a numeric string
                        expect(typeof balance).toBe('string');
                        expect(BigInt(balance)).toBeGreaterThanOrEqual(0n);
                    }
                ),
                { numRuns: 30 }
            );
        });

        it('should return valid resources array by default', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.hexaString({ minLength: 64, maxLength: 64 }).map(
                        (s) => '0x' + s
                    ),
                    async (address) => {
                        client.clearMocks();
                        const resources = await client.getAccountResources(address);

                        expect(Array.isArray(resources)).toBe(true);
                        for (const resource of resources) {
                            expect(resource).toHaveProperty('type');
                            expect(resource).toHaveProperty('data');
                        }
                    }
                ),
                { numRuns: 30 }
            );
        });

        it('should return valid transaction by default', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.hexaString({ minLength: 64, maxLength: 64 }).map(
                        (s) => '0x' + s
                    ),
                    async (hash) => {
                        client.clearMocks();
                        const tx = await client.getTransaction(hash);

                        expect(tx).toHaveProperty('hash');
                        expect(tx).toHaveProperty('sender');
                        expect(tx).toHaveProperty('sequenceNumber');
                        expect(tx).toHaveProperty('payload');
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
