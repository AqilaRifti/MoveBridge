/**
 * @movebridge/testing - Test harness for MoveBridge SDK
 */

import type { TestHarnessConfig, TestHarness } from './types';
import { createFaker } from './faker';
import { createCallTracker } from './tracker';
import { createNetworkSimulator } from './simulator';
import { createMockClient } from './mock-client';

/**
 * Creates a test harness for testing MoveBridge SDK integrations
 * @param config - Optional configuration
 * @returns TestHarness instance with mocked components
 *
 * @example
 * ```typescript
 * const harness = createTestHarness({ seed: 12345 });
 *
 * // Configure mock responses
 * harness.client.mockResponse('getAccountBalance', '1000000000');
 *
 * // Use the mocked client
 * const balance = await harness.client.getAccountBalance('0x1');
 *
 * // Assert on calls
 * harness.tracker.assertCalled('getAccountBalance');
 *
 * // Cleanup
 * harness.cleanup();
 * ```
 */
export function createTestHarness(config?: TestHarnessConfig): TestHarness {
    const seed = config?.seed ?? Date.now();
    const defaultLatency = config?.defaultLatency ?? 0;

    // Create components
    const faker = createFaker({ seed });
    const tracker = createCallTracker();
    const simulator = createNetworkSimulator();

    // Apply default latency if configured
    if (defaultLatency > 0) {
        simulator.simulateLatency(defaultLatency);
    }

    // Create mock client with dependencies
    const client = createMockClient({ tracker, simulator, faker });

    return {
        client,
        tracker,
        simulator,
        faker,

        /**
         * Cleans up all state - call after each test
         */
        cleanup(): void {
            client.clearMocks();
            tracker.clearCalls();
            simulator.resetSimulation();
        },

        /**
         * Resets to initial state while keeping configuration
         */
        reset(): void {
            client.clearMocks();
            tracker.clearCalls();
            // Don't reset simulator - keep latency settings
        },
    };
}
