/**
 * @movebridge/react - WalletModal component
 * Modal for wallet selection
 */

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
 * Wallet display info - Wallets that support Movement Network
 */
const WALLET_INFO: Record<WalletType, { name: string; icon: string; description: string }> = {
    petra: {
        name: 'Petra',
        icon: '🦊',
        description: 'Recommended for Movement'
    },
    pontem: {
        name: 'Pontem',
        icon: '🌉',
        description: 'Multi-chain with Movement support'
    },
    nightly: {
        name: 'Nightly',
        icon: '🌙',
        description: 'Movement & Aptos wallet'
    },
};

/**
 * WalletModal component
 * Displays available wallets for selection
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

    if (!open) return null;

    const handleConnect = async (wallet: WalletType) => {
        try {
            await connect(wallet);
            onClose();
        } catch {
            // Error handled by provider
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

    const emptyStyles: React.CSSProperties = {
        textAlign: 'center',
        color: '#6b7280',
        padding: '20px',
    };

    return (
        <div style={overlayStyles} onClick={onClose}>
            <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
                <div style={headerStyles}>
                    <h2 style={titleStyles}>Connect Wallet</h2>
                    <button style={closeButtonStyles} onClick={onClose}>
                        ×
                    </button>
                </div>

                {wallets.length === 0 ? (
                    <div style={emptyStyles}>
                        <p style={{ marginBottom: '12px' }}>No wallets detected.</p>
                        <p style={{ marginBottom: '16px' }}>
                            Install a wallet that supports <strong>Movement Network</strong>:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <a
                                href="https://petra.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}
                            >
                                🦊 Get Petra (Recommended)
                            </a>
                            <a
                                href="https://pontem.network/pontem-wallet"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    backgroundColor: '#6366f1',
                                    color: 'white',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '14px',
                                }}
                            >
                                🌉 Get Pontem
                            </a>
                        </div>
                    </div>
                ) : (
                    <div>
                        {wallets.map((wallet) => (
                            <button
                                key={wallet}
                                style={walletButtonStyles}
                                onClick={() => handleConnect(wallet)}
                                disabled={connecting}
                            >
                                <span style={{ fontSize: '24px' }}>{WALLET_INFO[wallet].icon}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div>{WALLET_INFO[wallet].name}</div>
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
