---
sidebar_position: 1
---

# Test Harness

Unified test setup with all testing utilities.

## Import

```typescript
import { createTestHarness } from '@movebridge/testing';
```

## createTestHarness

```typescript
createTestHarness(config?: TestHarnessConfig): TestHarness
```

### Config

```typescript
interface TestHarnessConfig {
  seed?: number;          // Random seed for reproducibility
  defaultLatency?: number; // Default latency in ms
}
```

### Returns

```typescript
interface TestHarness {
  client: MockMovementClient;
  tracker: CallTracker;
  simulator: NetworkSimulator;
  faker: ResponseFaker;
  cleanup(): void;
  reset(): void;
}
```

## Example

```typescript
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
    harness.client.mockResponse('getAccountBalance', '1000000000');

    const balance = await harness.client.getAccountBalance('0x1');

    expect(balance).toBe('1000000000');
    harness.tracker.assertCalled('getAccountBalance');
  });
});
```

## Mock Client

```typescript
harness.client.mockResponse('method', response);
harness.client.mockError('method', error);
harness.client.mockResponseOnce('method', response);
harness.client.clearMocks();
```

## Call Tracker

```typescript
harness.tracker.assertCalled('method');
harness.tracker.assertCalledWith('method', [args]);
harness.tracker.assertCalledTimes('method', count);
harness.tracker.assertNotCalled('method');
harness.tracker.getCalls('method');
harness.tracker.clearCalls();
```

## Network Simulator

```typescript
harness.simulator.simulateLatency(100);
harness.simulator.simulateTimeout('method');
harness.simulator.simulateNetworkError();
harness.simulator.simulateRateLimit(5);
harness.simulator.resetSimulation();
```

## Faker

```typescript
harness.faker.fakeAddress();
harness.faker.fakeBalance({ min: '0', max: '1000' });
harness.faker.fakeTransaction();
harness.faker.fakeTransactionResponse(true);
harness.faker.fakeResource('type');
harness.faker.fakeEvent('type');
harness.faker.fakeWalletState(true);
harness.faker.fakeTransactionHash();
```
