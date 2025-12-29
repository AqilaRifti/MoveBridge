/**
 * @movebridge/testing - Type definitions
 */

import type {
    Resource,
    Transaction,
    TransactionResponse,
    TransactionPayload,
    ContractEvent,
    WalletState,
    MovementError,
} from '@movebridge/core';

// ============================================================================
// Test Harness Types
// ============================================================================

/** Configuration for test harness */
export interface TestHarnessConfig {
    /** Seed for deterministic random data generation */
    seed?: number;
    /** Network to simulate */
    network?: 'mainnet' | 'testnet';
    /** Default latency in milliseconds for mock responses */
    defaultLatency?: number;
}

/** Test harness instance */
export interface TestHarness {
    /** Mocked Movement client */
    readonly client: MockMovementClient;
    /** Call tracker for assertions */
    readonly tracker: CallTracker;
    /** Network simulator for latency/errors */
    readonly simulator: NetworkSimulator;
    /** Response faker for generating test data */
    readonly faker: ResponseFaker;
    /** Cleanup all state */
    cleanup(): void;
    /** Reset to initial state (keeps configuration) */
    reset(): void;
}

// ============================================================================
// Mock Client Types
// ============================================================================

/** Mock configuration for a method */
export interface MockConfig<T> {
    response?: T;
    error?: MovementError;
    once?: boolean;
}

/** Mock Movement client interface */
export interface MockMovementClient {
    // Mock configuration methods
    mockResponse<T>(method: string, response: T): void;
    mockError(method: string, error: MovementError): void;
    mockResponseOnce<T>(method: string, response: T): void;
    clearMocks(): void;

    // Standard Movement client methods (mocked)
    getAccountBalance(address: string): Promise<string>;
    getAccountResources(address: string): Promise<Resource[]>;
    getTransaction(hash: string): Promise<Transaction>;
    waitForTransaction(hash: string): Promise<TransactionResponse>;
}

// ============================================================================
// Validator Types
// ============================================================================

/** Result of address validation */
export interface AddressValidationResult {
    valid: boolean;
    normalized?: string;
    error?: string;
}

/** Address validator interface */
export interface AddressValidator {
    isValidAddress(address: string): boolean;
    validateAddress(address: string): void;
    normalizeAddress(address: string): string;
    getValidationDetails(address: string): AddressValidationResult;
}

/** Transaction validator interface */
export interface TransactionValidator {
    validateTransferPayload(payload: {
        to: string;
        amount: string;
        coinType?: string;
    }): boolean;
    validateEntryFunctionPayload(payload: {
        function: string;
        typeArguments: string[];
        arguments: unknown[];
    }): boolean;
    validatePayload(payload: TransactionPayload): boolean;
}

/** Validation error details */
export interface ValidationError {
    path: string;
    expected: string;
    received: string;
    message: string;
}

/** Schema names for validation */
export type SchemaName =
    | 'Resource'
    | 'Transaction'
    | 'TransactionResponse'
    | 'WalletState'
    | 'ContractEvent'
    | string;

/** Schema validator interface */
export interface SchemaValidator {
    validateSchema(data: unknown, schemaName: SchemaName): boolean;
    getValidationErrors(data: unknown, schemaName: SchemaName): ValidationError[];
    registerSchema(name: string, schema: unknown): void;
    hasSchema(name: string): boolean;
}

// ============================================================================
// Faker Types
// ============================================================================

/** Options for creating a faker */
export interface FakerOptions {
    seed?: number;
}

/** Options for generating fake balance */
export interface BalanceOptions {
    min?: string;
    max?: string;
}

/** Response faker interface */
export interface ResponseFaker {
    fakeAddress(): string;
    fakeBalance(options?: BalanceOptions): string;
    fakeTransaction(): Transaction;
    fakeTransactionResponse(success?: boolean): TransactionResponse;
    fakeResource(type: string): Resource;
    fakeEvent(type: string): ContractEvent;
    fakeWalletState(connected?: boolean): WalletState;
    fakeTransactionHash(): string;
}

// ============================================================================
// Network Simulator Types
// ============================================================================

/** Network simulator interface */
export interface NetworkSimulator {
    simulateLatency(ms: number): void;
    simulateTimeout(method: string): void;
    simulateNetworkError(): void;
    simulateRateLimit(maxCalls: number): void;
    resetSimulation(): void;

    // Internal state access for testing
    getLatency(): number;
    isNetworkErrorEnabled(): boolean;
    isMethodTimedOut(method: string): boolean;
    getRateLimitRemaining(): number | null;
    incrementRateLimitCalls(): void;
}

// ============================================================================
// Call Tracker Types
// ============================================================================

/** Record of a method call */
export interface CallRecord {
    method: string;
    arguments: unknown[];
    timestamp: number;
    result: unknown | undefined;
    error: Error | undefined;
}

/** Call tracker interface */
export interface CallTracker {
    // Recording
    recordCall(method: string, args: unknown[], result?: unknown, error?: Error): void;

    // Retrieval
    getCalls(method: string): CallRecord[];
    getCallCount(method: string): number;
    getAllCalls(): CallRecord[];

    // Assertions
    assertCalled(method: string): void;
    assertCalledTimes(method: string, times: number): void;
    assertCalledWith(method: string, ...args: unknown[]): void;
    assertNotCalled(method: string): void;

    // Reset
    clearCalls(): void;
}

// ============================================================================
// Snapshot Types
// ============================================================================

/** Result of snapshot comparison */
export interface SnapshotResult {
    match: boolean;
    diff?: string;
}

/** Snapshot utilities interface */
export interface SnapshotUtils {
    createSnapshot(data: unknown, name: string): void;
    matchSnapshot(data: unknown, name: string): SnapshotResult;
    updateSnapshot(data: unknown, name: string): void;
    deleteSnapshot(name: string): void;
    listSnapshots(): string[];
}

// ============================================================================
// Integration Test Types
// ============================================================================

/** Test account for integration testing */
export interface TestAccount {
    address: string;
    privateKey: string;
    publicKey: string;
}

/** Integration test utilities interface */
export interface IntegrationUtils {
    createTestAccount(): Promise<TestAccount>;
    waitForFunding(address: string, timeout?: number): Promise<string>;
    cleanupTestAccount(account: TestAccount): Promise<void>;
    withTestAccount<T>(callback: (account: TestAccount) => Promise<T>): Promise<T>;
}
