/**
 * @movebridge/testing - Property tests for Test Harness
 *
 * Properties tested:
 * - Property 1: Test harness structure completeness
 * - Property 2: Test harness cleanup resets state
 * - Property 3: Deterministic seeding
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createTestHarness } from '../harness';

describe('Test Harness Properties', () => {
    /**
     * Property 1: Test harness structure completeness
     * The harness should contain all required components
     */
    describe('Property 1: Test harness structure completeness', () => {
        it('should contain all required components regardless of config', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        seed: fc.option(fc.nat(), { nil: undefined }),
                        defaultLatency: fc.option(fc.nat({ max: 1000 }), {
                            nil: undefined,
                        }),
                    }),
                    (config) => {
                        const harness = createTestHarness(config);

                        // Verify all components exist
                        expect(harness.client).toBeDefined();
                        expect(harness.tracker).toBeDefined();
                        expect(harness.simulator).toBeDefined();
                        expect(harness.faker).toBeDefined();
                        expect(harness.cleanup).toBeInstanceOf(Function);
                        expect(harness.reset).toBeInstanceOf(Function);

                        // Verify client has required methods
                        expect(harness.client.mockResponse).toBeInstanceOf(Function);
                        expect(harness.client.mockError).toBeInstanceOf(Function);
                        expect(harness.client.mockResponseOnce).toBeInstanceOf(Function);
                        expect(harness.client.clearMocks).toBeInstanceOf(Function);
                        expect(harness.client.getAccountBalance).toBeInstanceOf(Function);

                        // Verify tracker has required methods
                        expect(harness.tracker.recordCall).toBeInstanceOf(Function);
                        expect(harness.tracker.getCalls).toBeInstanceOf(Function);
                        expect(harness.tracker.assertCalled).toBeInstanceOf(Function);

                        // Verify simulator has required methods
                        expect(harness.simulator.simulateLatency).toBeInstanceOf(
                            Function
                        );
                        expect(harness.simulator.simulateNetworkError).toBeInstanceOf(
                            Function
                        );

                        // Verify faker has required methods
                        expect(harness.faker.fakeAddress).toBeInstanceOf(Function);
                        expect(harness.faker.fakeBalance).toBeInstanceOf(Function);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    /**
     * Property 2: Test harness cleanup resets state
     * Cleanup should reset all mutable state
     */
    describe('Property 2: Test harness cleanup resets state', () => {
        it('should reset all state after cleanup', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.nat({ max: 10 }), // Small latency to avoid timeout
                    async (mockValue, latency) => {
                        const harness = createTestHarness();

                        // Set up state
                        harness.client.mockResponse('getAccountBalance', mockValue);
                        harness.simulator.simulateLatency(latency);
                        await harness.client.getAccountBalance('0x1');

                        // Verify state is set
                        expect(harness.tracker.getCallCount('getAccountBalance')).toBe(1);
                        expect(harness.simulator.getLatency()).toBe(latency);

                        // Cleanup
                        harness.cleanup();

                        // Verify state is reset
                        expect(harness.tracker.getCallCount('getAccountBalance')).toBe(0);
                        expect(harness.simulator.getLatency()).toBe(0);

                        // Mock should be cleared (returns faker default)
                        const result = await harness.client.getAccountBalance('0x1');
                        expect(result).not.toBe(mockValue);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    /**
     * Property 3: Deterministic seeding
     * Same seed should produce same results
     */
    describe('Property 3: Deterministic seeding', () => {
        it('should produce deterministic results with same seed', async () => {
            await fc.assert(
                fc.asyncProperty(fc.nat(), async (seed) => {
                    const harness1 = createTestHarness({ seed });
                    const harness2 = createTestHarness({ seed });

                    // Generate data from both harnesses
                    const address1 = harness1.faker.fakeAddress();
                    const address2 = harness2.faker.fakeAddress();

                    const balance1 = harness1.faker.fakeBalance();
                    const balance2 = harness2.faker.fakeBalance();

                    const tx1 = harness1.faker.fakeTransaction();
                    const tx2 = harness2.faker.fakeTransaction();

                    // Results should be identical
                    expect(address1).toBe(address2);
                    expect(balance1).toBe(balance2);
                    expect(tx1.hash).toBe(tx2.hash);
                    expect(tx1.sender).toBe(tx2.sender);
                }),
                { numRuns: 30 }
            );
        });

        it('should produce different results with different seeds', () => {
            fc.assert(
                fc.property(
                    fc.nat(),
                    fc.nat().filter((n) => n !== 0),
                    (seed1, offset) => {
                        const seed2 = seed1 + offset;
                        const harness1 = createTestHarness({ seed: seed1 });
                        const harness2 = createTestHarness({ seed: seed2 });

                        const address1 = harness1.faker.fakeAddress();
                        const address2 = harness2.faker.fakeAddress();

                        // Different seeds should (almost always) produce different results
                        // Note: There's a tiny chance of collision, but it's negligible
                        expect(address1).not.toBe(address2);
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
