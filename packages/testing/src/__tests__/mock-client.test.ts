/**
 * @movebridge/testing - Unit tests for Mock Client
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockClient } from '../mock-client';
import { createCallTracker } from '../tracker';
import { createNetworkSimulator } from '../simulator';
import { createFaker } from '../faker';
import type { MockMovementClient, CallTracker, NetworkSimulator } from '../types';

describe('Mock Client', () => {
    let client: MockMovementClient;
    let tracker: CallTracker;
    let simulator: NetworkSimulator;

    beforeEach(() => {
        tracker = createCallTracker();
        simulator = createNetworkSimulator();
        const faker = createFaker({ seed: 12345 });
        client = createMockClient({ tracker, simulator, faker });
    });

    describe('mockResponse', () => {
        it('should return configured response for getAccountBalance', async () => {
            client.mockResponse('getAccountBalance', '1000000000');

            const result = await client.getAccountBalance('0x1');
            expect(result).toBe('1000000000');
        });

        it('should return configured response for getAccountResources', async () => {
            const mockResources = [
                { type: '0x1::coin::CoinStore', data: { coin: { value: '100' } } },
            ];
            client.mockResponse('getAccountResources', mockResources);

            const result = await client.getAccountResources('0x1');
            expect(result).toEqual(mockResources);
        });

        it('should return configured response for getTransaction', async () => {
            const mockTx = {
                hash: '0xabc123',
                sender: '0x1',
                sequenceNumber: '1',
                payload: {
                    function: '0x1::test::func',
                    typeArguments: [],
                    functionArguments: [],
                },
                timestamp: '1234567890',
            };
            client.mockResponse('getTransaction', mockTx);

            const result = await client.getTransaction('0xabc123');
            expect(result).toEqual(mockTx);
        });

        it('should return configured response for waitForTransaction', async () => {
            const mockResponse = {
                hash: '0xabc123',
                success: true,
                vmStatus: 'Executed successfully',
                gasUsed: '100',
                version: '12345',
            };
            client.mockResponse('waitForTransaction', mockResponse);

            const result = await client.waitForTransaction('0xabc123');
            expect(result).toEqual(mockResponse);
        });

        it('should persist mock across multiple calls', async () => {
            client.mockResponse('getAccountBalance', '500');

            const result1 = await client.getAccountBalance('0x1');
            const result2 = await client.getAccountBalance('0x2');
            const result3 = await client.getAccountBalance('0x3');

            expect(result1).toBe('500');
            expect(result2).toBe('500');
            expect(result3).toBe('500');
        });
    });

    describe('mockError', () => {
        it('should throw configured error', async () => {
            const error = {
                code: 'NETWORK_ERROR',
                message: 'Connection failed',
                name: 'MovementError',
            };
            client.mockError('getAccountBalance', error as any);

            await expect(client.getAccountBalance('0x1')).rejects.toMatchObject({
                code: 'NETWORK_ERROR',
                message: 'Connection failed',
            });
        });

        it('should persist error across multiple calls', async () => {
            const error = {
                code: 'VALIDATION_ERROR',
                message: 'Invalid address',
                name: 'MovementError',
            };
            client.mockError('getAccountBalance', error as any);

            await expect(client.getAccountBalance('0x1')).rejects.toMatchObject({
                code: 'VALIDATION_ERROR',
            });
            await expect(client.getAccountBalance('0x2')).rejects.toMatchObject({
                code: 'VALIDATION_ERROR',
            });
        });

        it('should record error in tracker', async () => {
            const error = {
                code: 'NETWORK_ERROR',
                message: 'Failed',
                name: 'MovementError',
            };
            client.mockError('getAccountBalance', error as any);

            try {
                await client.getAccountBalance('0x1');
            } catch {
                // Expected
            }

            const calls = tracker.getCalls('getAccountBalance');
            expect(calls).toHaveLength(1);
            expect(calls[0].error).toBeDefined();
        });
    });

    describe('mockResponseOnce', () => {
        it('should return mock only on first call', async () => {
            client.mockResponseOnce('getAccountBalance', 'once-value');

            const first = await client.getAccountBalance('0x1');
            expect(first).toBe('once-value');

            // Second call should return faker default
            const second = await client.getAccountBalance('0x1');
            expect(second).not.toBe('once-value');
        });

        it('should work with persistent mock as fallback', async () => {
            client.mockResponse('getAccountBalance', 'persistent');
            client.mockResponseOnce('getAccountBalance', 'once');

            const first = await client.getAccountBalance('0x1');
            expect(first).toBe('once');

            const second = await client.getAccountBalance('0x1');
            expect(second).toBe('persistent');
        });

        it('should allow multiple once mocks in sequence', async () => {
            client.mockResponseOnce('getAccountBalance', 'first');

            const result1 = await client.getAccountBalance('0x1');
            expect(result1).toBe('first');

            client.mockResponseOnce('getAccountBalance', 'second');

            const result2 = await client.getAccountBalance('0x1');
            expect(result2).toBe('second');
        });
    });

    describe('clearMocks', () => {
        it('should clear persistent mocks', async () => {
            client.mockResponse('getAccountBalance', 'mocked');

            const before = await client.getAccountBalance('0x1');
            expect(before).toBe('mocked');

            client.clearMocks();

            const after = await client.getAccountBalance('0x1');
            expect(after).not.toBe('mocked');
        });

        it('should clear once mocks', async () => {
            client.mockResponseOnce('getAccountBalance', 'once');
            client.clearMocks();

            const result = await client.getAccountBalance('0x1');
            expect(result).not.toBe('once');
        });

        it('should clear error mocks', async () => {
            client.mockError('getAccountBalance', {
                code: 'ERROR',
                message: 'Test',
                name: 'MovementError',
            } as any);

            client.clearMocks();

            // Should not throw after clearing
            await expect(client.getAccountBalance('0x1')).resolves.toBeDefined();
        });
    });

    describe('default responses', () => {
        it('should return valid balance by default', async () => {
            const balance = await client.getAccountBalance('0x1');

            expect(typeof balance).toBe('string');
            expect(() => BigInt(balance)).not.toThrow();
        });

        it('should return valid resources array by default', async () => {
            const resources = await client.getAccountResources('0x1');

            expect(Array.isArray(resources)).toBe(true);
            expect(resources.length).toBeGreaterThan(0);
            expect(resources[0]).toHaveProperty('type');
            expect(resources[0]).toHaveProperty('data');
        });

        it('should return valid transaction by default', async () => {
            const tx = await client.getTransaction('0xabc');

            expect(tx).toHaveProperty('hash');
            expect(tx).toHaveProperty('sender');
            expect(tx).toHaveProperty('sequenceNumber');
            expect(tx).toHaveProperty('payload');
        });

        it('should return valid transaction response by default', async () => {
            const response = await client.waitForTransaction('0xabc');

            expect(response).toHaveProperty('hash');
            expect(response).toHaveProperty('success');
            expect(response).toHaveProperty('vmStatus');
            expect(response).toHaveProperty('gasUsed');
        });
    });

    describe('call tracking integration', () => {
        it('should record all calls', async () => {
            await client.getAccountBalance('0x1');
            await client.getAccountResources('0x2');
            await client.getTransaction('0xabc');

            expect(tracker.getCallCount('getAccountBalance')).toBe(1);
            expect(tracker.getCallCount('getAccountResources')).toBe(1);
            expect(tracker.getCallCount('getTransaction')).toBe(1);
        });

        it('should record call arguments', async () => {
            await client.getAccountBalance('0x123');

            const calls = tracker.getCalls('getAccountBalance');
            expect(calls[0].arguments).toEqual(['0x123']);
        });

        it('should record call results', async () => {
            client.mockResponse('getAccountBalance', '999');
            await client.getAccountBalance('0x1');

            const calls = tracker.getCalls('getAccountBalance');
            expect(calls[0].result).toBe('999');
        });
    });

    describe('network simulation integration', () => {
        it('should apply latency', async () => {
            simulator.simulateLatency(50);

            const start = Date.now();
            await client.getAccountBalance('0x1');
            const elapsed = Date.now() - start;

            expect(elapsed).toBeGreaterThanOrEqual(45);
        });

        it('should throw on network error', async () => {
            simulator.simulateNetworkError();

            await expect(client.getAccountBalance('0x1')).rejects.toThrow(
                'Network error'
            );
        });

        it('should throw on timeout', async () => {
            simulator.simulateTimeout('getAccountBalance');

            await expect(client.getAccountBalance('0x1')).rejects.toThrow('Timeout');
        });

        it('should throw on rate limit', async () => {
            simulator.simulateRateLimit(2);

            await client.getAccountBalance('0x1');
            await client.getAccountBalance('0x2');

            await expect(client.getAccountBalance('0x3')).rejects.toThrow(
                'Rate limited'
            );
        });
    });

    describe('deterministic behavior with seed', () => {
        it('should produce same results with same seed', async () => {
            const faker1 = createFaker({ seed: 42 });
            const faker2 = createFaker({ seed: 42 });

            const client1 = createMockClient({
                tracker: createCallTracker(),
                simulator: createNetworkSimulator(),
                faker: faker1,
            });

            const client2 = createMockClient({
                tracker: createCallTracker(),
                simulator: createNetworkSimulator(),
                faker: faker2,
            });

            const balance1 = await client1.getAccountBalance('0x1');
            const balance2 = await client2.getAccountBalance('0x1');

            expect(balance1).toBe(balance2);
        });
    });
});
