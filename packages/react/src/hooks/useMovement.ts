/**
 * @movebridge/react - useMovement hook
 * Hook for wallet connection state
 */

import { useMovementContext } from '../context';
import type { WalletType } from '@movebridge/core';

/**
 * Return type for useMovement hook
 */
export interface UseMovementReturn {
    /** Connected wallet address */
    address: string | null;
    /** Whether a wallet is connected */
    connected: boolean;
    /** Whether a connection is in progress */
    connecting: boolean;
    /** Connect to a wallet */
    connect: (wallet: WalletType) => Promise<void>;
    /** Disconnect from wallet */
    disconnect: () => Promise<void>;
    /** Available wallets */
    wallets: WalletType[];
    /** Currently connected wallet */
    wallet: WalletType | null;
}

/**
 * Hook for wallet connection state
 *
 * @example
 * ```tsx
 * function WalletButton() {
 *   const { address, connected, connect, disconnect, wallets } = useMovement();
 *
 *   if (connected) {
 *     return (
 *       <button onClick={disconnect}>
 *         {address?.slice(0, 6)}...{address?.slice(-4)}
 *       </button>
 *     );
 *   }
 *
 *   return (
 *     <button onClick={() => connect(wallets[0])}>
 *       Connect Wallet
 *     </button>
 *   );
 * }
 * ```
 */
export function useMovement(): UseMovementReturn {
    const { address, connected, connecting, connect, disconnect, wallets, wallet } =
        useMovementContext();

    return {
        address,
        connected,
        connecting,
        connect,
        disconnect,
        wallets,
        wallet,
    };
}
