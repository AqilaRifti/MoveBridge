/**
 * @movebridge/core - Transaction Builder
 * Constructs, signs, and submits transactions
 */

import type { Aptos } from '@aptos-labs/ts-sdk';
import { DEFAULT_COIN_TYPE } from './config';
import { Errors, wrapError } from './errors';
import type { WalletManager } from './wallet';
import type { TransferOptions, BuildOptions, TransactionPayload, SignedTransaction } from './types';

/**
 * Transaction Builder
 * Provides methods for building, signing, and submitting transactions
 *
 * @example
 * ```typescript
 * // Transfer tokens
 * const tx = await movement.transaction.transfer({
 *   to: '0x123...',
 *   amount: '1000000',
 * });
 *
 * // Build custom transaction
 * const tx = await movement.transaction.build({
 *   function: '0x1::coin::transfer',
 *   typeArguments: ['0x1::aptos_coin::AptosCoin'],
 *   arguments: ['0x123...', '1000000'],
 * });
 *
 * // Sign and submit
 * const signed = await movement.transaction.sign(tx);
 * const hash = await movement.transaction.submit(signed);
 * ```
 */
export class TransactionBuilder {
    constructor(
        private readonly aptosClient: Aptos,
        private readonly walletManager: WalletManager
    ) { }

    /**
     * Builds a transfer transaction payload
     * @param options - Transfer options
     * @returns Transaction payload
     */
    async transfer(options: TransferOptions): Promise<TransactionPayload> {
        const coinType = options.coinType ?? DEFAULT_COIN_TYPE;

        return {
            type: 'entry_function_payload',
            function: '0x1::coin::transfer',
            typeArguments: [coinType],
            arguments: [options.to, options.amount],
        };
    }

    /**
     * Builds a generic transaction payload
     * @param options - Build options
     * @returns Transaction payload
     */
    async build(options: BuildOptions): Promise<TransactionPayload> {
        return {
            type: 'entry_function_payload',
            function: options.function,
            typeArguments: options.typeArguments,
            arguments: options.arguments,
        };
    }

    /**
     * Signs a transaction payload
     * @param payload - Transaction payload to sign
     * @returns Signed transaction
     * @throws MovementError with code WALLET_NOT_CONNECTED if no wallet is connected
     */
    async sign(payload: TransactionPayload): Promise<SignedTransaction> {
        const adapter = this.walletManager.getAdapter();
        const state = this.walletManager.getState();

        if (!adapter || !state.connected || !state.address) {
            throw Errors.walletNotConnected();
        }

        try {
            const signatureBytes = await adapter.signTransaction({
                type: payload.type,
                function: payload.function,
                type_arguments: payload.typeArguments,
                arguments: payload.arguments,
            });

            // Convert signature bytes to hex string
            const signature = Array.from(signatureBytes)
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');

            return {
                payload,
                signature: `0x${signature}`,
                sender: state.address,
            };
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', 'Failed to sign transaction');
        }
    }

    /**
     * Submits a signed transaction to the network
     * @param signed - Signed transaction
     * @returns Transaction hash
     */
    async submit(signed: SignedTransaction): Promise<string> {
        const adapter = this.walletManager.getAdapter();

        if (!adapter) {
            throw Errors.walletNotConnected();
        }

        try {
            const result = await adapter.signAndSubmitTransaction({
                type: signed.payload.type,
                function: signed.payload.function,
                type_arguments: signed.payload.typeArguments,
                arguments: signed.payload.arguments,
            });

            return result.hash;
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', 'Failed to submit transaction');
        }
    }

    /**
     * Signs and submits a transaction in one step
     * @param payload - Transaction payload
     * @returns Transaction hash
     */
    async signAndSubmit(payload: TransactionPayload): Promise<string> {
        const adapter = this.walletManager.getAdapter();

        if (!adapter) {
            throw Errors.walletNotConnected();
        }

        try {
            const result = await adapter.signAndSubmitTransaction({
                type: payload.type,
                function: payload.function,
                type_arguments: payload.typeArguments,
                arguments: payload.arguments,
            });

            return result.hash;
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', 'Failed to sign and submit transaction');
        }
    }

    /**
     * Simulates a transaction without submitting
     * @param payload - Transaction payload
     * @returns Simulation result with gas estimate
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
            // Use type assertion to work around strict Aptos SDK types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            const result = await client.transaction.simulate.simple({
                sender: state.address,
                data: {
                    function: payload.function,
                    typeArguments: payload.typeArguments,
                    functionArguments: payload.arguments,
                },
            });

            const simResult = result[0];

            return {
                success: simResult?.success ?? false,
                gasUsed: String(simResult?.gas_used ?? '0'),
                vmStatus: String(simResult?.vm_status ?? 'unknown'),
            };
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', 'Failed to simulate transaction');
        }
    }
}
