/**
 * @movebridge/react
 * React hooks and components for Movement Network
 *
 * @packageDocumentation
 */

// Provider
export { MovementProvider, MovementContext, useMovementContext } from './context';
export type { MovementProviderProps, MovementContextValue } from './context';

// Hooks
export {
    useMovement,
    useBalance,
    useContract,
    useTransaction,
    useWaitForTransaction,
} from './hooks';
export type {
    UseMovementReturn,
    UseBalanceReturn,
    UseContractReturn,
    UseContractOptions,
    UseTransactionReturn,
    UseWaitForTransactionReturn,
    UseWaitForTransactionOptions,
} from './hooks';

// Components
export { WalletButton, WalletModal, AddressDisplay, NetworkSwitcher } from './components';
export type {
    WalletButtonProps,
    WalletModalProps,
    AddressDisplayProps,
    NetworkSwitcherProps,
} from './components';

// Re-export core types for convenience
export type {
    NetworkType,
    WalletType,
    MovementError,
    TransactionResponse,
    ContractEvent,
} from '@movebridge/core';
