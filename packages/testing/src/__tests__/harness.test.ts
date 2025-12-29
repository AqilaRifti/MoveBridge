/**
 * @movebridge/testing - Unit tests for Test Harness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness } from '../harness';
import type { TestHarness } from '../types';

describe('Test Harness', () => {
    let harness: TestHarness;

    beforeEach(() => {
        harness = createTestHarness();
    });

    describe('createTestHarness', () => {
        it('should create harness with all components', () => {
            expect(harness.client).toBeDefined();
            expect(harness.tracker).toBeDefined();
            expect(harness.simulator).toBeDefined();
            expect(harness.faker).toBeDefined();
        });

        it('should create harness with cleanup method', () => {
            expect(harness.cleanup).toBeInstanceOf(Function);
        });

        it('should create harness with reset method', () => {
            expect(harness.reset).toBeInstanceOf(Function);
        });
    });

    describe('configuration', () => {
        it('should accept seed configuration', () => {
            const harness1 = createTestHarness({ seed: 12345 });
            const harness2 = createTestHarness({ seed: 12345 });

            const addr1 = harness1.faker.fakeAddress();
            const addr2 = harness2.faker.fakeAddress();

            expect(addr1).toBe(addr2);
        });

        it('should accept defaultLatency configuration', () => {
            const harnessWithLatency = createTestHarness({ defaultLatency: 100 });

            expect(harnessWithLatency.simulator.getLatency()).toBe(100);
        });

        it('should default to zero latency', () => {
            expect(harness.simulator.getLatency()).toBe(0);
        });
    });

    describe('client integration', () => {
        it('should allow mocking responses', async () => {
            harness.client.mockResponse('getAccountBalance', '1000');

            const result = await harness.client.getAccountBalance('0x1');
            expect(result).toBe('1000');
        });

        it('should track calls through client', async () => {
            await harness.client.getAccountBalance('0x123');

            expect(harness.tracker.getCallCount('getAccountBalance')).toBe(1);
            const calls = harness.tracker.getCalls('getAccountBalance');
            expect(calls[0].arguments).toEqual(['0x123']);
        });

        it('should apply network simulation to client', async () => {
            harness.simulator.simulateNetworkError();

            await expect(harness.client.getAccountBalance('0x1')).rejects.toThrow(
                'Network error'
            );
        });
    });

    describe('cleanup', () => {
        it('should clear mocks', async () => {
            harness.client.mockResponse('getAccountBalance', 'mocked');

            const before = await harness.client.getAccountBalance('0x1');
            expect(before).toBe('mocked');

            harness.cleanup();

            const after = await harness.client.getAccountBalance('0x1');
            expect(after).not.toBe('mocked');
        });

        it('should clear call history', async () => {
            await harness.client.getAccountBalance('0x1');
            expect(harness.tracker.getCallCount('getAccountBalance')).toBe(1);

            harness.cleanup();

            expect(harness.tracker.getCallCount('getAccountBalance')).toBe(0);
        });

        it('should reset simulation', () => {
            harness.simulator.simulateLatency(100);
            harness.simulator.simulateNetworkError();

            harness.cleanup();

            expect(harness.simulator.getLatency()).toBe(0);
            expect(harness.simulator.isNetworkErrorEnabled()).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear mocks', async () => {
            harness.client.mockResponse('getAccountBalance', 'mocked');

            harness.reset();

            const result = await harness.client.getAccountBalance('0x1');
            expect(result).not.toBe('mocked');
        });

        it('should clear call history', async () => {
            await harness.client.getAccountBalance('0x1');

            harness.reset();

            expect(harness.tracker.getCallCount('getAccountBalance')).toBe(0);
        });

        it('should NOT reset simulation settings', () => {
            harness.simulator.simulateLatency(100);

            harness.reset();

            // Latency should be preserved
            expect(harness.simulator.getLatency()).toBe(100);
        });
    });

    describe('deterministic behavior', () => {
        it('should produce same faker results with same seed', () => {
            const h1 = createTestHarness({ seed: 42 });
            const h2 = createTestHarness({ seed: 42 });

            expect(h1.faker.fakeAddress()).toBe(h2.faker.fakeAddress());
            expect(h1.faker.fakeBalance()).toBe(h2.faker.fakeBalance());
        });

        it('should produce different faker results with different seeds', () => {
            const h1 = createTestHarness({ seed: 1 });
            const h2 = createTestHarness({ seed: 2 });

            expect(h1.faker.fakeAddress()).not.toBe(h2.faker.fakeAddress());
        });

        it('should produce same client defaults with same seed', async () => {
            const h1 = createTestHarness({ seed: 42 });
            const h2 = createTestHarness({ seed: 42 });

            const balance1 = await h1.client.getAccountBalance('0x1');
            const balance2 = await h2.client.getAccountBalance('0x1');

            expect(balance1).toBe(balance2);
        });
    });

    describe('component interaction', () => {
        it('should allow assertions on tracked calls', async () => {
            await harness.client.getAccountBalance('0x1');
            await harness.client.getAccountBalance('0x2');

            harness.tracker.assertCalled('getAccountBalance');
            harness.tracker.assertCalledTimes('getAccountBalance', 2);
        });

        it('should allow simulating errors and tracking them', async () => {
            harness.simulator.simulateNetworkError();

            try {
                await harness.client.getAccountBalance('0x1');
            } catch {
                // Expected
            }

            const calls = harness.tracker.getCalls('getAccountBalance');
            expect(calls).toHaveLength(1);
            expect(calls[0].error).toBeDefined();
        });

        it('should allow combining mocks with simulation', async () => {
            harness.client.mockResponse('getAccountBalance', '1000');
            harness.simulator.simulateLatency(10);

            const start = Date.now();
            const result = await harness.client.getAccountBalance('0x1');
            const elapsed = Date.now() - start;

            expect(result).toBe('1000');
            expect(elapsed).toBeGreaterThanOrEqual(8);
        });
    });

    describe('typical test workflow', () => {
        it('should support arrange-act-assert pattern', async () => {
            // Arrange
            harness.client.mockResponse('getAccountBalance', '5000000000');

            // Act
            const balance = await harness.client.getAccountBalance('0x1');

            // Assert
            expect(balance).toBe('5000000000');
            harness.tracker.assertCalled('getAccountBalance');
            harness.tracker.assertCalledWith('getAccountBalance', '0x1');
        });

        it('should support testing error scenarios', async () => {
            // Arrange
            harness.client.mockError('getAccountBalance', {
                code: 'NOT_FOUND',
                message: 'Account not found',
                name: 'MovementError',
            } as any);

            // Act & Assert
            await expect(harness.client.getAccountBalance('0x1')).rejects.toMatchObject(
                {
                    code: 'NOT_FOUND',
                    message: 'Account not found',
                }
            );
        });

        it('should support testing network conditions', async () => {
            // Arrange
            harness.simulator.simulateRateLimit(1);

            // Act
            await harness.client.getAccountBalance('0x1'); // First call succeeds

            // Assert
            await expect(harness.client.getAccountBalance('0x2')).rejects.toThrow(
                'Rate limited'
            );
        });
    });
});
