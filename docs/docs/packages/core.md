---
sidebar_position: 1
---

# @movebridge/core

The foundation package providing all blockchain interactions for Movement Network.

## Installation

```bash
npm install @movebridge/core
```

## Overview

`@movebridge/core` is the main SDK package that provides:

- **Movement Client** - Main entry point for all SDK interactions
- **Wallet Manager** - Multi-wallet support with unified API
- **Transaction Builder** - Build, sign, and submit transactions
- **Contract Interface** - Interact with Move modules
- **Event Listener** - Subscribe to contract events
- **Error Handling** - Structured errors with typed codes

## Quick Start

```typescript
import { Movement } from '@movebridge/core';

// Initialize
const movement = new Movement({ network: 'testnet' });

// Connect wallet
await movement.wallet.connect('petra');

// Get balance
const balance = await movement.getAccountBalance(
  movement.wallet.getState().address!
);

// Transfer tokens
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
});
const hash = await movement.transaction.signAndSubmit(payload);
```

## Movement Client

The main entry point for all SDK interactions:

```typescript
const movement = new Movement({
  network: 'testnet',    // 'mainnet' | 'testnet'
  rpcUrl?: string,       // Custom RPC URL
  indexerUrl?: string,   // Custom indexer URL
  autoConnect?: boolean, // Auto-connect to last wallet
});
```

### Methods

| Method | Description |
|--------|-------------|
| `getAccountBalance(address)` | Get account balance in octas |
| `getAccountResources(address)` | Get all account resources |
| `getTransaction(hash)` | Get transaction by hash |
| `waitForTransaction(hash, options?)` | Wait for transaction confirmation |
| `contract(options)` | Create a contract interface |
| `getAptosClient()` | Get underlying Aptos client |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `config` | `ResolvedConfig` | Resolved configuration |
| `wallet` | `WalletManager` | Wallet manager instance |
| `transaction` | `TransactionBuilder` | Transaction builder instance |
| `events` | `EventListener` | Event listener instance |

## Wallet Manager

Handles wallet detection, connection, and state:

```typescript
// Detect available wallets
const wallets = movement.wallet.detectWallets();

// Connect
await movement.wallet.connect('petra');

// Get state
const state = movement.wallet.getState();
// { connected: true, address: '0x...', publicKey: '0x...' }

// Disconnect
await movement.wallet.disconnect();
```

### Events

```typescript
movement.wallet.on('connect', (address) => {});
movement.wallet.on('disconnect', () => {});
movement.wallet.on('accountChanged', (newAddress) => {});
movement.wallet.on('networkChanged', (network) => {});
```

## Transaction Builder

Build and submit transactions:

```typescript
// Transfer tokens
const payload = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
  coinType?: '0x1::aptos_coin::AptosCoin',
});

// Build custom transaction
const payload = await movement.transaction.build({
  function: '0x1::module::function',
  typeArguments: [],
  arguments: [],
});

// Sign and submit
const hash = await movement.transaction.signAndSubmit(payload);

// Or separately
const signed = await movement.transaction.sign(payload);
const hash = await movement.transaction.submit(signed);

// Simulate first
const simulation = await movement.transaction.simulate(payload);
```

## Contract Interface

Interact with Move modules:

```typescript
const contract = movement.contract({
  address: '0x1',
  module: 'coin',
});

// View function (read-only)
const result = await contract.view('balance', [address], [typeArg]);

// Entry function (write)
const txHash = await contract.call('transfer', [to, amount], [typeArg]);

// Check/get resources
const exists = await contract.hasResource(resourceType);
const resource = await contract.getResource(resourceType);
```

## Event Listener

Subscribe to contract events:

```typescript
// Subscribe
const subId = movement.events.subscribe({
  eventHandle: '0x1::coin::DepositEvent',
  callback: (event) => {
    console.log(event.type, event.data);
  },
});

// Unsubscribe
movement.events.unsubscribe(subId);
movement.events.unsubscribeAll();
```

## Error Handling

All errors are `MovementError` instances:

```typescript
import { isMovementError, MovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    console.log(error.code);    // 'WALLET_NOT_FOUND'
    console.log(error.details); // { wallet: 'petra', available: [...] }
  }
}
```

### Error Codes

- `INVALID_ADDRESS` - Invalid address format
- `WALLET_NOT_FOUND` - Wallet not installed
- `WALLET_CONNECTION_FAILED` - Connection failed
- `WALLET_NOT_CONNECTED` - No wallet connected
- `TRANSACTION_FAILED` - Transaction failed
- `TRANSACTION_TIMEOUT` - Confirmation timeout
- `VIEW_FUNCTION_FAILED` - View function error
- `INVALID_EVENT_HANDLE` - Invalid event handle
- `NETWORK_ERROR` - Network request failed

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://full.mainnet.movementinfra.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |

## Exports

```typescript
// Main client
export { Movement } from './client';

// Configuration
export { NETWORK_CONFIG, resolveConfig, isValidAddress } from './config';

// Errors
export { MovementError, Errors, isMovementError, wrapError } from './errors';

// Components
export { WalletManager } from './wallet';
export { TransactionBuilder } from './transaction';
export { ContractInterface } from './contract';
export { EventListener } from './events';

// Types
export type {
  NetworkType,
  WalletType,
  MovementConfig,
  WalletState,
  Transaction,
  TransactionResponse,
  TransactionPayload,
  Resource,
  ContractEvent,
  // ... and more
} from './types';
```

## Next Steps

- [Wallet Connection Guide](/docs/guides/wallet-connection)
- [Transactions Guide](/docs/guides/transactions)
- [Contract Interactions](/docs/guides/contracts)
- [API Reference](/docs/api/core/movement)
