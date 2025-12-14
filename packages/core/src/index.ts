/**
 * @movebridge/core
 * Core SDK for Movement Network
 *
 * @packageDocumentation
 */

// Main client
export { Movement } from './client';
export type { ResolvedConfig } from './client';

// Configuration
export {
    NETWORK_CONFIG,
    DEFAULT_COIN_TYPE,
    resolveConfig,
    isValidAddress,
    isValidEventHandle,
    getExplorerTxUrl,
    getExplorerAccountUrl,
} from './config';

// Error handling
export {
    MovementError,
    Errors,
    isMovementError,
    wrapError,
    type ErrorCode,
    type ErrorDetails,
} from './errors';

// Wallet management
export { WalletManager } from './wallet';

// Transaction building
export { TransactionBuilder } from './transaction';

// Contract interface
export { ContractInterface } from './contract';

// Event listening
export { EventListener } from './events';

// Types
export type {
    NetworkType,
    WalletType,
    MovementConfig,
    NetworkConfig,
    Resource,
    Transaction,
    TransactionResponse,
    TransactionPayload,
    SignedTransaction,
    ContractEvent,
    WalletState,
    WalletEvents,
    TransferOptions,
    BuildOptions,
    ContractOptions,
    EventSubscription,
} from './types';
