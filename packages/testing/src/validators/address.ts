/**
 * @movebridge/testing - Address validation utilities
 */

import { MovementError } from '@movebridge/core';
import type { AddressValidationResult } from '../types';

/**
 * Regular expression for valid Movement/Aptos addresses
 * Addresses are 1-64 hex characters, optionally prefixed with '0x' or '0X'
 */
const ADDRESS_REGEX = /^(0[xX])?[a-fA-F0-9]{1,64}$/;

/**
 * Checks if a string is a valid Movement/Aptos address
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
    if (typeof address !== 'string') {
        return false;
    }
    return ADDRESS_REGEX.test(address);
}

/**
 * Validates an address and throws if invalid
 * @param address - The address to validate
 * @throws MovementError with code 'INVALID_ADDRESS' if invalid
 */
export function validateAddress(address: string): void {
    const result = getAddressValidationDetails(address);
    if (!result.valid) {
        throw new MovementError(
            `Invalid address: ${address} - ${result.error}`,
            'INVALID_ADDRESS',
            { address, reason: result.error }
        );
    }
}

/**
 * Normalizes an address to lowercase with '0x' prefix
 * @param address - The address to normalize
 * @returns Normalized address
 * @throws MovementError if address is invalid
 */
export function normalizeAddress(address: string): string {
    validateAddress(address);

    // Remove 0x prefix if present, then add it back
    const withoutPrefix = address.startsWith('0x') || address.startsWith('0X')
        ? address.slice(2)
        : address;

    // Pad to 64 characters if needed
    const padded = withoutPrefix.padStart(64, '0');

    return `0x${padded.toLowerCase()}`;
}

/**
 * Gets detailed validation information for an address
 * @param address - The address to validate
 * @returns Validation result with details
 */
export function getAddressValidationDetails(address: string): AddressValidationResult {
    if (typeof address !== 'string') {
        return {
            valid: false,
            error: 'Address must be a string',
        };
    }

    if (address.length === 0) {
        return {
            valid: false,
            error: 'Address cannot be empty',
        };
    }

    // Check for 0x prefix
    const hasPrefix = address.startsWith('0x') || address.startsWith('0X');
    const hexPart = hasPrefix ? address.slice(2) : address;

    // Check length (1-64 hex characters)
    if (hexPart.length === 0) {
        return {
            valid: false,
            error: 'Address must contain hex characters after 0x prefix',
        };
    }

    if (hexPart.length > 64) {
        return {
            valid: false,
            error: `Address too long: ${hexPart.length} hex characters (max 64)`,
        };
    }

    // Check for valid hex characters
    if (!/^[a-fA-F0-9]+$/.test(hexPart)) {
        return {
            valid: false,
            error: 'Address contains invalid characters (must be hex: 0-9, a-f, A-F)',
        };
    }

    // Valid address
    const normalized = `0x${hexPart.padStart(64, '0').toLowerCase()}`;
    return {
        valid: true,
        normalized,
    };
}
