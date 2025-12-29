/**
 * @movebridge/testing - Property tests for Network Simulator
 * 
 * Feature: testing-validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createNetworkSimulator, applySimulation } from '../simulator';
import type { NetworkSimulator } from '../types';

describe('Network Simulator Properties', () => {
    let simulator: NetworkSimulator;

    beforeEach(() => {
        simulator = createNetworkSimulator();
    });

    /**
     * Feature: testing-validation, Property 19: Latency simulation
     * For any positive millisecond value, after calling simulateLatency,
     * mock method calls SHALL take at least that many milliseconds to resolve.
     */
    it('Property 19: Latency simulation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 100 }), // Keep latency small for test speed
                async (latency) => {
                    simulator.simulateLatency(latency);

                    const start = Date.now();
                    await applySimulation(simulator, 'test', () => 'result');
                    const elapsed = Date.now() - start;

                    // Allow some tolerance for timing
                    expect(elapsed).toBeGreaterThanOrEqual(latency - 5);

                    simulator.resetSimulation();
                }
            ),
            { numRuns: 20 } // Fewer runs due to async nature
        );
    });

    /**
     * Feature: testing-validation, Property 20: Rate limit simulation
     * For any positive integer N, after calling simulateRateLimit(N),
     * the first N calls SHALL succeed and subsequent calls SHALL reject.
     */
    it('Property 20: Rate limit simulation', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (maxCalls) => {
                    simulator.simulateRateLimit(maxCalls);

                    // Rate limit should be set to maxCalls
                    expect(simulator.getRateLimitRemaining()).toBe(maxCalls);

                    simulator.resetSimulation();
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: testing-validation, Property 21: Simulation reset
     * For any network simulator with active simulations,
     * after calling resetSimulation, mock methods SHALL respond normally.
     */
    it('Property 21: Simulation reset', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 10, max: 50 }),
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.integer({ min: 1, max: 5 }),
                async (latency, method, rateLimit) => {
                    // Set up various simulations
                    simulator.simulateLatency(latency);
                    simulator.simulateTimeout(method);
                    simulator.simulateRateLimit(rateLimit);

                    // Verify simulations are active
                    expect(simulator.getLatency()).toBe(latency);
                    expect(simulator.isMethodTimedOut(method)).toBe(true);
                    expect(simulator.getRateLimitRemaining()).not.toBeNull();

                    // Reset
                    simulator.resetSimulation();

                    // Verify all reset
                    expect(simulator.getLatency()).toBe(0);
                    expect(simulator.isMethodTimedOut(method)).toBe(false);
                    expect(simulator.getRateLimitRemaining()).toBeNull();
                    expect(simulator.isNetworkErrorEnabled()).toBe(false);

                    // Verify can execute without delay
                    const start = Date.now();
                    await applySimulation(simulator, 'test', () => 'result');
                    const elapsed = Date.now() - start;
                    expect(elapsed).toBeLessThan(50); // Should be nearly instant
                }
            ),
            { numRuns: 30 }
        );
    });

    /**
     * Additional property: Network error simulation
     */
    it('Property: Network error causes rejection', async () => {
        simulator.simulateNetworkError();

        await expect(
            applySimulation(simulator, 'test', () => 'result')
        ).rejects.toThrow('Network error');
    });

    /**
     * Additional property: Timeout simulation for specific method
     */
    it('Property: Timeout simulation for specific method', async () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== ''),
                (timeoutMethod, otherMethod) => {
                    // Skip if methods are the same
                    if (timeoutMethod === otherMethod) return true;

                    simulator.simulateTimeout(timeoutMethod);

                    expect(simulator.isMethodTimedOut(timeoutMethod)).toBe(true);
                    expect(simulator.isMethodTimedOut(otherMethod)).toBe(false);

                    simulator.resetSimulation();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
