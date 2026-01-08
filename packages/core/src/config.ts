/**
 * @movebridge/core - Network configuration
 */

import type { NetworkConfig, NetworkType, MovementConfig } from './types';

/**
 * Network configuration constants for Movement Network
 */
export const NETWORK_CONFIG: Record<NetworkType, NetworkConfig> = {
    mainnet: {
        chainId: 126,
        rpcUrl: 'https://full.mainnet.movementinfra.xyz/v1',
        indexerUrl: 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql',
        explorerUrl: 'https://explorer.movementnetwork.xyz/?network=mainnet',
    },
    testnet: {
        chainId: 250,
        rpcUrl: 'https://testnet.movementnetwork.xyz/v1',
        indexerUrl: 'https://hasura.testnet.movementnetwork.xyz/v1/graphql',
        explorerUrl: 'https://explorer.movementnetwork.xyz/?network=bardock+testnet',
        faucetUrl: 'https://faucet.testnet.movementnetwork.xyz/',
    },
} as const;

/**
 * Default coin type for native token transfers
 */
export const DEFAULT_COIN_TYPE = '0x1::aptos_coin::AptosCoin';

/**
 * Resolves the full configuration from user options
 * @param config - User-provided configuration
 * @returns Resolved network configuration with all URLs
 */
export function resolveConfig(config: MovementConfig): {
    network: NetworkType;
    chainId: number;
    rpcUrl: string;
    indexerUrl: string | null;
    explorerUrl: string;
    autoConnect: boolean;
} {
    const networkConfig = NETWORK_CONFIG[config.network];

    return {
        network: config.network,
        chainId: networkConfig.chainId,
        rpcUrl: config.rpcUrl ?? networkConfig.rpcUrl,
        indexerUrl: config.indexerUrl ?? networkConfig.indexerUrl,
        explorerUrl: networkConfig.explorerUrl,
        autoConnect: config.autoConnect ?? false,
    };
}

/**
 * Validates a Movement/Aptos address format
 * @param address - Address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
    // Movement/Aptos addresses are 64 hex characters with 0x prefix
    const addressRegex = /^0x[a-fA-F0-9]{1,64}$/;
    return addressRegex.test(address);
}

/**
 * Validates an event handle format
 * @param eventHandle - Event handle to validate
 * @returns true if valid, false otherwise
 */
export function isValidEventHandle(eventHandle: string): boolean {
    // Event handles follow format: 0xADDRESS::module::EventType
    const eventHandleRegex = /^0x[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    return eventHandleRegex.test(eventHandle);
}

/**
 * Gets the explorer URL for a transaction
 * @param network - Network type
 * @param txHash - Transaction hash
 * @returns Explorer URL for the transaction
 */
export function getExplorerTxUrl(network: NetworkType, txHash: string): string {
    const config = NETWORK_CONFIG[network];
    return `${config.explorerUrl}&txn=${txHash}`;
}

/**
 * Gets the explorer URL for an account
 * @param network - Network type
 * @param address - Account address
 * @returns Explorer URL for the account
 */
export function getExplorerAccountUrl(network: NetworkType, address: string): string {
    const config = NETWORK_CONFIG[network];
    return `${config.explorerUrl}&account=${address}`;
}
