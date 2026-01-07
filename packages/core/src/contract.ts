/**
 * @movebridge/core - Contract Interface
 * Simplified interface for Move module interactions
 */

import type { Aptos } from '@aptos-labs/ts-sdk';
import { Errors, wrapError } from './errors';
import type { WalletManager } from './wallet';
import type { ContractOptions } from './types';

/**
 * Contract Interface
 * Provides simplified methods for interacting with Move modules
 *
 * @example
 * ```typescript
 * const contract = movement.contract({
 *   address: '0x1',
 *   module: 'coin',
 * });
 *
 * // Read (view function) - no wallet needed
 * const balance = await contract.view('balance', ['0x123...'], ['0x1::aptos_coin::AptosCoin']);
 *
 * // Write (entry function) - requires connected wallet
 * const txHash = await contract.call('transfer', ['0x456...', '1000000'], ['0x1::aptos_coin::AptosCoin']);
 * ```
 */
export class ContractInterface {
    /** Contract address */
    public readonly address: string;

    /** Module name */
    public readonly module: string;

    constructor(
        private readonly aptosClient: Aptos,
        private readonly walletManager: WalletManager,
        options: ContractOptions
    ) {
        this.address = options.address;
        this.module = options.module;
    }

    /**
     * Calls a view function (read-only)
     * View functions don't require a wallet connection
     * 
     * @param functionName - Name of the view function
     * @param args - Function arguments
     * @param typeArgs - Type arguments for generic functions
     * @returns Function result
     * @throws MovementError with code VIEW_FUNCTION_FAILED if call fails
     * 
     * @example
     * ```typescript
     * // Get coin balance
     * const balance = await contract.view('balance', [address], ['0x1::aptos_coin::AptosCoin']);
     * 
     * // Check if account exists
     * const exists = await contract.view('exists_at', [address]);
     * ```
     */
    async view<T = unknown>(
        functionName: string,
        args: unknown[] = [],
        typeArgs: string[] = []
    ): Promise<T> {
        const fullFunctionName = `${this.address}::${this.module}::${functionName}`;

        try {
            // Use Aptos SDK view with correct payload format
            const result = await this.aptosClient.view({
                payload: {
                    function: fullFunctionName as `${string}::${string}::${string}`,
                    typeArguments: typeArgs as [],
                    functionArguments: args as [],
                },
            });

            // Unwrap single-element arrays for convenience
            // Return array as-is for multiple values
            return (result.length === 1 ? result[0] : result) as T;
        } catch (error) {
            throw Errors.viewFunctionFailed(fullFunctionName, args, error);
        }
    }

    /**
     * Calls an entry function (write operation)
     * Requires a connected wallet
     * 
     * @param functionName - Name of the entry function
     * @param args - Function arguments
     * @param typeArgs - Type arguments for generic functions
     * @returns Transaction hash
     * @throws MovementError with code WALLET_NOT_CONNECTED if no wallet connected
     * @throws MovementError with code TRANSACTION_FAILED if transaction fails
     * 
     * @example
     * ```typescript
     * // Transfer coins
     * const txHash = await contract.call('transfer', [recipient, amount], ['0x1::aptos_coin::AptosCoin']);
     * 
     * // Call a custom function
     * const txHash = await contract.call('increment', []);
     * ```
     */
    async call(
        functionName: string,
        args: unknown[] = [],
        typeArgs: string[] = []
    ): Promise<string> {
        const adapter = this.walletManager.getAdapter();
        const state = this.walletManager.getState();

        if (!adapter || !state.connected) {
            throw Errors.walletNotConnected();
        }

        const fullFunctionName = `${this.address}::${this.module}::${functionName}`;

        try {
            // Format payload for AIP-62 wallet standard
            const result = await adapter.signAndSubmitTransaction({
                payload: {
                    function: fullFunctionName,
                    typeArguments: typeArgs,
                    functionArguments: args,
                },
            });

            return result.hash;
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', `Failed to call ${fullFunctionName}`);
        }
    }

    /**
     * Checks if a resource exists at the contract address
     * @param resourceType - Full resource type
     * @returns true if resource exists
     * 
     * @example
     * ```typescript
     * const hasCoin = await contract.hasResource('0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>');
     * ```
     */
    async hasResource(resourceType: string): Promise<boolean> {
        try {
            await this.aptosClient.getAccountResource({
                accountAddress: this.address,
                resourceType: resourceType as `${string}::${string}::${string}`,
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Gets a resource from the contract address
     * @param resourceType - Full resource type
     * @returns Resource data or null if not found
     * 
     * @example
     * ```typescript
     * const coinStore = await contract.getResource<{ coin: { value: string } }>(
     *   '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
     * );
     * ```
     */
    async getResource<T = unknown>(resourceType: string): Promise<T | null> {
        try {
            const resource = await this.aptosClient.getAccountResource({
                accountAddress: this.address,
                resourceType: resourceType as `${string}::${string}::${string}`,
            });
            return resource as T;
        } catch {
            return null;
        }
    }

    /**
     * Gets the full function name for a function in this module
     * @param functionName - Function name
     * @returns Full function name (address::module::function)
     */
    getFullFunctionName(functionName: string): string {
        return `${this.address}::${this.module}::${functionName}`;
    }
}
