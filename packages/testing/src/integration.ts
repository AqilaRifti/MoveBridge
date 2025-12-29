/**
 * @movebridge/testing - Integration test utilities
 */

import { MovementError } from '@movebridge/core';
import type { TestAccount, IntegrationUtils } from './types';

/**
 * Creates integration test utilities
 * @param network - Network to use (only 'testnet' allowed)
 * @returns IntegrationUtils instance
 */
export function createIntegrationUtils(network: 'testnet'): IntegrationUtils {
    // Prevent mainnet usage
    if (network !== 'testnet') {
        throw new MovementError(
            'Integration tests can only be run on testnet to prevent accidental mainnet usage',
            'INVALID_ARGUMENT',
            { network, allowed: ['testnet'] }
        );
    }

    return {
        /**
         * Creates a new test account and funds it from the faucet
         * Note: This requires network access and should only be used in integration tests
         */
        async createTestAccount(): Promise<TestAccount> {
            // This is a placeholder implementation
            // In a real implementation, this would:
            // 1. Generate a new keypair
            // 2. Request funds from the testnet faucet
            // 3. Return the account details
            throw new MovementError(
                'createTestAccount requires network access. Use in integration tests only.',
                'NETWORK_ERROR',
                { reason: 'Not implemented for unit tests' }
            );
        },

        /**
         * Waits for an account to be funded
         */
        async waitForFunding(address: string, timeout = 30000): Promise<string> {
            // Placeholder - would poll the network for balance
            throw new MovementError(
                'waitForFunding requires network access. Use in integration tests only.',
                'NETWORK_ERROR',
                { address, timeout, reason: 'Not implemented for unit tests' }
            );
        },

        /**
         * Cleans up a test account by transferring remaining balance
         */
        async cleanupTestAccount(account: TestAccount): Promise<void> {
            // Placeholder - would transfer remaining balance to burn address
            throw new MovementError(
                'cleanupTestAccount requires network access. Use in integration tests only.',
                'NETWORK_ERROR',
                { address: account.address, reason: 'Not implemented for unit tests' }
            );
        },

        /**
         * Executes a callback with a temporary test account
         */
        async withTestAccount<T>(
            callback: (account: TestAccount) => Promise<T>
        ): Promise<T> {
            const account = await this.createTestAccount();
            try {
                return await callback(account);
            } finally {
                await this.cleanupTestAccount(account);
            }
        },
    };
}

/**
 * Validates that we're not accidentally using mainnet
 * @param network - Network to validate
 * @throws MovementError if network is mainnet
 */
export function assertNotMainnet(network: string): void {
    if (network === 'mainnet') {
        throw new MovementError(
            'Cannot run integration tests on mainnet',
            'INVALID_ARGUMENT',
            { network, reason: 'Mainnet usage is forbidden in tests' }
        );
    }
}
