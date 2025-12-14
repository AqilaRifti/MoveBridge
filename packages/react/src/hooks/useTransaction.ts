/**
 * @movebridge/react - useTransaction hook
 * Hook for transaction submission
 */

import { useState, useCallback } from 'react';
import { useMovementContext } from '../context';
import type { MovementError, BuildOptions } from '@movebridge/core';

/**
 * Return type for useTransaction hook
 */
export interface UseTransactionReturn {
    /** Send a transaction */
    send: (options: BuildOptions) => Promise<string>;
    /** Last transaction hash */
    data: string | null;
    /** Whether transaction is in progress */
    loading: boolean;
    /** Error if transaction failed */
    error: MovementError | null;
    /** Reset state */
    reset: () => void;
}

/**
 * Hook for transaction submission
 *
 * @example
 * ```tsx
 * function TransferForm() {
 *   const { send, data, loading, error, reset } = useTransaction();
 *
 *   const handleTransfer = async () => {
 *     try {
 *       const hash = await send({
 *         function: '0x1::coin::transfer',
 *         typeArguments: ['0x1::aptos_coin::AptosCoin'],
 *         arguments: ['0x123...', '1000000'],
 *       });
 *       console.log('Transaction hash:', hash);
 *     } catch (err) {
 *       console.error('Transaction failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleTransfer} disabled={loading}>
 *         {loading ? 'Sending...' : 'Send'}
 *       </button>
 *       {data && <p>Transaction: {data}</p>}
 *       {error && <p>Error: {error.message}</p>}
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTransaction(): UseTransactionReturn {
    const { movement, onError } = useMovementContext();
    const [data, setData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<MovementError | null>(null);

    const send = useCallback(
        async (options: BuildOptions): Promise<string> => {
            if (!movement) {
                throw new Error('Movement SDK not initialized');
            }

            setLoading(true);
            setError(null);

            try {
                const payload = await movement.transaction.build(options);
                const hash = await movement.transaction.signAndSubmit(payload);
                setData(hash);
                return hash;
            } catch (err) {
                const movementError = err as MovementError;
                setError(movementError);
                if (onError) {
                    onError(movementError);
                }
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [movement, onError]
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return {
        send,
        data,
        loading,
        error,
        reset,
    };
}
