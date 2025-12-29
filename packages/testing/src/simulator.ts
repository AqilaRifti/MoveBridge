/**
 * @movebridge/testing - Network simulator for testing latency, errors, and rate limits
 */

import type { NetworkSimulator } from './types';

/**
 * Creates a network simulator instance
 * @returns NetworkSimulator instance
 */
export function createNetworkSimulator(): NetworkSimulator {
    let latency = 0;
    let networkErrorEnabled = false;
    let rateLimitMax: number | null = null;
    let rateLimitCalls = 0;
    const timeoutMethods = new Set<string>();

    return {
        /**
         * Sets the latency for all mock responses
         */
        simulateLatency(ms: number): void {
            latency = ms;
        },

        /**
         * Causes a specific method to timeout
         */
        simulateTimeout(method: string): void {
            timeoutMethods.add(method);
        },

        /**
         * Enables network error simulation for all calls
         */
        simulateNetworkError(): void {
            networkErrorEnabled = true;
        },

        /**
         * Sets up rate limiting after N calls
         */
        simulateRateLimit(maxCalls: number): void {
            rateLimitMax = maxCalls;
            rateLimitCalls = 0;
        },

        /**
         * Resets all simulation settings
         */
        resetSimulation(): void {
            latency = 0;
            networkErrorEnabled = false;
            rateLimitMax = null;
            rateLimitCalls = 0;
            timeoutMethods.clear();
        },

        /**
         * Gets the current latency setting
         */
        getLatency(): number {
            return latency;
        },

        /**
         * Checks if network error is enabled
         */
        isNetworkErrorEnabled(): boolean {
            return networkErrorEnabled;
        },

        /**
         * Checks if a method is set to timeout
         */
        isMethodTimedOut(method: string): boolean {
            return timeoutMethods.has(method);
        },

        /**
         * Gets remaining rate limit calls (null if no limit)
         */
        getRateLimitRemaining(): number | null {
            if (rateLimitMax === null) return null;
            return Math.max(0, rateLimitMax - rateLimitCalls);
        },

        /**
         * Increments the rate limit call counter
         */
        incrementRateLimitCalls(): void {
            rateLimitCalls++;
        },
    };
}

/**
 * Helper to apply network simulation to a promise
 * @param simulator - Network simulator instance
 * @param method - Method name being called
 * @param fn - Function to execute
 * @returns Promise with simulation applied
 */
export async function applySimulation<T>(
    simulator: NetworkSimulator,
    method: string,
    fn: () => T | Promise<T>
): Promise<T> {
    // Check for network error
    if (simulator.isNetworkErrorEnabled()) {
        throw new Error('Network error: Connection failed');
    }

    // Check for timeout
    if (simulator.isMethodTimedOut(method)) {
        throw new Error(`Timeout: Method "${method}" timed out`);
    }

    // Check rate limit
    const remaining = simulator.getRateLimitRemaining();
    if (remaining !== null && remaining <= 0) {
        throw new Error('Rate limited: Too many requests');
    }

    // Increment rate limit counter if rate limiting is active
    if (remaining !== null) {
        simulator.incrementRateLimitCalls();
    }

    // Apply latency
    const latency = simulator.getLatency();
    if (latency > 0) {
        await new Promise((resolve) => setTimeout(resolve, latency));
    }

    // Execute the function
    return fn();
}
