---
sidebar_position: 4
---

# Network Simulator

Simulate network conditions for testing.

## Import

```typescript
import { createNetworkSimulator } from '@movebridge/testing';
```

## createNetworkSimulator

```typescript
createNetworkSimulator(): NetworkSimulator
```

## Methods

### simulateLatency

Add latency to all calls.

```typescript
simulateLatency(ms: number): void
```

### simulateTimeout

Make a specific method timeout.

```typescript
simulateTimeout(method: string): void
```

### simulateNetworkError

Enable network errors for all calls.

```typescript
simulateNetworkError(): void
```

### simulateRateLimit

Enable rate limiting after N calls.

```typescript
simulateRateLimit(maxCalls: number): void
```

### resetSimulation

Reset all simulation settings.

```typescript
resetSimulation(): void
```

### Getters

```typescript
getLatency(): number
isNetworkErrorEnabled(): boolean
isMethodTimedOut(method: string): boolean
getRateLimitRemaining(): number | null
```

## Example

```typescript
const simulator = createNetworkSimulator();

// Test latency handling
simulator.simulateLatency(100);

// Test timeout handling
simulator.simulateTimeout('getAccountBalance');

// Test error handling
simulator.simulateNetworkError();

// Test rate limiting
simulator.simulateRateLimit(5);

// Reset
simulator.resetSimulation();
```

## With Test Harness

```typescript
const harness = createTestHarness();

// Simulate slow network
harness.simulator.simulateLatency(500);

// Test your code handles latency
const start = Date.now();
await harness.client.getAccountBalance('0x1');
const duration = Date.now() - start;
expect(duration).toBeGreaterThanOrEqual(500);
```
