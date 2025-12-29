/**
 * @movebridge/core - Wallet Manager
 * Handles wallet detection, connection, and state management
 * Uses Aptos Wallet Standard (AIP-62) for wallet interactions
 */

import EventEmitter from 'eventemitter3';
import { getAptosWallets } from '@aptos-labs/wallet-standard';
import { Errors } from './errors';
import type { WalletType, WalletState, WalletEvents } from './types';

interface UnifiedWalletAdapter {
    name: string;
    icon: string;
    connect(): Promise<{ address: string; publicKey: string }>;
    disconnect(): Promise<void>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signAndSubmitTransaction(payload: any): Promise<{ hash: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signTransaction(payload: any): Promise<Uint8Array>;
    onAccountChange(cb: (account: { address: string; publicKey: string } | null) => void): void;
    onNetworkChange(cb: (network: string) => void): void;
}

const SUPPORTED_WALLETS: Record<string, WalletType> = {
    'petra': 'petra',
    'petra wallet': 'petra',
    'pontem': 'pontem',
    'pontem wallet': 'pontem',
    'nightly': 'nightly',
    'nightly wallet': 'nightly',
};

const STORAGE_KEY = 'movebridge:lastWallet';

function toHexString(data: unknown): string {
    if (typeof data === 'string') return data;
    if (data instanceof Uint8Array) {
        return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data && typeof (data as any).toString === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any).toString();
    }
    return String(data);
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createStandardAdapter(wallet: any): UnifiedWalletAdapter {
    const connectFeature = wallet.features?.['aptos:connect'];
    const disconnectFeature = wallet.features?.['aptos:disconnect'];
    const signTxFeature = wallet.features?.['aptos:signAndSubmitTransaction'];
    const signOnlyFeature = wallet.features?.['aptos:signTransaction'];
    const accountChangeFeature = wallet.features?.['aptos:onAccountChange'];
    const networkChangeFeature = wallet.features?.['aptos:onNetworkChange'];

    return {
        name: wallet.name,
        icon: wallet.icon || '',
        async connect() {
            if (!connectFeature) throw new Error('Wallet does not support connect');
            const response = await connectFeature.connect();
            // Handle UserResponse - could be { status, args } or direct result
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = response?.args ?? response;
            if (response?.status === 'rejected') {
                throw new Error('User rejected the connection');
            }
            return {
                address: toHexString(result.address),
                publicKey: toHexString(result.publicKey),
            };
        },
        async disconnect() {
            if (disconnectFeature) await disconnectFeature.disconnect();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async signAndSubmitTransaction(payload: any) {
            if (!signTxFeature) throw new Error('Wallet does not support signAndSubmitTransaction');
            const response = await signTxFeature.signAndSubmitTransaction(payload);
            if (response?.status === 'rejected') {
                throw new Error('User rejected the transaction');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = response?.args ?? response;
            return { hash: result.hash || toHexString(result) };
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async signTransaction(payload: any) {
            if (!signOnlyFeature) throw new Error('Wallet does not support signTransaction');
            const response = await signOnlyFeature.signTransaction(payload);
            if (response?.status === 'rejected') {
                throw new Error('User rejected the transaction');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = response?.args ?? response;
            return result.authenticator || result.signature || new Uint8Array();
        },
        onAccountChange(cb) {
            if (accountChangeFeature) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                accountChangeFeature.onAccountChange((account: any) => {
                    if (account) {
                        cb({ address: toHexString(account.address), publicKey: toHexString(account.publicKey) });
                    } else {
                        cb(null);
                    }
                });
            }
        },
        onNetworkChange(cb) {
            if (networkChangeFeature) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                networkChangeFeature.onNetworkChange((network: any) => {
                    cb(network?.name || String(network));
                });
            }
        },
    };
}


export class WalletManager extends EventEmitter<WalletEvents> {
    private state: WalletState = { connected: false, address: null, publicKey: null };
    private currentWallet: WalletType | null = null;
    private adapter: UnifiedWalletAdapter | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private standardWallets: Map<WalletType, any> = new Map();
    private detectedWallets: WalletType[] = [];
    private unsubscribe: (() => void) | null = null;

    detectWallets(): WalletType[] {
        if (typeof window === 'undefined') return [];
        const available = new Set<WalletType>();
        this.standardWallets.clear();
        try {
            const { aptosWallets, on } = getAptosWallets();
            if (this.unsubscribe) this.unsubscribe();
            this.unsubscribe = on('register', () => this.detectWallets());
            for (const wallet of aptosWallets) {
                const normalizedName = wallet.name.toLowerCase();
                const walletType = SUPPORTED_WALLETS[normalizedName];
                if (walletType) {
                    available.add(walletType);
                    this.standardWallets.set(walletType, wallet);
                }
            }
        } catch (error) {
            console.warn('Failed to detect wallets via AIP-62 standard:', error);
        }
        this.detectedWallets = Array.from(available);
        return this.detectedWallets;
    }

    getWalletInfo(): Array<{ type: WalletType; name: string; icon: string }> {
        return this.detectedWallets.map(type => {
            const wallet = this.standardWallets.get(type);
            return { type, name: wallet?.name || type, icon: wallet?.icon || '' };
        });
    }

    async connect(wallet: WalletType): Promise<void> {
        const available = this.detectWallets();
        if (!available.includes(wallet)) throw Errors.walletNotFound(wallet, available);
        try {
            const standardWallet = this.standardWallets.get(wallet);
            if (!standardWallet) throw new Error(`Wallet ${wallet} not found`);
            this.adapter = createStandardAdapter(standardWallet);
            const result = await this.adapter.connect();
            this.state = { connected: true, address: result.address, publicKey: result.publicKey };
            this.currentWallet = wallet;
            this.saveLastWallet(wallet);
            this.setupEventListeners();
            this.emit('connect', result.address);
        } catch (error) {
            this.adapter = null;
            throw Errors.walletConnectionFailed(wallet, error);
        }
    }

    async disconnect(): Promise<void> {
        if (this.adapter) {
            try { await this.adapter.disconnect(); } catch { /* ignore */ }
        }
        this.state = { connected: false, address: null, publicKey: null };
        this.currentWallet = null;
        this.adapter = null;
        this.clearLastWallet();
        this.emit('disconnect');
    }

    getState(): WalletState { return { ...this.state }; }
    getWallet(): WalletType | null { return this.currentWallet; }
    getAdapter(): UnifiedWalletAdapter | null { return this.adapter; }

    async autoConnect(): Promise<void> {
        const lastWallet = this.getLastWallet();
        if (!lastWallet) return;
        const available = this.detectWallets();
        if (available.includes(lastWallet)) {
            try { await this.connect(lastWallet); } catch { this.clearLastWallet(); }
        }
    }

    destroy(): void {
        if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
    }

    private setupEventListeners(): void {
        if (!this.adapter) return;
        this.adapter.onAccountChange((account) => {
            if (account) {
                this.state = { connected: true, address: account.address, publicKey: account.publicKey };
                this.emit('accountChanged', account.address);
            } else {
                this.state = { connected: false, address: null, publicKey: null };
                this.emit('disconnect');
            }
        });
        this.adapter.onNetworkChange((network) => this.emit('networkChanged', network));
    }

    private saveLastWallet(wallet: WalletType): void {
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, wallet); } catch { /* ignore */ }
    }

    private getLastWallet(): WalletType | null {
        try {
            if (typeof localStorage !== 'undefined') {
                const wallet = localStorage.getItem(STORAGE_KEY);
                if (wallet && Object.values(SUPPORTED_WALLETS).includes(wallet as WalletType)) {
                    return wallet as WalletType;
                }
            }
        } catch { /* ignore */ }
        return null;
    }

    private clearLastWallet(): void {
        try { if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
}
