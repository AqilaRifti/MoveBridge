/**
 * @movebridge/core - Wallet Manager
 * Handles wallet detection, connection, and state management
 * Uses Aptos Wallet Standard (AIP-62) for wallet interactions
 */

import EventEmitter from 'eventemitter3';
import { getAptosWallets } from '@aptos-labs/wallet-standard';
import { Errors } from './errors';
import type { WalletType, WalletState, WalletEvents } from './types';

/**
 * AIP-62 Transaction Payload format
 */
interface AIP62TransactionPayload {
    payload: {
        function: string;
        typeArguments: string[];
        functionArguments: unknown[];
    };
}

/**
 * Unified wallet adapter interface
 * Abstracts different wallet implementations into a common interface
 */
export interface UnifiedWalletAdapter {
    name: string;
    icon: string;
    connect(): Promise<{ address: string; publicKey: string }>;
    disconnect(): Promise<void>;
    signAndSubmitTransaction(payload: AIP62TransactionPayload): Promise<{ hash: string }>;
    signTransaction(payload: AIP62TransactionPayload): Promise<Uint8Array>;
    onAccountChange(cb: (account: { address: string; publicKey: string } | null) => void): void;
    onNetworkChange(cb: (network: string) => void): void;
}

const SUPPORTED_WALLETS: Record<string, WalletType> = {
    'razor': 'razor',
    'razor wallet': 'razor',
    'razorwallet': 'razor',
    'nightly': 'nightly',
    'nightly wallet': 'nightly',
    'okx': 'okx',
    'okx wallet': 'okx',
    'okxwallet': 'okx',
};

const STORAGE_KEY = 'movebridge:lastWallet';

/**
 * Normalizes any hash format to a 0x-prefixed hex string
 * Handles: string, Uint8Array, objects with toString()
 */
function normalizeHash(data: unknown): string {
    if (typeof data === 'string') {
        // Already a string - ensure 0x prefix
        return data.startsWith('0x') ? data : `0x${data}`;
    }
    if (data instanceof Uint8Array) {
        return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Handle objects with hash property
    if (data && typeof data === 'object' && 'hash' in data) {
        return normalizeHash((data as { hash: unknown }).hash);
    }
    // Handle objects with toString
    if (data && typeof (data as { toString?: () => string }).toString === 'function') {
        const str = (data as { toString: () => string }).toString();
        return str.startsWith('0x') ? str : `0x${str}`;
    }
    return String(data);
}

/**
 * Converts address/publicKey to hex string format
 */
function toHexString(data: unknown): string {
    if (typeof data === 'string') return data;
    if (data instanceof Uint8Array) {
        return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (data && typeof (data as { toString?: () => string }).toString === 'function') {
        return (data as { toString: () => string }).toString();
    }
    return String(data);
}

/**
 * Extracts result from AIP-62 UserResponse format
 * Handles both direct results and { status, args } format
 */
function extractUserResponse<T>(response: unknown): T {
    if (!response) {
        throw new Error('Empty response from wallet');
    }

    const resp = response as { status?: string; args?: T };

    // Check for rejection
    if (resp.status === 'rejected') {
        throw new Error('User rejected the request');
    }

    // Extract from UserResponse format if present
    if (resp.args !== undefined) {
        return resp.args;
    }

    // Direct result
    return response as T;
}

/**
 * Creates a unified adapter from an AIP-62 standard wallet
 */
function createStandardAdapter(wallet: {
    name: string;
    icon?: string;
    features?: Record<string, unknown>;
}): UnifiedWalletAdapter {
    const features = wallet.features || {};
    const connectFeature = features['aptos:connect'] as { connect: () => Promise<unknown> } | undefined;
    const disconnectFeature = features['aptos:disconnect'] as { disconnect: () => Promise<void> } | undefined;
    const signTxFeature = features['aptos:signAndSubmitTransaction'] as {
        signAndSubmitTransaction: (payload: unknown) => Promise<unknown>
    } | undefined;
    const signOnlyFeature = features['aptos:signTransaction'] as {
        signTransaction: (payload: unknown) => Promise<unknown>
    } | undefined;
    const accountChangeFeature = features['aptos:onAccountChange'] as {
        onAccountChange: (cb: (account: unknown) => void) => void
    } | undefined;
    const networkChangeFeature = features['aptos:onNetworkChange'] as {
        onNetworkChange: (cb: (network: unknown) => void) => void
    } | undefined;

    return {
        name: wallet.name,
        icon: wallet.icon || '',

        async connect() {
            if (!connectFeature) {
                throw new Error('Wallet does not support connect');
            }

            const response = await connectFeature.connect();
            const result = extractUserResponse<{ address: unknown; publicKey: unknown }>(response);

            return {
                address: toHexString(result.address),
                publicKey: toHexString(result.publicKey),
            };
        },

        async disconnect() {
            if (disconnectFeature) {
                await disconnectFeature.disconnect();
            }
        },

        async signAndSubmitTransaction(payload: AIP62TransactionPayload) {
            if (!signTxFeature) {
                throw new Error('Wallet does not support signAndSubmitTransaction');
            }

            const response = await signTxFeature.signAndSubmitTransaction(payload);
            const result = extractUserResponse<{ hash?: unknown } | unknown>(response);

            // Handle various response formats
            let hash: string;
            if (result && typeof result === 'object' && 'hash' in result) {
                hash = normalizeHash((result as { hash: unknown }).hash);
            } else {
                hash = normalizeHash(result);
            }

            return { hash };
        },

        async signTransaction(payload: AIP62TransactionPayload) {
            if (!signOnlyFeature) {
                throw new Error('Wallet does not support signTransaction');
            }

            const response = await signOnlyFeature.signTransaction(payload);
            const result = extractUserResponse<{ authenticator?: Uint8Array; signature?: Uint8Array } | Uint8Array>(response);

            // Handle various response formats
            if (result instanceof Uint8Array) {
                return result;
            }
            if (result && typeof result === 'object') {
                if ('authenticator' in result && result.authenticator) {
                    return result.authenticator;
                }
                if ('signature' in result && result.signature) {
                    return result.signature;
                }
            }
            return new Uint8Array();
        },

        onAccountChange(cb) {
            if (accountChangeFeature) {
                accountChangeFeature.onAccountChange((account: unknown) => {
                    if (account && typeof account === 'object') {
                        const acc = account as { address?: unknown; publicKey?: unknown };
                        cb({
                            address: toHexString(acc.address),
                            publicKey: toHexString(acc.publicKey),
                        });
                    } else {
                        cb(null);
                    }
                });
            }
        },

        onNetworkChange(cb) {
            if (networkChangeFeature) {
                networkChangeFeature.onNetworkChange((network: unknown) => {
                    if (network && typeof network === 'object' && 'name' in network) {
                        cb((network as { name: string }).name);
                    } else {
                        cb(String(network));
                    }
                });
            }
        },
    };
}


/**
 * Wallet Manager
 * Manages wallet detection, connection, and state
 * 
 * @example
 * ```typescript
 * const walletManager = new WalletManager();
 * 
 * // Detect available wallets
 * const wallets = walletManager.detectWallets();
 * 
 * // Connect to a wallet
 * await walletManager.connect('razor');
 * 
 * // Get current state
 * const state = walletManager.getState();
 * console.log(state.address);
 * 
 * // Disconnect
 * await walletManager.disconnect();
 * ```
 */
export class WalletManager extends EventEmitter<WalletEvents> {
    private state: WalletState = { connected: false, address: null, publicKey: null };
    private currentWallet: WalletType | null = null;
    private adapter: UnifiedWalletAdapter | null = null;
    private standardWallets: Map<WalletType, { name: string; icon?: string; features?: Record<string, unknown> }> = new Map();
    private detectedWallets: WalletType[] = [];
    private unsubscribe: (() => void) | null = null;

    /**
     * Detects available wallets using AIP-62 standard
     * @returns Array of detected wallet types
     */
    detectWallets(): WalletType[] {
        if (typeof window === 'undefined') return [];

        const available = new Set<WalletType>();
        this.standardWallets.clear();

        try {
            const { aptosWallets, on } = getAptosWallets();

            // Clean up previous listener
            if (this.unsubscribe) {
                this.unsubscribe();
            }

            // Listen for new wallet registrations
            this.unsubscribe = on('register', () => this.detectWallets());

            for (const wallet of aptosWallets) {
                const normalizedName = wallet.name.toLowerCase();
                const walletType = SUPPORTED_WALLETS[normalizedName];

                if (walletType) {
                    available.add(walletType);
                    this.standardWallets.set(walletType, wallet as { name: string; icon?: string; features?: Record<string, unknown> });
                }
            }
        } catch (error) {
            console.warn('Failed to detect wallets via AIP-62 standard:', error);
        }

        this.detectedWallets = Array.from(available);
        return this.detectedWallets;
    }

    /**
     * Gets detailed wallet information for UI display
     * @returns Array of wallet info objects
     */
    getWalletInfo(): Array<{ type: WalletType; name: string; icon: string }> {
        return this.detectedWallets.map(type => {
            const wallet = this.standardWallets.get(type);
            return {
                type,
                name: wallet?.name || type,
                icon: wallet?.icon || '',
            };
        });
    }

    /**
     * Connects to a wallet
     * @param wallet - Wallet type to connect to
     * @throws MovementError if wallet not found or connection fails
     */
    async connect(wallet: WalletType): Promise<void> {
        const available = this.detectWallets();

        if (!available.includes(wallet)) {
            throw Errors.walletNotFound(wallet, available);
        }

        try {
            const standardWallet = this.standardWallets.get(wallet);
            if (!standardWallet) {
                throw new Error(`Wallet ${wallet} not found`);
            }

            this.adapter = createStandardAdapter(standardWallet);
            const result = await this.adapter.connect();

            this.state = {
                connected: true,
                address: result.address,
                publicKey: result.publicKey,
            };
            this.currentWallet = wallet;

            this.saveLastWallet(wallet);
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

        this.state = { connected: false, address: null, publicKey: null };
        this.currentWallet = null;
        this.adapter = null;
        this.clearLastWallet();
        this.emit('disconnect');
    }

    /**
     * Gets the current wallet state
     */
    getState(): WalletState {
        return { ...this.state };
    }

    /**
     * Gets the currently connected wallet type
     */
    getWallet(): WalletType | null {
        return this.currentWallet;
    }

    /**
     * Gets the wallet adapter for direct access
     * @internal
     */
    getAdapter(): UnifiedWalletAdapter | null {
        return this.adapter;
    }

    /**
     * Attempts to auto-connect to the last used wallet
     */
    async autoConnect(): Promise<void> {
        const lastWallet = this.getLastWallet();
        if (!lastWallet) return;

        const available = this.detectWallets();
        if (available.includes(lastWallet)) {
            try {
                await this.connect(lastWallet);
            } catch {
                this.clearLastWallet();
            }
        }
    }

    /**
     * Cleans up resources
     */
    destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

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
                this.state = { connected: false, address: null, publicKey: null };
                this.emit('disconnect');
            }
        });

        this.adapter.onNetworkChange((network) => {
            this.emit('networkChanged', network);
        });
    }

    private saveLastWallet(wallet: WalletType): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, wallet);
            }
        } catch {
            // Ignore storage errors
        }
    }

    private getLastWallet(): WalletType | null {
        try {
            if (typeof localStorage !== 'undefined') {
                const wallet = localStorage.getItem(STORAGE_KEY);
                if (wallet && Object.values(SUPPORTED_WALLETS).includes(wallet as WalletType)) {
                    return wallet as WalletType;
                }
            }
        } catch {
            // Ignore storage errors
        }
        return null;
    }

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
