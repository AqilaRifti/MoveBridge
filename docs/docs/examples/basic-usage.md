---
sidebar_position: 1
---

# Basic Usage

A simple example showing core MoveBridge functionality.

## Setup

```typescript
import { Movement } from '@movebridge/core';

// Create client
const movement = new Movement({
  network: 'testnet',
  autoConnect: true,
});
```

## Wallet Connection

```typescript
// Detect available wallets
const wallets = movement.wallet.detectWallets();
console.log('Available wallets:', wallets);

// Connect to first available wallet
if (wallets.length > 0) {
  await movement.wallet.connect(wallets[0]);
  console.log('Connected!');
}

// Get wallet state
const state = movement.wallet.getState();
console.log('Address:', state.address);

// Listen for events
movement.wallet.on('accountChanged', (newAddress) => {
  console.log('Account changed to:', newAddress);
});

// Disconnect
await movement.wallet.disconnect();
```

## Reading Data

```typescript
// Get account balance
const balance = await movement.getAccountBalance(state.address!);
console.log('Balance:', balance, 'octas');

// Get account resources
const resources = await movement.getAccountResources(state.address!);
console.log('Resources:', resources.length);

// Get transaction
const tx = await movement.getTransaction('0x123...');
console.log('Transaction:', tx);
```

## Sending Transactions

```typescript
// Build transfer payload
const payload = await movement.transaction.transfer({
  to: '0x456...',
  amount: '1000000', // 0.01 APT
});

// Simulate first
const simulation = await movement.transaction.simulate(payload);
if (!simulation.success) {
  console.log('Simulation failed:', simulation.vmStatus);
  return;
}
console.log('Estimated gas:', simulation.gasUsed);

// Sign and submit
const hash = await movement.transaction.signAndSubmit(payload);
console.log('Transaction hash:', hash);

// Wait for confirmation
const result = await movement.waitForTransaction(hash);
if (result.success) {
  console.log('Transaction confirmed!');
  console.log('Gas used:', result.gasUsed);
} else {
  console.log('Transaction failed:', result.vmStatus);
}
```

## Contract Interaction

```typescript
// Create contract interface
const counter = movement.contract({
  address: '0x123...',
  module: 'counter',
});

// Read (view function)
const count = await counter.view<number>('get_count', []);
console.log('Current count:', count);

// Write (entry function)
const txHash = await counter.call('increment', []);
await movement.waitForTransaction(txHash);

// Read again
const newCount = await counter.view<number>('get_count', []);
console.log('New count:', newCount);
```

## Event Subscription

```typescript
// Subscribe to events
const subId = movement.events.subscribe({
  eventHandle: '0x123::counter::CounterChanged',
  callback: (event) => {
    console.log('Counter changed!');
    console.log('New value:', event.data.value);
  },
});

// Later: unsubscribe
movement.events.unsubscribe(subId);
```

## Error Handling

```typescript
import { isMovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'WALLET_NOT_FOUND':
        console.log('Please install Petra wallet');
        break;
      case 'WALLET_CONNECTION_FAILED':
        console.log('Connection rejected');
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

## Complete Example

```typescript
import { Movement, isMovementError } from '@movebridge/core';

async function main() {
  // Initialize
  const movement = new Movement({ network: 'testnet' });

  try {
    // Connect wallet
    const wallets = movement.wallet.detectWallets();
    if (wallets.length === 0) {
      console.log('No wallets found');
      return;
    }

    await movement.wallet.connect(wallets[0]);
    const { address } = movement.wallet.getState();
    console.log('Connected:', address);

    // Get balance
    const balance = await movement.getAccountBalance(address!);
    console.log('Balance:', balance, 'octas');

    // Transfer tokens
    const payload = await movement.transaction.transfer({
      to: '0x456...',
      amount: '1000000',
    });

    const hash = await movement.transaction.signAndSubmit(payload);
    console.log('Transaction:', hash);

    const result = await movement.waitForTransaction(hash);
    console.log('Success:', result.success);

  } catch (error) {
    if (isMovementError(error)) {
      console.error(`[${error.code}] ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    // Cleanup
    await movement.wallet.disconnect();
    movement.events.unsubscribeAll();
  }
}

main();
```
