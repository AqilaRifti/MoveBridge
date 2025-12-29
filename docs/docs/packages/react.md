---
sidebar_position: 2
---

# @movebridge/react

React hooks and components for building dApps on Movement Network.

## Installation

```bash
npm install @movebridge/react @movebridge/core
```

## Overview

`@movebridge/react` provides:

- **MovementProvider** - React context for SDK access
- **Hooks** - `useMovement`, `useBalance`, `useContract`, `useTransaction`, `useWaitForTransaction`
- **Components** - `WalletButton`, `WalletModal`, `AddressDisplay`, `NetworkSwitcher`

## Quick Start

```tsx
import { MovementProvider, useMovement, useBalance } from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <WalletInfo />
    </MovementProvider>
  );
}

function WalletInfo() {
  const { address, connected, connect, disconnect, wallets } = useMovement();
  const { balance, loading } = useBalance();

  if (!connected) {
    return (
      <button onClick={() => connect(wallets[0])}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {loading ? 'Loading...' : balance} octas</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

## MovementProvider

Wrap your app with `MovementProvider` to enable SDK access:

```tsx
import { MovementProvider } from '@movebridge/react';

function App() {
  return (
    <MovementProvider
      network="testnet"           // 'mainnet' | 'testnet'
      autoConnect={true}          // Auto-connect to last wallet
      onError={(error) => {       // Global error handler
        console.error(error);
      }}
    >
      <YourApp />
    </MovementProvider>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `network` | `'mainnet' \| 'testnet'` | Required | Network to connect to |
| `autoConnect` | `boolean` | `false` | Auto-connect to last wallet |
| `onError` | `(error: MovementError) => void` | - | Global error callback |
| `children` | `ReactNode` | Required | Child components |

## Hooks

### useMovement

Access wallet connection state and actions:

```tsx
const {
  movement,    // Movement SDK instance
  network,     // Current network
  address,     // Connected address (or null)
  connected,   // Whether connected
  connecting,  // Whether connecting
  connect,     // Connect function
  disconnect,  // Disconnect function
  wallets,     // Available wallets
  wallet,      // Current wallet type
} = useMovement();
```

### useBalance

Fetch account balance:

```tsx
const {
  balance,  // Balance in octas (or null)
  loading,  // Whether loading
  error,    // Error (or null)
  refetch,  // Refetch function
} = useBalance(address?); // Optional address, defaults to connected
```

### useContract

Interact with contracts:

```tsx
const {
  data,      // Last operation result
  loading,   // Whether loading
  error,     // Error (or null)
  read,      // Call view function
  write,     // Call entry function
  contract,  // ContractInterface instance
} = useContract({
  address: '0x123...',
  module: 'counter',
});

// Read (view function)
const count = await read('get_count', []);

// Write (entry function)
const txHash = await write('increment', []);
```

### useTransaction

Submit transactions:

```tsx
const {
  send,    // Send transaction function
  data,    // Transaction hash (or null)
  loading, // Whether sending
  error,   // Error (or null)
  reset,   // Reset state
} = useTransaction();

// Send a transaction
await send({
  function: '0x1::coin::transfer',
  typeArguments: ['0x1::aptos_coin::AptosCoin'],
  arguments: ['0x123...', '1000000'],
});
```

### useWaitForTransaction

Wait for transaction confirmation:

```tsx
const {
  data,    // TransactionResponse (or null)
  loading, // Whether waiting
  error,   // Error (or null)
} = useWaitForTransaction(hash, {
  timeoutMs?: 30000,
  checkIntervalMs?: 1000,
});

if (data?.success) {
  console.log('Transaction confirmed!');
}
```

## Components

### WalletButton

A button that shows connection state:

```tsx
import { WalletButton } from '@movebridge/react';

<WalletButton
  onClick={() => setModalOpen(true)}  // Called when clicked
  className="my-button"               // Custom class
/>
```

### WalletModal

Modal for wallet selection:

```tsx
import { WalletModal } from '@movebridge/react';

<WalletModal
  open={isOpen}                    // Whether modal is open
  onClose={() => setIsOpen(false)} // Close handler
  className="my-modal"             // Custom class
/>
```

### AddressDisplay

Display an address with truncation and copy:

```tsx
import { AddressDisplay } from '@movebridge/react';

<AddressDisplay
  address="0x123..."  // Address to display
  truncate={true}     // Truncate to 0x123...abc
  copyable={true}     // Show copy button
  className="my-addr" // Custom class
/>
```

### NetworkSwitcher

Switch between networks:

```tsx
import { NetworkSwitcher } from '@movebridge/react';

<NetworkSwitcher
  onChange={(network) => {}}  // Called on network change
  className="my-switcher"     // Custom class
/>
```

## Complete Example

```tsx
import {
  MovementProvider,
  useMovement,
  useBalance,
  useContract,
  WalletButton,
  WalletModal,
  AddressDisplay,
} from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <Dashboard />
    </MovementProvider>
  );
}

function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, connected } = useMovement();
  const { balance, loading: balanceLoading } = useBalance();

  return (
    <div>
      <header>
        <WalletButton onClick={() => setModalOpen(true)} />
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </header>

      {connected && (
        <main>
          <AddressDisplay address={address!} truncate copyable />
          <p>Balance: {balanceLoading ? '...' : balance} octas</p>
          <Counter />
        </main>
      )}
    </div>
  );
}

function Counter() {
  const { data, read, write, loading } = useContract({
    address: '0x123...',
    module: 'counter',
  });

  return (
    <div>
      <p>Count: {data ?? '?'}</p>
      <button onClick={() => read('get_count', [])} disabled={loading}>
        Refresh
      </button>
      <button onClick={() => write('increment', [])} disabled={loading}>
        Increment
      </button>
    </div>
  );
}
```

## TypeScript Support

All hooks and components are fully typed:

```typescript
import type {
  MovementProviderProps,
  MovementContextValue,
  UseMovementReturn,
  UseBalanceReturn,
  UseContractReturn,
  UseContractOptions,
  UseTransactionReturn,
  UseWaitForTransactionReturn,
  WalletButtonProps,
  WalletModalProps,
  AddressDisplayProps,
  NetworkSwitcherProps,
} from '@movebridge/react';
```

## Exports

```typescript
// Provider
export { MovementProvider, MovementContext, useMovementContext } from './context';

// Hooks
export { useMovement, useBalance, useContract, useTransaction, useWaitForTransaction } from './hooks';

// Components
export { WalletButton, WalletModal, AddressDisplay, NetworkSwitcher } from './components';

// Re-exported types from core
export type { NetworkType, WalletType, MovementError } from '@movebridge/core';
```

## Next Steps

- [Wallet Connection Guide](/docs/guides/wallet-connection)
- [React App Example](/docs/examples/react-app)
- [API Reference](/docs/api/react/provider)
