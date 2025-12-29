/**
 * @movebridge/testing - Unit tests for Network Simulator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createNetworkSimulator, applySimulation } from '../simulator';
import type { NetworkSimulator } from '../types';

describe('Network Simulator', () => {
    let simulator: NetworkSimulator;

    beforeEach(() => {
        simulator = createNetworkSimulator();
    });

    describe('simulateLatency', () => {
        it('should set latency value', () => {
            simulator.simulateLatency(100);
            expect(simulator.getLatency()).toBe(100);
        });

        it('should add delay to applySimulation', async () => {
            simulator.simulateLatency(50);

            const start = Date.now();
            await applySimulation(simulator, 'test', () => 'result');
            const elapsed = Date.now() - start;

            expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small tolerance
        });
    });

    describe('simulateTimeout', () => {
        it('should mark method as timed out', () => {
            simulator.simulateTimeout('testMethod');
            expect(simulator.isMethodTimedOut('testMethod')).toBe(true);
        });

        it('should not affect other methods', () => {
            simulator.simulateTimeout('testMethod');
            expect(simulator.isMethodTimedOut('otherMethod')).toBe(false);
        });

        it('should cause applySimulation to throw', async () => {
            simulator.simulateTimeout('testMethod');

            await expect(
                applySimulation(simulator, 'testMethod', () => 'result')
            ).rejects.toThrow('Timeout');
        });
    });

    describe('simulateNetworkError', () => {
        it('should enable network error', () => {
            simulator.simulateNetworkError();
            expect(simulator.isNetworkErrorEnabled()).toBe(true);
        });

        it('should cause applySimulation to throw', async () => {
            simulator.simulateNetworkError();

            await expect(
                applySimulation(simulator, 'test', () => 'result')
            ).rejects.toThrow('Network error');
        });
    });

    describe('simulateRateLimit', () => {
        it('should set rate limit', () => {
            simulator.simulateRateLimit(5);
            expect(simulator.getRateLimitRemaining()).toBe(5);
        });

        it('should cause applySimulation to throw when limit reached', async () => {
            simulator.simulateRateLimit(0);

            await expect(
                applySimulation(simulator, 'test', () => 'result')
            ).rejects.toThrow('Rate limited');
        });
    });

    describe('resetSimulation', () => {
        it('should reset latency', () => {
            simulator.simulateLatency(100);
            simulator.resetSimulation();
            expect(simulator.getLatency()).toBe(0);
        });

        it('should reset network error', () => {
            simulator.simulateNetworkError();
            simulator.resetSimulation();
            expect(simulator.isNetworkErrorEnabled()).toBe(false);
        });

        it('should reset timeout methods', () => {
            simulator.simulateTimeout('testMethod');
            simulator.resetSimulation();
            expect(simulator.isMethodTimedOut('testMethod')).toBe(false);
        });

        it('should reset rate limit', () => {
            simulator.simulateRateLimit(5);
            simulator.resetSimulation();
            expect(simulator.getRateLimitRemaining()).toBeNull();
        });
    });

    describe('applySimulation', () => {
        it('should return result when no simulation active', async () => {
            const result = await applySimulation(simulator, 'test', () => 'result');
            expect(result).toBe('result');
        });

        it('should work with async functions', async () => {
            const result = await applySimulation(simulator, 'test', async () => {
                return 'async result';
            });
            expect(result).toBe('async result');
        });

        it('should check network error first', async () => {
            simulator.simulateNetworkError();
            simulator.simulateTimeout('test');

            await expect(
                applySimulation(simulator, 'test', () => 'result')
            ).rejects.toThrow('Network error');
        });

        it('should check timeout second', async () => {
            simulator.simulateTimeout('test');
            simulator.simulateRateLimit(0);

            await expect(
                applySimulation(simulator, 'test', () => 'result')
            ).rejects.toThrow('Timeout');
        });
    });

    describe('initial state', () => {
        it('should have zero latency', () => {
            expect(simulator.getLatency()).toBe(0);
        });

        it('should not have network error enabled', () => {
            expect(simulator.isNetworkErrorEnabled()).toBe(false);
        });

        it('should not have any methods timed out', () => {
            expect(simulator.isMethodTimedOut('anyMethod')).toBe(false);
        });

        it('should have null rate limit', () => {
            expect(simulator.getRateLimitRemaining()).toBeNull();
        });
    });
});
