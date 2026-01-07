/**
 * @movebridge/testing - Response faker for generating test data
 */

import type {
    Resource,
    Transaction,
    TransactionResponse,
    ContractEvent,
    WalletState,
} from '@movebridge/core';
import type { FakerOptions, BalanceOptions, ResponseFaker } from './types';

/**
 * Simple seeded random number generator (Mulberry32)
 */
class SeededRandom {
    private state: number;

    constructor(seed: number) {
        this.state = seed;
    }

    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    nextBigInt(min: bigint, max: bigint): bigint {
        const range = max - min + 1n;
        const randomFraction = this.next();
        return min + BigInt(Math.floor(Number(range) * randomFraction));
    }

    pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length - 1)]!;
    }
}

/**
 * Creates a response faker with optional seeding
 * @param options - Faker options including seed
 * @returns ResponseFaker instance
 */
export function createFaker(options?: FakerOptions): ResponseFaker {
    const seed = options?.seed ?? Date.now();
    const random = new SeededRandom(seed);

    /**
     * Generates a random hex string of specified length
     */
    function randomHex(length: number): string {
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars[random.nextInt(0, 15)];
        }
        return result;
    }

    /**
     * Generates a random timestamp within the last 24 hours
     */
    function randomTimestamp(): string {
        const now = Date.now();
        const dayAgo = now - 24 * 60 * 60 * 1000;
        return String(random.nextInt(dayAgo, now) * 1000); // microseconds
    }

    /**
     * Generates a random sequence number
     */
    function randomSequenceNumber(): string {
        return String(random.nextInt(0, 1000000));
    }

    return {
        /**
         * Generates a valid random Movement address
         */
        fakeAddress(): string {
            return `0x${randomHex(64)}`;
        },

        /**
         * Generates a random balance within optional bounds
         */
        fakeBalance(options?: BalanceOptions): string {
            const min = options?.min ? BigInt(options.min) : 0n;
            const max = options?.max ? BigInt(options.max) : 10000000000n; // 100 MOVE
            return random.nextBigInt(min, max).toString();
        },

        /**
         * Generates a complete fake transaction
         */
        fakeTransaction(): Transaction {
            return {
                hash: `0x${randomHex(64)}`,
                sender: `0x${randomHex(64)}`,
                sequenceNumber: randomSequenceNumber(),
                payload: {
                    function: `0x${randomHex(64)}::module::function`,
                    typeArguments: [],
                    functionArguments: [],
                },
                timestamp: randomTimestamp(),
            };
        },

        /**
         * Generates a fake transaction response
         */
        fakeTransactionResponse(success = true): TransactionResponse {
            return {
                hash: `0x${randomHex(64)}`,
                success,
                vmStatus: success ? 'Executed successfully' : 'Move abort',
                gasUsed: String(random.nextInt(100, 10000)),
                events: [],
            };
        },

        /**
         * Generates a fake resource with specified type
         */
        fakeResource(type: string): Resource {
            return {
                type,
                data: {
                    value: String(random.nextInt(0, 1000000)),
                },
            };
        },

        /**
         * Generates a fake contract event with specified type
         */
        fakeEvent(type: string): ContractEvent {
            return {
                type,
                sequenceNumber: randomSequenceNumber(),
                data: {
                    value: String(random.nextInt(0, 1000000)),
                },
            };
        },

        /**
         * Generates a fake wallet state
         */
        fakeWalletState(connected = false): WalletState {
            if (connected) {
                return {
                    connected: true,
                    address: `0x${randomHex(64)}`,
                    publicKey: `0x${randomHex(64)}`,
                };
            }
            return {
                connected: false,
                address: null,
                publicKey: null,
            };
        },

        /**
         * Generates a fake transaction hash
         */
        fakeTransactionHash(): string {
            return `0x${randomHex(64)}`;
        },
    };
}
