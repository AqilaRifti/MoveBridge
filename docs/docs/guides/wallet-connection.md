---
sidebar_position: 1
---

# Wallet Connection

Learn how to connect, manage, and interact with wallets using MoveBridge.

## Overview

MoveBridge provides a unified wallet interface that works with all supported wallets (Petra, Pontem, Nightly) through the Aptos Wallet Standard (AIP-62).

## Detecting Wallets

Before connecting, detect which wallets are installed:

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Get list of available wallets
const wallets = movement.wallet.detectWallets();
console.log('Available:', wallets); // ['petra', 'pontem', 'nightly']

// Get detailed wallet info (name, icon)
const walletInfo = movement.wallet.getWalletInfo();
// [{ type: 'petra', name: 'Petra Wallet', icon: '...' }, ...]
```

## Connecting to a Wallet

```typescript
// Connect to a specific wallet
try {
  await movement.wallet.connect('petra');
  console.log('Connected!');
} catch (error) {
  if (error.code === 'WALLET_NOT_FOUND') {
    console.log('Petra wallet is not installed');
  } else if (error.code === 'WALLET_CONNECTION_FAILED') {
    console.log('User rejected the connection');
  }
}
```

## Getting Wallet State

```typescript
const state = movement.wallet.getState();

console.log('Connected:', state.connected);
console.log('Address:', state.address);
console.log('Public Key:', state.publicKey);

// Get the current wallet type
const walletType = movement.wallet.getWallet();
console.log('Wallet:', walletType); // 'petra' | 'pontem' | 'nightly' | null
```

## Disconnecting

```typescript
await movement.wallet.disconnect();
```

## Wallet Events

Listen to wallet state changes:

```typescript
// Connection established
movement.wallet.on('connect', (address) => {
  console.log('Connected to:', address);
});

// Disconnection
movement.wallet.on('disconnect', () => {
  console.log('Wallet disconnected');
});

// Account changed (user switched accounts in wallet)
movement.wallet.on('accountChanged', (newAddress) => {
  console.log('Account changed to:', newAddress);
});

// Network changed
movement.wallet.on('networkChanged', (network) => {
  console.log('Network changed to:', network);
});

// Remove listeners when done
movement.wallet.off('connect', handler);
```

## Auto-Connect

Enable auto-connect to reconnect to the last used wallet:

```typescript
const movement = new Movement({
  network: 'testnet',
  autoConnect: true, // Will try to reconnect on page load
});

// Or manually trigger auto-connect
await movement.wallet.autoConnect();
```

The last connected wallet is stored in `localStorage` under the key `movebridge:lastWallet`.

## React Integration

Use the `useMovement` hook for wallet management in React:

```tsx
import { useMovement } from '@movebridge/react';

function WalletButton() {
  const {
    address,
    connected,
    connecting,
    connect,
    disconnect,
    wallets,
    wallet,
  } = useMovement();

  if (connecting) {
    return <button disabled>Connecting...</button>;
  }

  if (connected) {
    return (
      <div>
        <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {wallets.map((w) => (
        <button key={w} onClick={() => connect(w)}>
          Connect {w}
        </button>
      ))}
    </div>
  );
}
```

## Pre-built Components

Use the pre-built `WalletButton` component:

```tsx
import { WalletButton, WalletModal } from '@movebridge/react';

function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      {/* Simple button that opens modal */}
      <WalletButton onClick={() => setModalOpen(true)} />
      
      {/* Modal with wallet selection */}
      <WalletModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
```

## Error Handling

Handle wallet-related errors:

```typescript
import { isMovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    switch (error.code) {
      case 'WALLET_NOT_FOUND':
        // Wallet extension not installed
        console.log('Please install', error.details?.wallet);
        break;
      case 'WALLET_CONNECTION_FAILED':
        // User rejected or other connection error
        console.log('Connection failed:', error.message);
        break;
      default:
        console.log('Error:', error.message);
    }
  }
}
```

## Best Practices

1. **Always detect wallets first** - Don't assume a wallet is installed
2. **Handle connection errors gracefully** - Users may reject connections
3. **Listen to account changes** - Users can switch accounts in their wallet
4. **Use auto-connect for better UX** - Remember the user's wallet choice
5. **Clean up event listeners** - Remove listeners when components unmount

## Next Steps

- [Transactions Guide](/docs/guides/transactions) - Send transactions with the connected wallet
- [Error Handling](/docs/guides/error-handling) - Handle errors properly
- [React Components](/docs/packages/react) - Use pre-built UI components
