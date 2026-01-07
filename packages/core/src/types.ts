/**
 * @movebridge/core - Type definitions
 */

/** Supported network types */
export type NetworkType = 'mainnet' | 'testnet';

/** Supported wallet types for Movement Network */
export type WalletType = 'razor' | 'nightly' | 'okx';

/** Wallet information for display */
export interface WalletInfo {
    /** Wallet type identifier */
    type: WalletType;
    /** Display name of the wallet */
    name: string;
    /** Icon URL or data URI for the wallet */
    icon: string;
    /** Whether the wallet is currently installed/available */
    installed: boolean;
}

/** Configuration options for Movement client */
export interface MovementConfig {
    /** Network to connect to */
    network: NetworkType;
    /** Custom RPC URL (overrides network default) */
    rpcUrl?: string;
    /** Custom indexer URL (overrides network default) */
    indexerUrl?: string;
    /** Auto-connect to previously connected wallet */
    autoConnect?: boolean;
}

/** Network-specific configuration */
export interface NetworkConfig {
    chainId: number;
    rpcUrl: string;
    indexerUrl: string | null;
    explorerUrl: string;
    faucetUrl?: string;
}

/** Account resource from blockchain */
export interface Resource {
    type: string;
    data: Record<string, unknown>;
}

/** Transaction data */
export interface Transaction {
    hash: string;
    sender: string;
    sequenceNumber: string;
    payload: {
        function: string;
        typeArguments: string[];
        functionArguments: unknown[];
    };
    timestamp: string;
}

/** Transaction response after confirmation */
export interface TransactionResponse {
    hash: string;
    success: boolean;
    vmStatus: string;
    gasUsed: string;
    events: ContractEvent[];
}

/** Transaction payload for entry functions (AIP-62 compatible) */
export interface TransactionPayload {
    /** Entry function identifier: address::module::function */
    function: string;
    /** Type arguments for generic functions */
    typeArguments: string[];
    /** Function arguments */
    functionArguments: unknown[];
}

/** Signed transaction ready for submission */
export interface SignedTransaction {
    payload: TransactionPayload;
    signature: string;
    sender: string;
}

/** Contract event data */
export interface ContractEvent {
    type: string;
    sequenceNumber: string;
    data: Record<string, unknown>;
}

/** Wallet connection state */
export interface WalletState {
    connected: boolean;
    address: string | null;
    publicKey: string | null;
}

/** Wallet event handlers */
export interface WalletEvents {
    connect: (address: string) => void;
    disconnect: () => void;
    accountChanged: (newAddress: string) => void;
    networkChanged: (network: string) => void;
}

/** Options for token transfer */
export interface TransferOptions {
    to: string;
    amount: string;
    coinType?: string;
}

/** Options for building transactions */
export interface BuildOptions {
    function: string;
    typeArguments: string[];
    arguments: unknown[];
}

/** Options for creating contract interface */
export interface ContractOptions {
    address: string;
    module: string;
}

/** Event subscription configuration (new format) */
export interface EventSubscription {
    /** Account address to watch for events */
    accountAddress: string;
    /** Event type (e.g., '0x1::coin::DepositEvent') */
    eventType: string;
    /** Callback function when events are received */
    callback: (event: ContractEvent) => void;
}

/** Legacy event subscription (backward compatible) */
export interface LegacyEventSubscription {
    /** Event handle in format: 0xADDRESS::module::EventType */
    eventHandle: string;
    /** Callback function when events are received */
    callback: (event: ContractEvent) => void;
}
