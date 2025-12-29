/**
 * @movebridge/testing - Mock Movement client
 */

import type {
    Resource,
    Transaction,
    TransactionResponse,
    MovementError,
} from '@movebridge/core';
import type {
    MockMovementClient,
    MockConfig,
    CallTracker,
    NetworkSimulator,
    ResponseFaker,
} from './types';
import { applySimulation } from './simulator';

interface MockClientDependencies {
    tracker: CallTracker;
    simulator: NetworkSimulator;
    faker: ResponseFaker;
}

/**
 * Creates a mock Movement client
 * @param deps - Dependencies (tracker, simulator, faker)
 * @returns MockMovementClient instance
 */
export function createMockClient(deps: MockClientDependencies): MockMovementClient {
    const { tracker, simulator, faker } = deps;

    // Store for mock configurations
    const mocks = new Map<string, MockConfig<unknown>>();
    const onceMocks = new Map<string, MockConfig<unknown>>();

    /**
     * Gets the response for a method, checking mocks first
     */
    async function getResponse<T>(method: string, defaultFn: () => T): Promise<T> {
        // Check one-time mocks first
        const onceMock = onceMocks.get(method);
        if (onceMock) {
            onceMocks.delete(method);
            if (onceMock.error) {
                throw onceMock.error;
            }
            return onceMock.response as T;
        }

        // Check persistent mocks
        const mock = mocks.get(method);
        if (mock) {
            if (mock.error) {
                throw mock.error;
            }
            return mock.response as T;
        }

        // Return default
        return defaultFn();
    }

    /**
     * Wraps a method call with tracking and simulation
     */
    async function wrapCall<T>(
        method: string,
        args: unknown[],
        defaultFn: () => T
    ): Promise<T> {
        try {
            const result = await applySimulation(simulator, method, async () => {
                return getResponse(method, defaultFn);
            });
            tracker.recordCall(method, args, result);
            return result;
        } catch (error) {
            tracker.recordCall(method, args, undefined, error as Error);
            throw error;
        }
    }

    return {
        /**
         * Configures a persistent mock response for a method
         */
        mockResponse<T>(method: string, response: T): void {
            mocks.set(method, { response });
        },

        /**
         * Configures a mock error for a method
         */
        mockError(method: string, error: MovementError): void {
            mocks.set(method, { error });
        },

        /**
         * Configures a one-time mock response for a method
         */
        mockResponseOnce<T>(method: string, response: T): void {
            onceMocks.set(method, { response });
        },

        /**
         * Clears all mock configurations
         */
        clearMocks(): void {
            mocks.clear();
            onceMocks.clear();
        },

        /**
         * Gets account balance (mocked)
         */
        async getAccountBalance(address: string): Promise<string> {
            return wrapCall('getAccountBalance', [address], () =>
                faker.fakeBalance()
            );
        },

        /**
         * Gets account resources (mocked)
         */
        async getAccountResources(address: string): Promise<Resource[]> {
            return wrapCall('getAccountResources', [address], () => [
                faker.fakeResource('0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'),
            ]);
        },

        /**
         * Gets transaction by hash (mocked)
         */
        async getTransaction(hash: string): Promise<Transaction> {
            return wrapCall('getTransaction', [hash], () => {
                const tx = faker.fakeTransaction();
                return { ...tx, hash };
            });
        },

        /**
         * Waits for transaction confirmation (mocked)
         */
        async waitForTransaction(hash: string): Promise<TransactionResponse> {
            return wrapCall('waitForTransaction', [hash], () => {
                const response = faker.fakeTransactionResponse(true);
                return { ...response, hash };
            });
        },
    };
}
