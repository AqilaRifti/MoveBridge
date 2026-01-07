/**
 * @movebridge/core - Movement Client
 * Main entry point for SDK interactions
 */

import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { resolveConfig, isValidAddress } from './config';
import { Errors, wrapError } from './errors';
import { WalletManager } from './wallet';
import { TransactionBuilder } from './transaction';
import { ContractInterface } from './contract';
import { EventListener } from './events';
import type {
    MovementConfig,
    NetworkType,
    Resource,
    Transaction,
    TransactionResponse,
    ContractOptions,
} from './types';

/**
 * Resolved configuration with all URLs
 */
export interface ResolvedConfig {
    network: NetworkType;
    chainId: number;
    rpcUrl: string;
    indexerUrl: string | null;
    explorerUrl: string;
    autoConnect: boolean;
}

/**
 * Movement SDK client
 * Provides unified interface for Movement Network interactions
 *
 * @example
 * ```typescript
 * import { Movement } from '@movebridge/core';
 *
 * const movement = new Movement({ network: 'testnet' });
 *
 * // Get account balance
 * const balance = await movement.getAccountBalance('0x1');
 *
 * // Connect wallet
 * await movement.wallet.connect('razor');
 * ```
 */
export class Movement {
    /** Resolved configuration */
    public readonly config: ResolvedConfig;

    /** Aptos SDK client instance */
    private readonly aptosClient: Aptos;

    /** Wallet manager instance */
    public readonly wallet: WalletManager;

    /** Transaction builder instance */
    public readonly transaction: TransactionBuilder;

    /** Event listener instance */
    public readonly events: EventListener;

    /**
     * Creates a new Movement client
     * @param config - Configuration options
     */
    constructor(config: MovementConfig) {
        this.config = resolveConfig(config);

        // Initialize Aptos client with Movement network configuration
        const aptosConfigOptions: { network: Network; fullnode: string; indexer?: string } = {
            network: Network.CUSTOM,
            fullnode: this.config.rpcUrl,
        };

        if (this.config.indexerUrl) {
            aptosConfigOptions.indexer = this.config.indexerUrl;
        }

        const aptosConfig = new AptosConfig(aptosConfigOptions);

        this.aptosClient = new Aptos(aptosConfig);

        // Initialize sub-components
        this.wallet = new WalletManager();
        this.transaction = new TransactionBuilder(this.aptosClient, this.wallet);
        this.events = new EventListener(this.aptosClient);

        // Auto-connect if enabled
        if (this.config.autoConnect) {
            this.wallet.autoConnect().catch(() => {
                // Silently fail auto-connect
            });
        }
    }

    /**
     * Gets the underlying Aptos client
     * @returns Aptos SDK client instance
     */
    getAptosClient(): Aptos {
        return this.aptosClient;
    }

    /**
     * Gets the account balance for an address
     * @param address - Account address
     * @returns Balance as string in smallest unit (octas)
     * @throws MovementError with code INVALID_ADDRESS if address is invalid
     */
    async getAccountBalance(address: string): Promise<string> {
        if (!isValidAddress(address)) {
            throw Errors.invalidAddress(address, 'Invalid address format');
        }

        try {
            const resources = await this.aptosClient.getAccountResources({
                accountAddress: address,
            });

            const coinResource = resources.find(
                (r) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
            );

            if (!coinResource) {
                return '0';
            }

            const data = coinResource.data as { coin: { value: string } };
            return data.coin.value;
        } catch (error) {
            throw wrapError(error, 'NETWORK_ERROR', `Failed to get balance for ${address}`);
        }
    }

    /**
     * Gets all resources for an account
     * @param address - Account address
     * @returns Array of resources
     * @throws MovementError with code INVALID_ADDRESS if address is invalid
     */
    async getAccountResources(address: string): Promise<Resource[]> {
        if (!isValidAddress(address)) {
            throw Errors.invalidAddress(address, 'Invalid address format');
        }

        try {
            const resources = await this.aptosClient.getAccountResources({
                accountAddress: address,
            });

            return resources.map((r) => ({
                type: r.type,
                data: r.data as Record<string, unknown>,
            }));
        } catch (error) {
            // Return empty array for non-existent accounts
            if (error instanceof Error && error.message.includes('Account not found')) {
                return [];
            }
            throw wrapError(error, 'NETWORK_ERROR', `Failed to get resources for ${address}`);
        }
    }

    /**
     * Gets a transaction by hash
     * @param hash - Transaction hash
     * @returns Transaction data
     */
    async getTransaction(hash: string): Promise<Transaction> {
        try {
            const tx = await this.aptosClient.getTransactionByHash({ transactionHash: hash });

            // Type assertion for user transaction
            const userTx = tx as {
                hash: string;
                sender: string;
                sequence_number: string;
                payload: {
                    function: string;
                    type_arguments: string[];
                    arguments: unknown[];
                };
                timestamp: string;
            };

            return {
                hash: userTx.hash,
                sender: userTx.sender,
                sequenceNumber: userTx.sequence_number,
                payload: {
                    function: userTx.payload?.function ?? '',
                    typeArguments: userTx.payload?.type_arguments ?? [],
                    functionArguments: userTx.payload?.arguments ?? [],
                },
                timestamp: userTx.timestamp,
            };
        } catch (error) {
            throw wrapError(error, 'NETWORK_ERROR', `Failed to get transaction ${hash}`);
        }
    }

    /**
     * Waits for a transaction to be confirmed
     * @param hash - Transaction hash
     * @param options - Wait options
     * @returns Transaction response
     */
    async waitForTransaction(
        hash: string,
        options?: { timeoutMs?: number; checkIntervalMs?: number }
    ): Promise<TransactionResponse> {
        const timeoutMs = options?.timeoutMs ?? 30000;
        const checkIntervalMs = options?.checkIntervalMs ?? 1000;

        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            try {
                const tx = await this.aptosClient.getTransactionByHash({ transactionHash: hash });

                // Check if transaction is committed
                if ('success' in tx) {
                    const committedTx = tx as {
                        hash: string;
                        success: boolean;
                        vm_status: string;
                        gas_used: string;
                        events: Array<{
                            type: string;
                            sequence_number: string;
                            data: Record<string, unknown>;
                        }>;
                    };

                    return {
                        hash: committedTx.hash,
                        success: committedTx.success,
                        vmStatus: committedTx.vm_status,
                        gasUsed: committedTx.gas_used,
                        events: committedTx.events.map((e) => ({
                            type: e.type,
                            sequenceNumber: e.sequence_number,
                            data: e.data,
                        })),
                    };
                }
            } catch {
                // Transaction not found yet, continue waiting
            }

            await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
        }

        throw Errors.transactionTimeout(hash);
    }

    /**
     * Creates a contract interface for interacting with a Move module
     * @param options - Contract options
     * @returns Contract interface
     */
    contract(options: ContractOptions): ContractInterface {
        return new ContractInterface(this.aptosClient, this.wallet, options);
    }
}
