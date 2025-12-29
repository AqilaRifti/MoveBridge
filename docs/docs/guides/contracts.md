---
sidebar_position: 3
---

# Contract Interactions

Learn how to interact with Move smart contracts using MoveBridge.

## Overview

The `ContractInterface` provides a simplified API for calling view functions (read) and entry functions (write) on Move modules.

## Creating a Contract Interface

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Create a contract interface
const contract = movement.contract({
  address: '0x1',        // Contract address
  module: 'coin',        // Module name
});
```

## View Functions (Read)

View functions are read-only and don't require a wallet connection:

```typescript
// Call a view function
const balance = await contract.view('balance', [
  '0x123...owner_address',
], [
  '0x1::aptos_coin::AptosCoin', // Type argument
]);

console.log('Balance:', balance);
```

### Without Type Arguments

```typescript
const count = await contract.view('get_count', []);
```

### With Multiple Arguments

```typescript
const result = await contract.view('calculate', [
  '100',  // arg1
  '200',  // arg2
  true,   // arg3
]);
```

## Entry Functions (Write)

Entry functions modify state and require a connected wallet:

```typescript
await movement.wallet.connect('petra');

// Call an entry function
const txHash = await contract.call('increment', []);

// Wait for confirmation
const result = await movement.waitForTransaction(txHash);
console.log('Success:', result.success);
```

### With Arguments

```typescript
const txHash = await contract.call('transfer', [
  '0x123...recipient',
  '1000000',
], [
  '0x1::aptos_coin::AptosCoin', // Type argument
]);
```

## Checking Resources

Check if a resource exists at the contract address:

```typescript
const hasStore = await contract.hasResource(
  '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
);

if (hasStore) {
  console.log('Account has a coin store');
}
```

## Getting Resources

Retrieve resource data:

```typescript
interface CoinStore {
  coin: { value: string };
  frozen: boolean;
}

const resource = await contract.getResource<CoinStore>(
  '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
);

if (resource) {
  console.log('Balance:', resource.coin.value);
  console.log('Frozen:', resource.frozen);
}
```

## Type-Safe Contracts with Codegen

Generate TypeScript bindings for type-safe contract interactions:

```bash
# Generate types from a deployed contract
npx movebridge-gen \
  --address 0x1::coin \
  --network testnet \
  --output ./src/types/coin.ts
```

Then use the generated class:

```typescript
import { CoinContract } from './types/coin';

const coin = new CoinContract(movement);

// Fully typed method calls
const balance = await coin.balance('0x123...', ['0x1::aptos_coin::AptosCoin']);
```

See the [Codegen Package](/docs/packages/codegen) for more details.

## React Integration

Use the `useContract` hook in React:

```tsx
import { useContract } from '@movebridge/react';

function Counter() {
  const { data, loading, error, read, write } = useContract({
    address: '0x123...',
    module: 'counter',
  });

  const fetchCount = async () => {
    const count = await read('get_count', []);
    console.log('Count:', count);
  };

  const increment = async () => {
    const txHash = await write('increment', []);
    console.log('Transaction:', txHash);
  };

  return (
    <div>
      <p>Count: {data ?? 'Unknown'}</p>
      <button onClick={fetchCount} disabled={loading}>
        Fetch Count
      </button>
      <button onClick={increment} disabled={loading}>
        Increment
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Full Function Names

Get the full function name for a contract function:

```typescript
const contract = movement.contract({
  address: '0x1',
  module: 'coin',
});

const fullName = contract.getFullFunctionName('transfer');
// Returns: '0x1::coin::transfer'
```

## Error Handling

Handle contract-related errors:

```typescript
import { isMovementError } from '@movebridge/core';

try {
  const result = await contract.view('get_count', []);
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'VIEW_FUNCTION_FAILED':
        console.log('View function failed:', error.message);
        console.log('Function:', error.details?.function);
        console.log('Args:', error.details?.args);
        break;
      case 'WALLET_NOT_CONNECTED':
        console.log('Connect wallet to call entry functions');
        break;
      case 'TRANSACTION_FAILED':
        console.log('Entry function call failed');
        break;
    }
  }
}
```

## Example: Counter Contract

Here's a complete example interacting with a counter contract:

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Create contract interface
const counter = movement.contract({
  address: '0x123...contract_address',
  module: 'counter',
});

// Read the current count (no wallet needed)
const count = await counter.view<number>('get_count', []);
console.log('Current count:', count);

// Connect wallet for write operations
await movement.wallet.connect('petra');

// Increment the counter
const txHash = await counter.call('increment', []);
console.log('Transaction:', txHash);

// Wait for confirmation
const result = await movement.waitForTransaction(txHash);
if (result.success) {
  // Read the new count
  const newCount = await counter.view<number>('get_count', []);
  console.log('New count:', newCount);
}
```

## Best Practices

1. **Use view functions for reads** - They're free and don't require wallet connection
2. **Generate types with codegen** - Get compile-time type safety
3. **Handle errors gracefully** - View functions can fail if the module doesn't exist
4. **Wait for confirmations** - Always wait for entry function transactions to confirm
5. **Cache contract interfaces** - Reuse the same interface instance

## Next Steps

- [Events Guide](/docs/guides/events) - Subscribe to contract events
- [Codegen Package](/docs/packages/codegen) - Generate type-safe bindings
- [API Reference](/docs/api/core/contract-interface) - Full API documentation
