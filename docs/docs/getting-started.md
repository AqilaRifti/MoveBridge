---
sidebar_position: 2
---

# Getting Started

Get up and running with MoveBridge SDK in minutes.

## Installation

Install the packages you need:

```bash
# Core SDK (required)
npm install @movebridge/core

# React integration (optional)
npm install @movebridge/react

# Code generation CLI (optional, dev dependency)
npm install -D @movebridge/codegen

# Testing utilities (optional, dev dependency)
npm install -D @movebridge/testing
```

Or with other package managers:

```bash
# pnpm
pnpm add @movebridge/core @movebridge/react
pnpm add -D @movebridge/codegen @movebridge/testing

# yarn
yarn add @movebridge/core @movebridge/react
yarn add -D @movebridge/codegen @movebridge/testing
```

## Basic Setup

### Vanilla TypeScript

```typescript
import { Movement } from '@movebridge/core';

// Create a Movement client
const movement = new Movement({
  network: 'testnet', // or 'mainnet'
});

// Detect available wallets
const wallets = movement.wallet.detectWallets();
console.log('Available wallets:', wallets);

// Connect to a wallet
await movement.wallet.connect('petra');

// Get the connected address
const state = movement.wallet.getState();
console.log('Connected:', state.address);

// Get account balance
const balance = await movement.getAccountBalance(state.address!);
console.log('Balance:', balance, 'octas');
```

### React Setup

```tsx
import { MovementProvider, useMovement, useBalance } from '@movebridge/react';

// Wrap your app with the provider
function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <WalletInfo />
    </MovementProvider>
  );
}

// Use hooks in your components
function WalletInfo() {
  const { address, connected, connect, disconnect, wallets } = useMovement();
  const { balance, loading } = useBalance();

  if (!connected) {
    return (
      <div>
        <h2>Connect Wallet</h2>
        {wallets.map((wallet) => (
          <button key={wallet} onClick={() => connect(wallet)}>
            Connect {wallet}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {loading ? 'Loading...' : `${balance} octas`}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## Configuration Options

The `Movement` client accepts the following configuration:

```typescript
interface MovementConfig {
  // Network to connect to
  network: 'mainnet' | 'testnet';
  
  // Custom RPC URL (overrides network default)
  rpcUrl?: string;
  
  // Custom indexer URL (overrides network default)
  indexerUrl?: string;
  
  // Auto-connect to previously connected wallet
  autoConnect?: boolean;
}
```

### Examples

```typescript
// Basic testnet setup
const movement = new Movement({ network: 'testnet' });

// Mainnet with auto-connect
const movement = new Movement({
  network: 'mainnet',
  autoConnect: true,
});

// Custom RPC endpoint
const movement = new Movement({
  network: 'testnet',
  rpcUrl: 'https://my-custom-node.example.com/v1',
});
```

## Supported Wallets

MoveBridge supports the following wallets out of the box:

| Wallet | Type | Install |
|--------|------|---------|
| [Petra](https://petra.app/) | `petra` | Browser extension |
| [Pontem](https://pontem.network/) | `pontem` | Browser extension |
| [Nightly](https://nightly.app/) | `nightly` | Browser extension |

All wallets are detected automatically using the [Aptos Wallet Standard (AIP-62)](https://github.com/aptos-foundation/AIPs/blob/main/aips/aip-62.md).

## TypeScript Support

MoveBridge is written in TypeScript and provides full type definitions. All exports are fully typed:

```typescript
import type {
  NetworkType,
  WalletType,
  MovementConfig,
  WalletState,
  Transaction,
  TransactionResponse,
  Resource,
  ContractEvent,
} from '@movebridge/core';
```

## Next Steps

Now that you have MoveBridge set up, explore:

- [Wallet Connection Guide](/docs/guides/wallet-connection) - Deep dive into wallet management
- [Transactions Guide](/docs/guides/transactions) - Learn to build and submit transactions
- [Contract Interactions](/docs/guides/contracts) - Interact with Move modules
- [React Integration](/docs/packages/react) - Build React apps with hooks and components
