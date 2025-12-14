/**
 * @movebridge/core - Wallet Manager
 * Handles wallet detection, connection, and state management
 */

import EventEmitter from 'eventemitter3';
import { Errors } from './errors';
import type { WalletType, WalletState, WalletEvents } from './types';

/**
 * Wallet adapter interface (simplified from @pontem/aptos-wallet-adapter)
 */
interface WalletAdapter {
    name: string;
    connect(): Promise<{ address: string; publicKey: string }>;
    disconnect(): Promise<void>;
    signAndSubmitTransaction(payload: unknown): Promise<{ hash: string }>;
    signTransaction(payload: unknown): Promise<Uint8Array>;
    account(): Promise<{ address: string; publicKey: string } | null>;
    network(): Promise<{ name: string; chainId?: string }>;
    onAccountChange(callback: (account: { address: string; publicKey: string } | null) => void): void;
    onNetworkChange(callback: (network: { name: string; chainId?: string }) => void): void;
}

/**
 * Wallet configuration
 */
const WALLET_CONFIG: Record<WalletType, { windowKey: string; displayName: string }> = {
    petra: { windowKey: 'petra', displayName: 'Petra' },
    martian: { windowKey: 'martian', displayName: 'Martian' },
    pontem: { windowKey: 'pontem', displayName: 'Pontem' },
};

/**
 * Storage key for last connected wallet
 */
const STORAGE_KEY = 'movebridge:lastWallet';

/**
 * Wallet Manager
 * Manages wallet connections and state
 *
 * @example
 * ```typescript
 * const walletManager = new WalletManager();
 *
 * // Detect available wallets
 * const wallets = walletManager.detectWallets();
 *
 * // Connect to a wallet
 * await walletManager.connect('petra');
 *
 * // Listen to events
 * walletManager.on('connect', (address) => {
 *   console.log('Connected:', address);
 * });
 * ```
 */
export class WalletManager extends EventEmitter<WalletEvents> {
    private state: WalletState = {
        connected: false,
        address: null,
        publicKey: null,
    };

    private currentWallet: WalletType | null = null;
    private adapter: WalletAdapter | null = null;

    /**
     * Detects available wallets in the browser
     * @returns Array of available wallet types
     */
    detectWallets(): WalletType[] {
        if (typeof window === 'undefined') {
            return [];
        }

        const available: WalletType[] = [];

        for (const [walletType, config] of Object.entries(WALLET_CONFIG)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any)[config.windowKey]) {
                available.push(walletType as WalletType);
            }
        }

        return available;
    }

    /**
     * Connects to a wallet
     * @param wallet - Wallet type to connect
     * @throws MovementError with code WALLET_NOT_FOUND if wallet is not installed
     * @throws MovementError with code WALLET_CONNECTION_FAILED if connection fails
     */
    async connect(wallet: WalletType): Promise<void> {
        const available = this.detectWallets();

        if (!available.includes(wallet)) {
            throw Errors.walletNotFound(wallet, available);
        }

        try {
            const config = WALLET_CONFIG[wallet];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.adapter = (window as any)[config.windowKey] as WalletAdapter;

            const result = await this.adapter.connect();

            this.state = {
                connected: true,
                address: result.address,
                publicKey: result.publicKey,
            };

            this.currentWallet = wallet;

            // Store last connected wallet
            this.saveLastWallet(wallet);

            // Set up event listeners
            this.setupEventListeners();

            this.emit('connect', result.address);
        } catch (error) {
            this.adapter = null;
            throw Errors.walletConnectionFailed(wallet, error);
        }
    }

    /**
     * Disconnects from the current wallet
     */
    async disconnect(): Promise<void> {
        if (this.adapter) {
            try {
                await this.adapter.disconnect();
            } catch {
                // Ignore disconnect errors
            }
        }

        this.state = {
            connected: false,
            address: null,
            publicKey: null,
        };

        this.currentWallet = null;
        this.adapter = null;

        // Clear stored wallet
        this.clearLastWallet();

        this.emit('disconnect');
    }

    /**
     * Gets the current wallet state
     * @returns Current wallet state
     */
    getState(): WalletState {
        return { ...this.state };
    }

    /**
     * Gets the currently connected wallet type
     * @returns Current wallet type or null
     */
    getWallet(): WalletType | null {
        return this.currentWallet;
    }

    /**
     * Gets the wallet adapter for signing
     * @returns Wallet adapter or null
     * @internal
     */
    getAdapter(): WalletAdapter | null {
        return this.adapter;
    }

    /**
     * Attempts to auto-connect to the last used wallet
     * @returns Promise that resolves when auto-connect completes
     */
    async autoConnect(): Promise<void> {
        const lastWallet = this.getLastWallet();

        if (!lastWallet) {
            return;
        }

        const available = this.detectWallets();

        if (available.includes(lastWallet)) {
            try {
                await this.connect(lastWallet);
            } catch {
                // Silently fail auto-connect
                this.clearLastWallet();
            }
        }
    }

    /**
     * Sets up event listeners for wallet changes
     */
    private setupEventListeners(): void {
        if (!this.adapter) return;

        this.adapter.onAccountChange((account) => {
            if (account) {
                this.state = {
                    connected: true,
                    address: account.address,
                    publicKey: account.publicKey,
                };
                this.emit('accountChanged', account.address);
            } else {
                this.state = {
                    connected: false,
                    address: null,
                    publicKey: null,
                };
                this.emit('disconnect');
            }
        });

        this.adapter.onNetworkChange((network) => {
            this.emit('networkChanged', network.name);
        });
    }

    /**
     * Saves the last connected wallet to storage
     */
    private saveLastWallet(wallet: WalletType): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, wallet);
            }
        } catch {
            // Ignore storage errors
        }
    }

    /**
     * Gets the last connected wallet from storage
     */
    private getLastWallet(): WalletType | null {
        try {
            if (typeof localStorage !== 'undefined') {
                const wallet = localStorage.getItem(STORAGE_KEY);
                if (wallet && Object.keys(WALLET_CONFIG).includes(wallet)) {
                    return wallet as WalletType;
                }
            }
        } catch {
            // Ignore storage errors
        }
        return null;
    }

    /**
     * Clears the last connected wallet from storage
     */
    private clearLastWallet(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // Ignore storage errors
        }
    }
}
