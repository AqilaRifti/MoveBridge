/**
 * @movebridge/react - WalletModal component
 * Modal for wallet selection with Razor, Nightly, and OKX wallet support
 */

import { useState } from 'react';
import { useMovement } from '../hooks/useMovement';
import type { WalletType } from '@movebridge/core';

/**
 * Props for WalletModal component
 */
export interface WalletModalProps {
    /** Whether modal is open */
    open: boolean;
    /** Callback when modal should close */
    onClose: () => void;
}

/**
 * Wallet display info with install URLs - Wallets that support Movement Network
 */
const WALLET_INFO: Record<WalletType, {
    name: string;
    icon: string;
    description: string;
    installUrl: string;
}> = {
    razor: {
        name: 'Razor Wallet',
        icon: '⚡',
        description: 'Secure wallet for Movement',
        installUrl: 'https://razorwallet.xyz/'
    },
    nightly: {
        name: 'Nightly',
        icon: '🌙',
        description: 'Multi-chain Movement wallet',
        installUrl: 'https://nightly.app/'
    },
    okx: {
        name: 'OKX Wallet',
        icon: '🔷',
        description: 'OKX Web3 wallet',
        installUrl: 'https://www.okx.com/web3'
    },
};

/**
 * WalletModal component
 * Displays available wallets for selection with improved UX
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <button onClick={() => setOpen(true)}>Connect</button>
 * <WalletModal open={open} onClose={() => setOpen(false)} />
 * ```
 */
export function WalletModal({ open, onClose }: WalletModalProps) {
    const { wallets, connect, connecting } = useMovement();
    const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);

    if (!open) return null;

    const handleConnect = async (wallet: WalletType) => {
        setConnectingWallet(wallet);
        try {
            await connect(wallet);
            onClose();
        } catch {
            // Error handled by provider
        } finally {
            setConnectingWallet(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const overlayStyles: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const modalStyles: React.CSSProperties = {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '320px',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    };

    const headerStyles: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    };

    const titleStyles: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 600,
        margin: 0,
    };

    const closeButtonStyles: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '4px',
        lineHeight: 1,
    };

    const walletButtonStyles: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
    };

    const walletButtonDisabledStyles: React.CSSProperties = {
        ...walletButtonStyles,
        opacity: 0.6,
        cursor: 'not-allowed',
    };

    const walletButtonConnectingStyles: React.CSSProperties = {
        ...walletButtonStyles,
        backgroundColor: '#f3f4f6',
        borderColor: '#6366f1',
    };

    const emptyStyles: React.CSSProperties = {
        textAlign: 'center',
        color: '#6b7280',
        padding: '20px',
    };

    const installLinkStyles: React.CSSProperties = {
        display: 'inline-block',
        padding: '10px 16px',
        backgroundColor: '#6366f1',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'background-color 0.2s ease',
    };

    const getButtonStyle = (wallet: WalletType) => {
        if (connectingWallet === wallet) return walletButtonConnectingStyles;
        if (connecting) return walletButtonDisabledStyles;
        return walletButtonStyles;
    };

    return (
        <div
            style={overlayStyles}
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-modal-title"
        >
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyles}>
                    <h2 id="wallet-modal-title" style={titleStyles}>Connect Wallet</h2>
                    <button
                        style={closeButtonStyles}
                        onClick={onClose}
                        aria-label="Close wallet modal"
                    >
                        ×
                    </button>
                </div>

                {wallets.length === 0 ? (
                    <div style={emptyStyles}>
                        <p style={{ marginBottom: '12px' }}>No wallets detected.</p>
                        <p style={{ marginBottom: '16px' }}>
                            Install a wallet that supports <strong>Movement Network</strong>:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <a
                                href={WALLET_INFO.razor.installUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={installLinkStyles}
                                aria-label="Install Razor Wallet"
                            >
                                {WALLET_INFO.razor.icon} Get {WALLET_INFO.razor.name}
                            </a>
                            <a
                                href={WALLET_INFO.nightly.installUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={installLinkStyles}
                                aria-label="Install Nightly Wallet"
                            >
                                {WALLET_INFO.nightly.icon} Get {WALLET_INFO.nightly.name}
                            </a>
                            <a
                                href={WALLET_INFO.okx.installUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={installLinkStyles}
                                aria-label="Install OKX Wallet"
                            >
                                {WALLET_INFO.okx.icon} Get {WALLET_INFO.okx.name}
                            </a>
                        </div>
                    </div>
                ) : (
                    <div role="list" aria-label="Available wallets">
                        {wallets.map((wallet) => (
                            <button
                                key={wallet}
                                style={getButtonStyle(wallet)}
                                onClick={() => handleConnect(wallet)}
                                disabled={connecting}
                                role="listitem"
                                aria-label={`Connect to ${WALLET_INFO[wallet].name}`}
                            >
                                <span style={{ fontSize: '24px' }} aria-hidden="true">
                                    {connectingWallet === wallet ? '⏳' : WALLET_INFO[wallet].icon}
                                </span>
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 500 }}>
                                        {WALLET_INFO[wallet].name}
                                        {connectingWallet === wallet && (
                                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6366f1' }}>
                                                Connecting...
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {WALLET_INFO[wallet].description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
