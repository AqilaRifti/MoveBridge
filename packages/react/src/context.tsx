/**
 * @movebridge/react - Movement Context
 * React context for Movement SDK
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
    Movement,
    MovementError,
    type NetworkType,
    type WalletType,
    type WalletState,
} from '@movebridge/core';

/**
 * Movement context value
 */
export interface MovementContextValue {
    /** Movement SDK instance */
    movement: Movement | null;
    /** Current network */
    network: NetworkType;
    /** Wallet state */
    address: string | null;
    connected: boolean;
    connecting: boolean;
    /** Available wallets */
    wallets: WalletType[];
    /** Currently connected wallet */
    wallet: WalletType | null;
    /** Connect to a wallet */
    connect: (wallet: WalletType) => Promise<void>;
    /** Disconnect from wallet */
    disconnect: () => Promise<void>;
    /** Error handler */
    onError?: (error: MovementError) => void;
}

/**
 * Movement context
 */
export const MovementContext = createContext<MovementContextValue | null>(null);

/**
 * Provider props
 */
export interface MovementProviderProps {
    /** Network to connect to */
    network: NetworkType;
    /** Auto-connect to previously connected wallet */
    autoConnect?: boolean;
    /** Error callback */
    onError?: (error: MovementError) => void;
    /** Children */
    children: ReactNode;
}

/**
 * Movement Provider
 * Provides Movement SDK context to child components
 *
 * @example
 * ```tsx
 * import { MovementProvider } from '@movebridge/react';
 *
 * function App() {
 *   return (
 *     <MovementProvider network="testnet" autoConnect>
 *       <YourApp />
 *     </MovementProvider>
 *   );
 * }
 * ```
 */
export function MovementProvider({
    network,
    autoConnect = false,
    onError,
    children,
}: MovementProviderProps) {
    const [movement, setMovement] = useState<Movement | null>(null);
    const [walletState, setWalletState] = useState<WalletState>({
        connected: false,
        address: null,
        publicKey: null,
    });
    const [connecting, setConnecting] = useState(false);
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [currentWallet, setCurrentWallet] = useState<WalletType | null>(null);

    // Initialize Movement SDK
    useEffect(() => {
        const sdk = new Movement({
            network,
            autoConnect,
        });

        setMovement(sdk);

        // Detect available wallets
        const detected = sdk.wallet.detectWallets();
        setWallets(detected);

        // Set up event listeners
        const handleConnect = (address: string) => {
            setWalletState((prev) => ({
                ...prev,
                connected: true,
                address,
            }));
            setConnecting(false);
        };

        const handleDisconnect = () => {
            setWalletState({
                connected: false,
                address: null,
                publicKey: null,
            });
            setCurrentWallet(null);
        };

        const handleAccountChanged = (newAddress: string) => {
            setWalletState((prev) => ({
                ...prev,
                address: newAddress,
            }));
        };

        sdk.wallet.on('connect', handleConnect);
        sdk.wallet.on('disconnect', handleDisconnect);
        sdk.wallet.on('accountChanged', handleAccountChanged);

        // Check if already connected (from autoConnect)
        const state = sdk.wallet.getState();
        if (state.connected) {
            setWalletState(state);
            setCurrentWallet(sdk.wallet.getWallet());
        }

        return () => {
            sdk.wallet.off('connect', handleConnect);
            sdk.wallet.off('disconnect', handleDisconnect);
            sdk.wallet.off('accountChanged', handleAccountChanged);
            sdk.events.unsubscribeAll();
        };
    }, [network, autoConnect]);

    // Connect to wallet
    const connect = useCallback(
        async (wallet: WalletType) => {
            if (!movement) return;

            setConnecting(true);

            try {
                await movement.wallet.connect(wallet);
                setCurrentWallet(wallet);
            } catch (error) {
                setConnecting(false);
                if (error instanceof MovementError && onError) {
                    onError(error);
                }
                throw error;
            }
        },
        [movement, onError]
    );

    // Disconnect from wallet
    const disconnect = useCallback(async () => {
        if (!movement) return;

        try {
            await movement.wallet.disconnect();
        } catch (error) {
            if (error instanceof MovementError && onError) {
                onError(error);
            }
            throw error;
        }
    }, [movement, onError]);

    const value: MovementContextValue = {
        movement,
        network,
        address: walletState.address,
        connected: walletState.connected,
        connecting,
        wallets,
        wallet: currentWallet,
        connect,
        disconnect,
        ...(onError && { onError }),
    };

    return <MovementContext.Provider value={value}>{children}</MovementContext.Provider>;
}

/**
 * Hook to access Movement context
 * @throws Error if used outside MovementProvider
 */
export function useMovementContext(): MovementContextValue {
    const context = useContext(MovementContext);

    if (!context) {
        throw new Error('useMovementContext must be used within a MovementProvider');
    }

    return context;
}
