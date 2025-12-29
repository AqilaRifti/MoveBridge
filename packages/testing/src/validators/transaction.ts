/**
 * @movebridge/testing - Transaction validation utilities
 */

import { MovementError } from '@movebridge/core';
import type { TransactionPayload } from '@movebridge/core';
import { isValidAddress } from './address';

/**
 * Regular expression for valid function identifiers
 * Format: 0xADDRESS::module::function
 */
const FUNCTION_REGEX = /^0x[a-fA-F0-9]{1,64}::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Validates a transfer payload
 * @param payload - Transfer payload to validate
 * @returns true if valid
 * @throws MovementError if invalid
 */
export function validateTransferPayload(payload: {
    to: string;
    amount: string;
    coinType?: string;
}): boolean {
    // Validate 'to' address
    if (!isValidAddress(payload.to)) {
        throw new MovementError(
            `Invalid recipient address: ${payload.to}`,
            'INVALID_ADDRESS',
            { address: payload.to, field: 'to' }
        );
    }

    // Validate amount
    validateAmount(payload.amount);

    // Validate coinType if provided
    if (payload.coinType !== undefined) {
        if (typeof payload.coinType !== 'string' || payload.coinType.length === 0) {
            throw new MovementError(
                'Invalid coin type: must be a non-empty string',
                'INVALID_ARGUMENT',
                { argument: 'coinType', value: payload.coinType }
            );
        }
    }

    return true;
}

/**
 * Validates an entry function payload
 * @param payload - Entry function payload to validate
 * @returns true if valid
 * @throws MovementError if invalid
 */
export function validateEntryFunctionPayload(payload: {
    function: string;
    typeArguments: string[];
    arguments: unknown[];
}): boolean {
    // Validate function identifier
    if (!FUNCTION_REGEX.test(payload.function)) {
        throw new MovementError(
            `Invalid function identifier: ${payload.function}`,
            'INVALID_ARGUMENT',
            {
                argument: 'function',
                value: payload.function,
                expectedFormat: '0xADDRESS::module::function',
            }
        );
    }

    // Validate typeArguments is an array
    if (!Array.isArray(payload.typeArguments)) {
        throw new MovementError(
            'typeArguments must be an array',
            'INVALID_ARGUMENT',
            { argument: 'typeArguments', value: payload.typeArguments }
        );
    }

    // Validate each type argument is a string
    for (let i = 0; i < payload.typeArguments.length; i++) {
        if (typeof payload.typeArguments[i] !== 'string') {
            throw new MovementError(
                `typeArguments[${i}] must be a string`,
                'INVALID_ARGUMENT',
                { argument: `typeArguments[${i}]`, value: payload.typeArguments[i] }
            );
        }
    }

    // Validate arguments is an array
    if (!Array.isArray(payload.arguments)) {
        throw new MovementError(
            'arguments must be an array',
            'INVALID_ARGUMENT',
            { argument: 'arguments', value: payload.arguments }
        );
    }

    return true;
}

/**
 * Validates a transaction payload (polymorphic)
 * @param payload - Transaction payload to validate
 * @returns true if valid
 * @throws MovementError if invalid
 */
export function validatePayload(payload: TransactionPayload): boolean {
    if (!payload || typeof payload !== 'object') {
        throw new MovementError(
            'Payload must be an object',
            'INVALID_ARGUMENT',
            { argument: 'payload', value: payload }
        );
    }

    if (payload.type !== 'entry_function_payload') {
        throw new MovementError(
            `Unsupported payload type: ${payload.type}`,
            'INVALID_ARGUMENT',
            { argument: 'type', value: payload.type, supported: ['entry_function_payload'] }
        );
    }

    return validateEntryFunctionPayload({
        function: payload.function,
        typeArguments: payload.typeArguments,
        arguments: payload.arguments,
    });
}

/**
 * Validates an amount string
 * @param amount - Amount to validate
 * @throws MovementError if invalid
 */
function validateAmount(amount: string): void {
    if (typeof amount !== 'string') {
        throw new MovementError(
            'Amount must be a string',
            'INVALID_ARGUMENT',
            { argument: 'amount', value: amount }
        );
    }

    // Check if it's a valid number string
    const numValue = Number(amount);

    if (isNaN(numValue)) {
        throw new MovementError(
            `Invalid amount: "${amount}" is not a valid number`,
            'INVALID_ARGUMENT',
            { argument: 'amount', value: amount, reason: 'not a number' }
        );
    }

    if (numValue < 0) {
        throw new MovementError(
            `Invalid amount: "${amount}" cannot be negative`,
            'INVALID_ARGUMENT',
            { argument: 'amount', value: amount, reason: 'negative value' }
        );
    }

    if (numValue === 0) {
        throw new MovementError(
            `Invalid amount: "${amount}" cannot be zero`,
            'INVALID_ARGUMENT',
            { argument: 'amount', value: amount, reason: 'zero value' }
        );
    }

    // Check for valid integer (no decimals for blockchain amounts)
    if (!Number.isInteger(numValue)) {
        throw new MovementError(
            `Invalid amount: "${amount}" must be a whole number (no decimals)`,
            'INVALID_ARGUMENT',
            { argument: 'amount', value: amount, reason: 'contains decimals' }
        );
    }
}
