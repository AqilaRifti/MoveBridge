---
sidebar_position: 2
---

# Transactions

Learn how to build, sign, simulate, and submit transactions with MoveBridge.

## Overview

The `TransactionBuilder` provides methods for creating and submitting transactions to Movement Network.

## Token Transfers

The simplest transaction is a token transfer:

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });
await movement.wallet.connect('razor');

// Build a transfer transaction
const payload = await movement.transaction.transfer({
  to: '0x123...recipient_address',
  amount: '1000000', // Amount in octas (1 APT = 100,000,000 octas)
});

// Sign and submit
const hash = await movement.transaction.signAndSubmit(payload);
console.log('Transaction hash:', hash);

// Wait for confirmation
const result = await movement.waitForTransaction(hash);
console.log('Success:', result.success);
console.log('Gas used:', result.gasUsed);
```

### Custom Coin Types

Transfer other coin types by specifying `coinType`:

```typescript
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
  coinType: '0x1::my_coin::MyCoin', // Custom coin type
});
```

## Building Custom Transactions

For entry functions other than transfers:

```typescript
// Build a custom transaction payload
const payload = await movement.transaction.build({
  function: '0x1::counter::increment',
  typeArguments: [],
  arguments: [],
});

// Sign and submit
const hash = await movement.transaction.signAndSubmit(payload);
```

### With Type Arguments

```typescript
const payload = await movement.transaction.build({
  function: '0x1::coin::transfer',
  typeArguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: ['0x123...recipient', '1000000'],
});
```

## Transaction Simulation

Simulate a transaction before submitting to estimate gas:

```typescript
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
});

// Simulate the transaction
const simulation = await movement.transaction.simulate(payload);

console.log('Would succeed:', simulation.success);
console.log('Estimated gas:', simulation.gasUsed);
console.log('VM status:', simulation.vmStatus);

// Only submit if simulation succeeds
if (simulation.success) {
  const hash = await movement.transaction.signAndSubmit(payload);
}
```

## Separate Sign and Submit

For more control, sign and submit separately:

```typescript
// Build the payload
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
});

// Sign the transaction
const signed = await movement.transaction.sign(payload);
console.log('Signature:', signed.signature);
console.log('Sender:', signed.sender);

// Submit the signed transaction
const hash = await movement.transaction.submit(signed);
```

## Waiting for Confirmation

Wait for a transaction to be confirmed:

```typescript
const hash = await movement.transaction.signAndSubmit(payload);

// Wait with default timeout (30 seconds)
const result = await movement.waitForTransaction(hash);

// Or with custom options
const result = await movement.waitForTransaction(hash, {
  timeoutMs: 60000,      // 60 second timeout
  checkIntervalMs: 2000, // Check every 2 seconds
});

// Check the result
if (result.success) {
  console.log('Transaction succeeded!');
  console.log('Gas used:', result.gasUsed);
  console.log('Events:', result.events);
} else {
  console.log('Transaction failed:', result.vmStatus);
}
```

## React Integration

Use the `useTransaction` hook in React:

```tsx
import { useTransaction, useWaitForTransaction } from '@movebridge/react';

function TransferForm() {
  const { send, loading, error, data: hash } = useTransaction();
  const { data: result } = useWaitForTransaction(hash);

  const handleTransfer = async () => {
    try {
      await send({
        function: '0x1::coin::transfer',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        arguments: ['0x123...', '1000000'],
      });
    } catch (err) {
      console.error('Transfer failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send 1 APT'}
      </button>
      
      {hash && <p>Transaction: {hash}</p>}
      {result?.success && <p>✅ Confirmed!</p>}
      {error && <p>❌ Error: {error.message}</p>}
    </div>
  );
}
```

## Transaction Payload Structure

All transaction payloads follow this structure:

```typescript
interface TransactionPayload {
  type: 'entry_function_payload';
  function: string;        // Full function name: address::module::function
  typeArguments: string[]; // Generic type parameters
  arguments: unknown[];    // Function arguments
}
```

## Error Handling

Handle transaction errors:

```typescript
import { isMovementError } from '@movebridge/core';

try {
  const hash = await movement.transaction.signAndSubmit(payload);
  const result = await movement.waitForTransaction(hash);
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'WALLET_NOT_CONNECTED':
        console.log('Please connect your wallet first');
        break;
      case 'TRANSACTION_FAILED':
        console.log('Transaction failed:', error.message);
        break;
      case 'TRANSACTION_TIMEOUT':
        console.log('Transaction timed out');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

## Best Practices

1. **Always simulate first** - Catch errors before spending gas
2. **Handle timeouts** - Network congestion can delay confirmations
3. **Show transaction status** - Keep users informed during the process
4. **Validate inputs** - Check addresses and amounts before building transactions
5. **Use appropriate timeouts** - Adjust based on network conditions

## Next Steps

- [Contract Interactions](/docs/guides/contracts) - Call smart contract functions
- [Error Handling](/docs/guides/error-handling) - Handle errors properly
- [React Hooks](/docs/api/react/hooks) - Transaction hooks reference
