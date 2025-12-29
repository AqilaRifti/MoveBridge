---
sidebar_position: 4
---

# @movebridge/testing

Comprehensive testing utilities for MoveBridge SDK applications.

## Installation

```bash
npm install -D @movebridge/testing
```

## Overview

`@movebridge/testing` provides:

- **Test Harness** - Unified test setup with all utilities
- **Mock Client** - Mock Movement client for unit tests
- **Faker** - Generate deterministic fake data
- **Validators** - Validate addresses, transactions, schemas
- **Network Simulator** - Simulate latency, errors, rate limits
- **Call Tracker** - Track and assert on method calls

## Quick Start

```typescript
import { createTestHarness } from '@movebridge/testing';

// Create a test harness
const harness = createTestHarness({ seed: 12345 });

// Configure mock responses
harness.client.mockResponse('getAccountBalance', '1000000000');

// Use the mocked client
const balance = await harness.client.getAccountBalance('0x1');

// Assert on calls
harness.tracker.assertCalled('getAccountBalance');
harness.tracker.assertCalledWith('getAccountBalance', ['0x1']);

// Cleanup after test
harness.cleanup();
```

## Test Harness

The test harness bundles all testing utilities:

```typescript
import { createTestHarness } from '@movebridge/testing';

const harness = createTestHarness({
  seed?: number,          // Random seed for reproducibility
  defaultLatency?: number, // Default latency in ms
});

// Access components
harness.client;    // MockMovementClient
harness.tracker;   // CallTracker
harness.simulator; // NetworkSimulator
harness.faker;     // ResponseFaker

// Lifecycle methods
harness.cleanup(); // Reset all state
harness.reset();   // Reset without clearing simulator config
```

## Mock Client

Mock the Movement client for unit tests:

```typescript
const harness = createTestHarness();

// Mock a successful response
harness.client.mockResponse('getAccountBalance', '1000000000');

// Mock an error
import { Errors } from '@movebridge/core';
harness.client.mockError('getAccountBalance', Errors.networkError('http://...'));

// Mock once (for sequential calls)
harness.client.mockResponseOnce('getAccountBalance', '500');
harness.client.mockResponseOnce('getAccountBalance', '600');

// Clear all mocks
harness.client.clearMocks();
```

### Available Mock Methods

```typescript
interface MockMovementClient {
  getAccountBalance(address: string): Promise<string>;
  getAccountResources(address: string): Promise<Resource[]>;
  getTransaction(hash: string): Promise<Transaction>;
  waitForTransaction(hash: string): Promise<TransactionResponse>;
  
  mockResponse<T>(method: string, response: T): void;
  mockError(method: string, error: MovementError): void;
  mockResponseOnce<T>(method: string, response: T): void;
  clearMocks(): void;
}
```

## Faker

Generate deterministic fake data:

```typescript
import { createFaker } from '@movebridge/testing';

const faker = createFaker({ seed: 42 }); // Seed for reproducibility

// Generate fake data
const address = faker.fakeAddress();
// '0x1a2b3c...' (64 hex chars)

const balance = faker.fakeBalance({ min: '0', max: '1000000000' });
// '523847291'

const tx = faker.fakeTransaction();
// { hash, sender, sequenceNumber, payload, timestamp }

const response = faker.fakeTransactionResponse(true); // success = true
// { hash, success, vmStatus, gasUsed, events }

const resource = faker.fakeResource('0x1::coin::CoinStore<...>');
// { type, data: { value: '...' } }

const event = faker.fakeEvent('0x1::coin::DepositEvent');
// { type, sequenceNumber, data }

const walletState = faker.fakeWalletState(true); // connected = true
// { connected, address, publicKey }

const txHash = faker.fakeTransactionHash();
// '0x...' (64 hex chars)
```

## Validators

Validate data structures:

### Address Validation

```typescript
import { isValidAddress, validateAddress, normalizeAddress } from '@movebridge/testing';

// Check if valid
isValidAddress('0x1'); // true
isValidAddress('invalid'); // false

// Validate with details
const result = validateAddress('0x1');
// { valid: true, normalized: '0x0000...0001' }

// Normalize address
const normalized = normalizeAddress('0x1');
// '0x0000000000000000000000000000000000000000000000000000000000000001'
```

### Transaction Validation

```typescript
import { validateTransferPayload, validateEntryFunctionPayload } from '@movebridge/testing';

// Validate transfer payload
const errors = validateTransferPayload({
  to: '0x123...',
  amount: '1000000',
});
// [] if valid, or array of error messages

// Validate entry function payload
const errors = validateEntryFunctionPayload({
  function: '0x1::coin::transfer',
  typeArguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: ['0x123...', '1000000'],
});
```

### Schema Validation

```typescript
import { validateSchema, registerSchema, PREDEFINED_SCHEMAS } from '@movebridge/testing';

// Validate against predefined schema
validateSchema(data, 'Resource'); // throws if invalid

// Register custom schema
registerSchema('MyType', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    value: { type: 'number' },
  },
  required: ['id', 'value'],
});

// Validate against custom schema
validateSchema(data, 'MyType');
```

## Network Simulator

Simulate network conditions:

```typescript
import { createNetworkSimulator } from '@movebridge/testing';

const simulator = createNetworkSimulator();

// Add latency to all calls
simulator.simulateLatency(100); // 100ms delay

// Simulate timeout for specific method
simulator.simulateTimeout('getAccountBalance');

// Simulate network errors
simulator.simulateNetworkError();

// Simulate rate limiting
simulator.simulateRateLimit(5); // Error after 5 calls

// Reset all simulation
simulator.resetSimulation();

// Check current state
simulator.getLatency(); // 100
simulator.isNetworkErrorEnabled(); // true/false
simulator.isMethodTimedOut('getAccountBalance'); // true/false
simulator.getRateLimitRemaining(); // 3 (or null if no limit)
```

## Call Tracker

Track and assert on method calls:

```typescript
import { createCallTracker } from '@movebridge/testing';

const tracker = createCallTracker();

// Record a call (done automatically by mock client)
tracker.recordCall('getAccountBalance', ['0x1'], '1000000000');

// Assert methods
tracker.assertCalled('getAccountBalance');
tracker.assertCalledWith('getAccountBalance', ['0x1']);
tracker.assertCalledTimes('getAccountBalance', 1);
tracker.assertNotCalled('getTransaction');

// Get call history
const calls = tracker.getCalls('getAccountBalance');
// [{ method, args, result, error, timestamp }]

// Clear history
tracker.clearCalls();
```

## Complete Test Example

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestHarness } from '@movebridge/testing';

describe('MyComponent', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness({ seed: 12345 });
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('should fetch balance', async () => {
    // Arrange
    harness.client.mockResponse('getAccountBalance', '1000000000');

    // Act
    const balance = await harness.client.getAccountBalance('0x1');

    // Assert
    expect(balance).toBe('1000000000');
    harness.tracker.assertCalled('getAccountBalance');
    harness.tracker.assertCalledWith('getAccountBalance', ['0x1']);
  });

  it('should handle network errors', async () => {
    // Arrange
    harness.simulator.simulateNetworkError();

    // Act & Assert
    await expect(
      harness.client.getAccountBalance('0x1')
    ).rejects.toThrow('Network error');
  });

  it('should handle latency', async () => {
    // Arrange
    harness.simulator.simulateLatency(100);
    harness.client.mockResponse('getAccountBalance', '1000');

    // Act
    const start = Date.now();
    await harness.client.getAccountBalance('0x1');
    const duration = Date.now() - start;

    // Assert
    expect(duration).toBeGreaterThanOrEqual(100);
  });
});
```

## Exports

```typescript
// Test Harness
export { createTestHarness } from './harness';

// Validators
export { isValidAddress, validateAddress, normalizeAddress } from './validators/address';
export { validateTransferPayload, validateEntryFunctionPayload } from './validators/transaction';
export { validateSchema, registerSchema, PREDEFINED_SCHEMAS } from './validators/schema';

// Utilities
export { createFaker } from './faker';
export { createNetworkSimulator } from './simulator';
export { createCallTracker } from './tracker';
export { createMockClient } from './mock-client';
export { createSnapshotUtils } from './snapshots';
export { createIntegrationUtils } from './integration';

// Types
export type {
  TestHarness,
  TestHarnessConfig,
  MockMovementClient,
  ResponseFaker,
  NetworkSimulator,
  CallTracker,
  // ... and more
} from './types';
```

## Next Steps

- [Error Handling Guide](/docs/guides/error-handling)
- [API Reference](/docs/api/testing/harness)
