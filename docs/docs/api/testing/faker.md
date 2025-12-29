---
sidebar_position: 2
---

# Faker

Generate deterministic fake data for testing.

## Import

```typescript
import { createFaker } from '@movebridge/testing';
```

## createFaker

```typescript
createFaker(options?: FakerOptions): ResponseFaker
```

### Options

```typescript
interface FakerOptions {
  seed?: number; // Random seed for reproducibility
}
```

## Methods

### fakeAddress

Generate a valid Movement address.

```typescript
fakeAddress(): string
// '0x1a2b3c...' (64 hex chars)
```

### fakeBalance

Generate a random balance.

```typescript
fakeBalance(options?: BalanceOptions): string

interface BalanceOptions {
  min?: string;
  max?: string;
}
```

### fakeTransaction

Generate a complete transaction.

```typescript
fakeTransaction(): Transaction
```

### fakeTransactionResponse

Generate a transaction response.

```typescript
fakeTransactionResponse(success?: boolean): TransactionResponse
```

### fakeResource

Generate a resource.

```typescript
fakeResource(type: string): Resource
```

### fakeEvent

Generate a contract event.

```typescript
fakeEvent(type: string): ContractEvent
```

### fakeWalletState

Generate wallet state.

```typescript
fakeWalletState(connected?: boolean): WalletState
```

### fakeTransactionHash

Generate a transaction hash.

```typescript
fakeTransactionHash(): string
```

## Example

```typescript
const faker = createFaker({ seed: 42 });

// Same seed = same results
const address1 = faker.fakeAddress();
const address2 = faker.fakeAddress();

// Generate test data
const tx = faker.fakeTransaction();
const balance = faker.fakeBalance({ min: '0', max: '1000000000' });
```
