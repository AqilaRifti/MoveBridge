/**
 * @movebridge/react - AddressDisplay component
 * Displays an address with truncation and copy functionality
 */

import { useState, useCallback } from 'react';

/**
 * Props for AddressDisplay component
 */
export interface AddressDisplayProps {
    /** Address to display */
    address: string;
    /** Whether to truncate the address */
    truncate?: boolean;
    /** Whether to show copy button */
    copyable?: boolean;
    /** Additional CSS class */
    className?: string;
}

/**
 * Truncates an address for display
 */
function truncateAddress(address: string, startChars = 6, endChars = 4): string {
    if (address.length <= startChars + endChars + 3) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * AddressDisplay component
 * Shows an address with optional truncation and copy-to-clipboard
 *
 * @example
 * ```tsx
 * <AddressDisplay address="0x123..." />
 * <AddressDisplay address="0x123..." truncate copyable />
 * ```
 */
export function AddressDisplay({
    address,
    truncate = true,
    copyable = true,
    className = '',
}: AddressDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API not available
        }
    }, [address]);

    const displayAddress = truncate ? truncateAddress(address) : address;

    const containerStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
    };

    const addressStyles: React.CSSProperties = {
        backgroundColor: '#f3f4f6',
        padding: '4px 8px',
        borderRadius: '4px',
    };

    const buttonStyles: React.CSSProperties = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        fontSize: '14px',
        color: copied ? '#10b981' : '#6b7280',
    };

    return (
        <span className={className} style={containerStyles} title={address}>
            <span style={addressStyles}>{displayAddress}</span>
            {copyable && (
                <button style={buttonStyles} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy address'}>
                    {copied ? '✓' : '📋'}
                </button>
            )}
        </span>
    );
}
