/**
 * @movebridge/testing
 * Testing utilities for MoveBridge SDK
 *
 * @packageDocumentation
 */

// Test Harness
export { createTestHarness } from './harness';

// Validators
export {
    isValidAddress,
    validateAddress,
    normalizeAddress,
    getAddressValidationDetails,
} from './validators/address';

export {
    validateTransferPayload,
    validateEntryFunctionPayload,
    validatePayload,
} from './validators/transaction';

export {
    validateSchema,
    getValidationErrors,
    registerSchema,
    hasSchema,
    PREDEFINED_SCHEMAS,
} from './validators/schema';

// Faker
export { createFaker } from './faker';

// Network Simulator
export { createNetworkSimulator } from './simulator';

// Call Tracker
export { createCallTracker } from './tracker';

// Snapshot Utils
export { createSnapshotUtils } from './snapshots';

// Integration Utils
export { createIntegrationUtils } from './integration';

// Mock Client
export { createMockClient } from './mock-client';

// Types
export type {
    TestHarnessConfig,
    TestHarness,
    MockConfig,
    MockMovementClient,
    AddressValidationResult,
    AddressValidator,
    TransactionValidator,
    ValidationError,
    SchemaName,
    SchemaValidator,
    FakerOptions,
    BalanceOptions,
    ResponseFaker,
    NetworkSimulator,
    CallRecord,
    CallTracker,
    SnapshotResult,
    SnapshotUtils,
    TestAccount,
    IntegrationUtils,
} from './types';
