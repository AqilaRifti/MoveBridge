/**
 * @movebridge/core - Contract Interface
 * Simplified interface for contract interactions
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
 *   address: '0x123...',
 *   module: 'counter',
 * });
 *
 * // Read (view function)
 * const count = await contract.view('get_count', []);
 *
 * // Write (entry function)
 * const txHash = await contract.call('increment', []);
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
     * @param functionName - Name of the view function
     * @param args - Function arguments
     * @param typeArgs - Type arguments (optional)
     * @returns Function result
     * @throws MovementError with code VIEW_FUNCTION_FAILED if call fails
     */
    async view<T = unknown>(
        functionName: string,
        args: unknown[],
        typeArgs: string[] = []
    ): Promise<T> {
        const fullFunctionName = `${this.address}::${this.module}::${functionName}`;

        try {
            // Use type assertion to work around strict Aptos SDK types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            const result = await client.view({
                payload: {
                    function: fullFunctionName,
                    typeArguments: typeArgs,
                    functionArguments: args,
                },
            });

            // Return first result or the entire array
            return (result.length === 1 ? result[0] : result) as T;
        } catch (error) {
            throw Errors.viewFunctionFailed(fullFunctionName, args, error);
        }
    }

    /**
     * Calls an entry function (write operation)
     * @param functionName - Name of the entry function
     * @param args - Function arguments
     * @param typeArgs - Type arguments (optional)
     * @returns Transaction hash
     * @throws MovementError with code WALLET_NOT_CONNECTED if no wallet is connected
     * @throws MovementError with code TRANSACTION_FAILED if transaction fails
     */
    async call(
        functionName: string,
        args: unknown[],
        typeArgs: string[] = []
    ): Promise<string> {
        const adapter = this.walletManager.getAdapter();
        const state = this.walletManager.getState();

        if (!adapter || !state.connected) {
            throw Errors.walletNotConnected();
        }

        const fullFunctionName = `${this.address}::${this.module}::${functionName}`;

        try {
            const result = await adapter.signAndSubmitTransaction({
                type: 'entry_function_payload',
                function: fullFunctionName,
                type_arguments: typeArgs,
                arguments: args,
            });

            return result.hash;
        } catch (error) {
            throw wrapError(error, 'TRANSACTION_FAILED', `Failed to call ${fullFunctionName}`);
        }
    }

    /**
     * Checks if a resource exists at the contract address
     * @param resourceType - Full resource type (e.g., '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>')
     * @returns true if resource exists
     */
    async hasResource(resourceType: string): Promise<boolean> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            await client.getAccountResource({
                accountAddress: this.address,
                resourceType,
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
     */
    async getResource<T = unknown>(resourceType: string): Promise<T | null> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            const resource = await client.getAccountResource({
                accountAddress: this.address,
                resourceType,
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
