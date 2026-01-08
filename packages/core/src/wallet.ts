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
 * Handles: string, Uint8Array, objects with toString(), nested hash objects
 * Supports various wallet response formats including OKX, Nightly, and Razor
 */
function normalizeHash(data: unknown): string {
    // Handle null/undefined
    if (data === null || data === undefined) {
        throw new Error('Invalid hash: received null or undefined');
    }

    // Handle string format
    if (typeof data === 'string') {
        const trimmed = data.trim();
        if (!trimmed) {
            throw new Error('Invalid hash: received empty string');
        }
        // Ensure 0x prefix
        return trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
    }

    // Handle Uint8Array format
    if (data instanceof Uint8Array) {
        if (data.length === 0) {
            throw new Error('Invalid hash: received empty Uint8Array');
        }
        return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Handle ArrayBuffer
    if (data instanceof ArrayBuffer) {
        const arr = new Uint8Array(data);
        if (arr.length === 0) {
            throw new Error('Invalid hash: received empty ArrayBuffer');
        }
        return '0x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Handle objects
    if (data && typeof data === 'object') {
        // Check for hash property (common in wallet responses)
        if ('hash' in data) {
            return normalizeHash((data as { hash: unknown }).hash);
        }

        // Check for txnHash property (some wallets use this)
        if ('txnHash' in data) {
            return normalizeHash((data as { txnHash: unknown }).txnHash);
        }

        // Check for transactionHash property
        if ('transactionHash' in data) {
            return normalizeHash((data as { transactionHash: unknown }).transactionHash);
        }

        // Check for output property (OKX specific)
        if ('output' in data) {
            return normalizeHash((data as { output: unknown }).output);
        }

        // Handle objects with toString method (like AccountAddress)
        if (typeof (data as { toString?: () => string }).toString === 'function') {
            const str = (data as { toString: () => string }).toString();
            // Avoid [object Object]
            if (str !== '[object Object]') {
                return str.startsWith('0x') ? str : `0x${str}`;
            }
        }
    }

    // Last resort: convert to string
    const strValue = String(data);
    if (strValue === '[object Object]' || !strValue) {
        throw new Error('Invalid hash: could not extract hash from response');
    }
    return strValue.startsWith('0x') ? strValue : `0x${strValue}`;
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
 * Supports various wallet response formats including OKX, Nightly, and Razor
 */
function extractUserResponse<T>(response: unknown): T {
    if (!response) {
        throw new Error('Empty response from wallet');
    }

    // Handle primitive types directly
    if (typeof response === 'string' || typeof response === 'number') {
        return response as T;
    }

    // Handle Uint8Array directly
    if (response instanceof Uint8Array) {
        return response as T;
    }

    const resp = response as Record<string, unknown>;

    // Check for rejection status
    if (resp.status === 'rejected' || resp.status === 'Rejected') {
        throw new Error('User rejected the request');
    }

    // Check for error status
    if (resp.status === 'error' || resp.error) {
        const errorMsg = resp.error || resp.message || 'Transaction failed';
        throw new Error(String(errorMsg));
    }

    // Extract from UserResponse format if present (AIP-62 standard)
    if (resp.args !== undefined) {
        return resp.args as T;
    }

    // Handle OKX-specific response format
    // OKX may return { status: 'approved', output: { hash: '...' } }
    if (resp.status === 'approved' && resp.output !== undefined) {
        return resp.output as T;
    }

    // Handle response with result property
    if (resp.result !== undefined) {
        return resp.result as T;
    }

    // Handle response with data property
    if (resp.data !== undefined) {
        return resp.data as T;
    }

    // Direct result - return as-is
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

            // Determine wallet name for format selection
            const walletName = wallet.name.toLowerCase();
            const isOKX = walletName.includes('okx');

            // OKX wallet may need legacy format, others use AIP-62 format
            // Try to send in the format the wallet expects
            let txPayload: unknown;

            if (isOKX) {
                // OKX may expect legacy entry_function_payload format
                // Try both formats - first the legacy format for OKX
                txPayload = {
                    type: 'entry_function_payload',
                    function: payload.payload.function,
                    type_arguments: payload.payload.typeArguments,
                    arguments: payload.payload.functionArguments,
                };
            } else {
                // Standard AIP-62 format for other wallets
                txPayload = payload;
            }

            let response: unknown;
            try {
                response = await signTxFeature.signAndSubmitTransaction(txPayload);
            } catch (firstError) {
                // If OKX format failed, try AIP-62 format
                // If AIP-62 format failed, try legacy format
                if (isOKX) {
                    // OKX legacy format failed, try AIP-62
                    try {
                        response = await signTxFeature.signAndSubmitTransaction(payload);
                    } catch {
                        // Both formats failed, throw original error
                        throw firstError;
                    }
                } else {
                    // AIP-62 format failed for non-OKX wallet, try legacy format
                    try {
                        const legacyPayload = {
                            type: 'entry_function_payload',
                            function: payload.payload.function,
                            type_arguments: payload.payload.typeArguments,
                            arguments: payload.payload.functionArguments,
                        };
                        response = await signTxFeature.signAndSubmitTransaction(legacyPayload);
                    } catch {
                        // Both formats failed, throw original error
                        throw firstError;
                    }
                }
            }

            // First extract from UserResponse wrapper if present
            const result = extractUserResponse<unknown>(response);

            // Now normalize the hash from various possible formats
            try {
                // If result is already a string (direct hash)
                if (typeof result === 'string') {
                    return { hash: normalizeHash(result) };
                }

                // If result is an object, try to extract hash
                if (result && typeof result === 'object') {
                    // Try common hash property names
                    const hashObj = result as Record<string, unknown>;

                    if (hashObj.hash !== undefined) {
                        return { hash: normalizeHash(hashObj.hash) };
                    }
                    if (hashObj.txnHash !== undefined) {
                        return { hash: normalizeHash(hashObj.txnHash) };
                    }
                    if (hashObj.transactionHash !== undefined) {
                        return { hash: normalizeHash(hashObj.transactionHash) };
                    }

                    // OKX may return the hash directly in the result
                    // Try to normalize the entire result
                    return { hash: normalizeHash(result) };
                }

                // Fallback: try to normalize whatever we got
                return { hash: normalizeHash(result) };
            } catch (error) {
                // Provide more context in the error
                throw new Error(
                    `Failed to extract transaction hash from wallet response: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
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
