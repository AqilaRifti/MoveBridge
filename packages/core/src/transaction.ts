/**
 * @movebridge/core - Transaction Builder
 * Constructs, signs, and submits transactions using AIP-62 wallet standard
 */

import type { Aptos } from '@aptos-labs/ts-sdk';
import { Errors, wrapError } from './errors';
import type { WalletManager } from './wallet';
import type { TransferOptions, BuildOptions, TransactionPayload } from './types';

/**
 * Transaction Builder
 * Provides methods for building, signing, and submitting transactions
 *
 * @example
 * ```typescript
 * // Transfer tokens using aptos_account::transfer (recommended)
 * const hash = await movement.transaction.transfer({
 *   to: '0x123...',
 *   amount: '1000000', // in octas
 * });
 *
 * // Build and submit custom transaction
 * const payload = await movement.transaction.build({
 *   function: '0x1::aptos_account::transfer',
 *   typeArguments: [],
 *   arguments: ['0x123...', '1000000'],
 * });
 * const hash = await movement.transaction.signAndSubmit(payload);
 * ```
 */
export class TransactionBuilder {
    constructor(
        private readonly aptosClient: Aptos,
        private readonly walletManager: WalletManager
    ) { }

    /**
     * Builds a transfer transaction payload
     * Uses 0x1::aptos_account::transfer which handles account creation
     * @param options - Transfer options
     * @returns Transaction payload ready for signing
     */
    async transfer(options: TransferOptions): Promise<TransactionPayload> {
        // Use aptos_account::transfer - it auto-creates recipient account if needed
        return {
            function: '0x1::aptos_account::transfer',
            typeArguments: [],
            functionArguments: [options.to, options.amount],
        };
    }

    /**
     * Builds a generic transaction payload
     * @param options - Build options with function, typeArguments, and arguments
     * @returns Transaction payload ready for signing
     */
    async build(options: BuildOptions): Promise<TransactionPayload> {
        return {
            function: options.function,
            typeArguments: options.typeArguments,
            functionArguments: options.arguments,
        };
    }

    /**
     * Signs and submits a transaction in one step
     * This is the recommended method for most use cases
     * @param payload - Transaction payload
     * @returns Transaction hash
     * @throws MovementError with code WALLET_NOT_CONNECTED if no wallet connected
     * @throws MovementError with code TRANSACTION_FAILED if submission fails
     * 
     * Note: Transaction failures do NOT affect wallet connection state.
     * The wallet remains connected even if a transaction fails.
     */
    async signAndSubmit(payload: TransactionPayload): Promise<string> {
        // Verify connection before attempting transaction (Requirement 6.3)
        const adapter = this.walletManager.getAdapter();
        const stateBefore = this.walletManager.getState();

        if (!adapter || !stateBefore.connected) {
            throw Errors.walletNotConnected();
        }

        try {
            // Format payload for AIP-62 wallet standard
            const result = await adapter.signAndSubmitTransaction({
                payload: {
                    function: payload.function,
                    typeArguments: payload.typeArguments,
                    functionArguments: payload.functionArguments,
                },
            });

            return result.hash;
        } catch (error) {
            // Transaction failure should NOT change connection state (Requirement 6.1)
            // If the wallet disconnected during the transaction, that's a separate event
            // handled by the wallet's onAccountChange listener, not by us

            // Check if this is a user rejection (not a technical failure)
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isUserRejection = errorMessage.toLowerCase().includes('rejected') ||
                errorMessage.toLowerCase().includes('cancelled') ||
                errorMessage.toLowerCase().includes('canceled') ||
                errorMessage.toLowerCase().includes('denied');

            // Wrap the error with appropriate context
            throw wrapError(
                error,
                'TRANSACTION_FAILED',
                isUserRejection
                    ? 'Transaction was rejected by user'
                    : 'Failed to sign and submit transaction'
            );
        }
    }

    /**
     * Simulates a transaction without submitting
     * Useful for gas estimation and checking if transaction will succeed
     * @param payload - Transaction payload
     * @returns Simulation result with success status and gas estimate
     */
    async simulate(payload: TransactionPayload): Promise<{
        success: boolean;
        gasUsed: string;
        vmStatus: string;
    }> {
        const state = this.walletManager.getState();

        if (!state.connected || !state.address) {
            throw Errors.walletNotConnected();
        }

        try {
            // Build a raw transaction for simulation
            const transaction = await this.aptosClient.transaction.build.simple({
                sender: state.address,
                data: {
                    function: payload.function as `${string}::${string}::${string}`,
                    typeArguments: payload.typeArguments as [],
                    functionArguments: payload.functionArguments as [],
                },
            });

            // Simulate without signer public key (uses account's public key)
            const [simResult] = await this.aptosClient.transaction.simulate.simple({
                transaction,
            });

            return {
                success: simResult?.success ?? false,
                gasUsed: String(simResult?.gas_used ?? '0'),
                vmStatus: String(simResult?.vm_status ?? 'unknown'),
            };
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', 'Failed to simulate transaction');
        }
    }

    /**
     * Convenience method: Transfer and wait for confirmation
     * @param options - Transfer options
     * @returns Transaction hash
     */
    async transferAndSubmit(options: TransferOptions): Promise<string> {
        const payload = await this.transfer(options);
        return this.signAndSubmit(payload);
    }
}
