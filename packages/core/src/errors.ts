/**
 * @movebridge/core - Error handling
 */

/**
 * Error codes for MovementError
 */
export type ErrorCode =
    | 'INVALID_ADDRESS'
    | 'WALLET_NOT_FOUND'
    | 'WALLET_CONNECTION_FAILED'
    | 'WALLET_NOT_CONNECTED'
    | 'TRANSACTION_FAILED'
    | 'TRANSACTION_TIMEOUT'
    | 'VIEW_FUNCTION_FAILED'
    | 'INVALID_EVENT_HANDLE'
    | 'NETWORK_ERROR'
    | 'ABI_FETCH_FAILED'
    | 'CODEGEN_FAILED'
    | 'INVALID_ARGUMENT';

/**
 * Error details - flexible record type for error context
 */
export type ErrorDetails = Record<string, unknown>;

/**
 * Custom error class for MoveBridge SDK
 * Provides structured error information with code, message, and details
 */
export class MovementError extends Error {
    public readonly name = 'MovementError';

    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly details?: ErrorDetails
    ) {
        super(message);

        // Maintains proper stack trace for where error was thrown (V8 engines)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MovementError);
        }

        // Set prototype explicitly for instanceof checks
        Object.setPrototypeOf(this, MovementError.prototype);
    }

    /**
     * Serializes the error to a JSON-compatible object
     */
    toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
        };
    }

    /**
     * Creates a string representation of the error
     */
    toString(): string {
        return `${this.name} [${this.code}]: ${this.message}`;
    }
}

/**
 * Factory functions for creating common errors
 */
export const Errors = {
    /**
     * Creates an invalid address error
     */
    invalidAddress(address: string, reason?: string): MovementError {
        return new MovementError(
            `Invalid address: ${address}${reason ? ` - ${reason}` : ''}`,
            'INVALID_ADDRESS',
            { address, reason }
        );
    },

    /**
     * Creates a wallet not found error
     */
    walletNotFound(wallet: string, available: string[]): MovementError {
        return new MovementError(
            `Wallet "${wallet}" not found. Available wallets: ${available.join(', ') || 'none'}`,
            'WALLET_NOT_FOUND',
            { wallet, available }
        );
    },

    /**
     * Creates a wallet connection failed error
     */
    walletConnectionFailed(wallet: string, originalError?: unknown): MovementError {
        const errorMessage = originalError instanceof Error ? originalError.message : String(originalError);
        return new MovementError(
            `Failed to connect to wallet "${wallet}": ${errorMessage}`,
            'WALLET_CONNECTION_FAILED',
            { wallet, originalError }
        );
    },

    /**
     * Creates a wallet not connected error
     */
    walletNotConnected(): MovementError {
        return new MovementError(
            'No wallet connected. Please connect a wallet first.',
            'WALLET_NOT_CONNECTED'
        );
    },

    /**
     * Creates a transaction failed error
     */
    transactionFailed(hash: string, vmStatus: string, gasUsed?: string): MovementError {
        return new MovementError(
            `Transaction ${hash} failed with status: ${vmStatus}`,
            'TRANSACTION_FAILED',
            { hash, vmStatus, gasUsed }
        );
    },

    /**
     * Creates a transaction timeout error
     */
    transactionTimeout(hash: string): MovementError {
        return new MovementError(
            `Transaction ${hash} timed out waiting for confirmation`,
            'TRANSACTION_TIMEOUT',
            { hash }
        );
    },

    /**
     * Creates a view function failed error
     */
    viewFunctionFailed(functionName: string, args: unknown[], originalError?: unknown): MovementError {
        const errorMessage = originalError instanceof Error ? originalError.message : String(originalError);
        return new MovementError(
            `View function "${functionName}" failed: ${errorMessage}`,
            'VIEW_FUNCTION_FAILED',
            { function: functionName, args, originalError }
        );
    },

    /**
     * Creates an invalid event handle error
     */
    invalidEventHandle(eventHandle: string): MovementError {
        return new MovementError(
            `Invalid event handle format: ${eventHandle}`,
            'INVALID_EVENT_HANDLE',
            { eventHandle, expectedFormat: '0xADDRESS::module::EventType' }
        );
    },

    /**
     * Creates a network error
     */
    networkError(url: string, httpStatus?: number, responseBody?: unknown): MovementError {
        return new MovementError(
            `Network request to ${url} failed${httpStatus ? ` with status ${httpStatus}` : ''}`,
            'NETWORK_ERROR',
            { url, httpStatus, responseBody }
        );
    },

    /**
     * Creates an ABI fetch failed error
     */
    abiFetchFailed(address: string, network: string, originalError?: unknown): MovementError {
        const errorMessage = originalError instanceof Error ? originalError.message : String(originalError);
        return new MovementError(
            `Failed to fetch ABI for ${address} on ${network}: ${errorMessage}`,
            'ABI_FETCH_FAILED',
            { address, network, originalError }
        );
    },

    /**
     * Creates a codegen failed error
     */
    codegenFailed(reason: string, abi?: unknown): MovementError {
        return new MovementError(
            `Code generation failed: ${reason}`,
            'CODEGEN_FAILED',
            { reason, abi }
        );
    },

    /**
     * Creates an invalid argument error
     */
    invalidArgument(argument: string, reason: string): MovementError {
        return new MovementError(
            `Invalid argument "${argument}": ${reason}`,
            'INVALID_ARGUMENT',
            { argument, reason }
        );
    },
};

/**
 * Type guard to check if an error is a MovementError
 */
export function isMovementError(error: unknown): error is MovementError {
    return error instanceof MovementError;
}

/**
 * Wraps an unknown error as a MovementError
 */
export function wrapError(error: unknown, code: ErrorCode, context?: string): MovementError {
    if (isMovementError(error)) {
        return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    return new MovementError(
        context ? `${context}: ${message}` : message,
        code,
        { originalError: error }
    );
}
