/**
 * @movebridge/react - useContract hook
 * Hook for contract interactions
 */

import { useState, useMemo, useCallback } from 'react';
import { useMovementContext } from '../context';
import type { MovementError, ContractInterface } from '@movebridge/core';

/**
 * Return type for useContract hook
 */
export interface UseContractReturn<T = unknown> {
    /** Last operation result */
    data: T | null;
    /** Whether an operation is in progress */
    loading: boolean;
    /** Error if operation failed */
    error: MovementError | null;
    /** Call a view function */
    read: <R = unknown>(functionName: string, args: unknown[], typeArgs?: string[]) => Promise<R>;
    /** Call an entry function */
    write: (functionName: string, args: unknown[], typeArgs?: string[]) => Promise<string>;
    /** Contract interface instance */
    contract: ContractInterface | null;
}

/**
 * Options for useContract hook
 */
export interface UseContractOptions {
    /** Contract address */
    address: string;
    /** Module name */
    module: string;
}

/**
 * Hook for contract interactions
 *
 * @param options - Contract options
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { data, loading, error, read, write } = useContract({
 *     address: '0x123',
 *     module: 'counter',
 *   });
 *
 *   const fetchCount = async () => {
 *     const count = await read('get_count', []);
 *     console.log('Count:', count);
 *   };
 *
 *   const increment = async () => {
 *     const txHash = await write('increment', []);
 *     console.log('Transaction:', txHash);
 *   };
 *
 *   return (
 *     <div>
 *       <p>Count: {data}</p>
 *       <button onClick={fetchCount}>Fetch</button>
 *       <button onClick={increment}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useContract<T = unknown>(options: UseContractOptions): UseContractReturn<T> {
    const { movement, onError } = useMovementContext();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<MovementError | null>(null);

    // Create contract interface
    const contract = useMemo(() => {
        if (!movement) return null;
        return movement.contract(options);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movement, options.address, options.module]);

    // Read (view function)
    const read = useCallback(
        async <R = unknown>(
            functionName: string,
            args: unknown[],
            typeArgs: string[] = []
        ): Promise<R> => {
            if (!contract) {
                throw new Error('Contract not initialized');
            }

            setLoading(true);
            setError(null);

            try {
                const result = await contract.view<R>(functionName, args, typeArgs);
                setData(result as unknown as T);
                return result;
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
        [contract, onError]
    );

    // Write (entry function)
    const write = useCallback(
        async (functionName: string, args: unknown[], typeArgs: string[] = []): Promise<string> => {
            if (!contract) {
                throw new Error('Contract not initialized');
            }

            setLoading(true);
            setError(null);

            try {
                const txHash = await contract.call(functionName, args, typeArgs);
                setData(txHash as unknown as T);
                return txHash;
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
        [contract, onError]
    );

    return {
        data,
        loading,
        error,
        read,
        write,
        contract,
    };
}
