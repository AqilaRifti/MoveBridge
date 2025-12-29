---
sidebar_position: 3
---

# Contract Interaction

Examples of interacting with Move smart contracts.

## Simple Counter Contract

### Move Contract

```move
module 0x123::counter {
    use std::signer;

    struct Counter has key {
        value: u64,
    }

    public entry fun initialize(account: &signer) {
        move_to(account, Counter { value: 0 });
    }

    public entry fun increment(account: &signer) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = counter.value + 1;
    }

    public entry fun set_value(account: &signer, value: u64) acquires Counter {
        let counter = borrow_global_mut<Counter>(signer::address_of(account));
        counter.value = value;
    }

    #[view]
    public fun get_count(addr: address): u64 acquires Counter {
        borrow_global<Counter>(addr).value
    }
}
```

### TypeScript Interaction

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });
await movement.wallet.connect('petra');

const CONTRACT_ADDRESS = '0x123...';

// Create contract interface
const counter = movement.contract({
  address: CONTRACT_ADDRESS,
  module: 'counter',
});

// Read current count
const count = await counter.view<number>('get_count', [
  movement.wallet.getState().address!,
]);
console.log('Current count:', count);

// Increment
const txHash = await counter.call('increment', []);
await movement.waitForTransaction(txHash);

// Read new count
const newCount = await counter.view<number>('get_count', [
  movement.wallet.getState().address!,
]);
console.log('New count:', newCount);

// Set specific value
const setTxHash = await counter.call('set_value', ['100']);
await movement.waitForTransaction(setTxHash);
```

## Token Contract

### Interacting with Coin Module

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });
await movement.wallet.connect('petra');

const coin = movement.contract({
  address: '0x1',
  module: 'coin',
});

// Get balance
const balance = await coin.view<string>('balance', [
  movement.wallet.getState().address!,
], [
  '0x1::aptos_coin::AptosCoin', // Type argument
]);
console.log('Balance:', balance);

// Transfer tokens
const txHash = await coin.call('transfer', [
  '0x456...recipient',
  '1000000', // Amount in octas
], [
  '0x1::aptos_coin::AptosCoin',
]);

const result = await movement.waitForTransaction(txHash);
console.log('Transfer success:', result.success);
```

## NFT Minting

### Move Contract

```move
module 0x123::nft {
    use std::string::String;
    use std::signer;

    struct NFT has key, store {
        id: u64,
        name: String,
        uri: String,
    }

    struct Collection has key {
        next_id: u64,
    }

    public entry fun mint(
        account: &signer,
        name: String,
        uri: String,
    ) acquires Collection {
        let collection = borrow_global_mut<Collection>(@0x123);
        let id = collection.next_id;
        collection.next_id = id + 1;

        move_to(account, NFT { id, name, uri });
    }

    #[view]
    public fun get_nft(addr: address): (u64, String, String) acquires NFT {
        let nft = borrow_global<NFT>(addr);
        (nft.id, nft.name, nft.uri)
    }
}
```

### TypeScript Interaction

```typescript
const nft = movement.contract({
  address: '0x123...',
  module: 'nft',
});

// Mint an NFT
const mintTx = await nft.call('mint', [
  'My NFT',                           // name
  'https://example.com/nft/1.json',   // uri
]);
await movement.waitForTransaction(mintTx);

// Get NFT data
const [id, name, uri] = await nft.view<[number, string, string]>('get_nft', [
  movement.wallet.getState().address!,
]);
console.log('NFT:', { id, name, uri });
```

## Using Generated Types

Generate type-safe bindings:

```bash
npx movebridge-gen \
  --address 0x123::counter \
  --network testnet \
  --output ./src/types/counter.ts
```

Use the generated class:

```typescript
import { CounterContract } from './types/counter';

const counter = new CounterContract(movement);

// Fully typed methods
const count = await counter.getCount(address);
await counter.increment();
await counter.setValue('100');
```

## React Hook Example

```tsx
import { useContract, useWaitForTransaction } from '@movebridge/react';
import { useState } from 'react';

function Counter() {
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const { data: count, loading, read, write } = useContract({
    address: '0x123...',
    module: 'counter',
  });

  const { data: result } = useWaitForTransaction(txHash);

  const fetchCount = async () => {
    await read('get_count', [address]);
  };

  const increment = async () => {
    const hash = await write('increment', []);
    setTxHash(hash);
  };

  return (
    <div>
      <h2>Counter: {count ?? '?'}</h2>
      
      <button onClick={fetchCount} disabled={loading}>
        Refresh
      </button>
      
      <button onClick={increment} disabled={loading}>
        Increment
      </button>

      {txHash && (
        <p>
          Transaction: {txHash.slice(0, 10)}...
          {result?.success ? ' ✅' : result ? ' ❌' : ' ⏳'}
        </p>
      )}
    </div>
  );
}
```

## Checking Resources

```typescript
// Check if resource exists
const hasCounter = await counter.hasResource(
  `${CONTRACT_ADDRESS}::counter::Counter`
);

if (!hasCounter) {
  // Initialize counter first
  await counter.call('initialize', []);
}

// Get resource data
interface CounterResource {
  value: string;
}

const resource = await counter.getResource<CounterResource>(
  `${CONTRACT_ADDRESS}::counter::Counter`
);

if (resource) {
  console.log('Counter value:', resource.value);
}
```

## Error Handling

```typescript
import { isMovementError } from '@movebridge/core';

try {
  const count = await counter.view('get_count', [address]);
} catch (error) {
  if (isMovementError(error)) {
    if (error.code === 'VIEW_FUNCTION_FAILED') {
      // Resource might not exist
      console.log('Counter not initialized for this address');
    }
  }
}

try {
  await counter.call('increment', []);
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'WALLET_NOT_CONNECTED':
        console.log('Please connect wallet');
        break;
      case 'TRANSACTION_FAILED':
        console.log('Transaction failed:', error.details?.vmStatus);
        break;
    }
  }
}
```

## Best Practices

1. **Generate types** - Use codegen for type safety
2. **Check resources** - Verify resources exist before reading
3. **Handle errors** - Wrap calls in try-catch
4. **Wait for confirmation** - Always wait for transactions
5. **Simulate first** - Use simulation to catch errors early
