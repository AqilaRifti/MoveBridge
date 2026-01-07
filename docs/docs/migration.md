---
sidebar_position: 7
---

# Migration Guide

Guide for migrating from raw Aptos SDK to MoveBridge.

## From @aptos-labs/ts-sdk

### Client Initialization

**Before (Aptos SDK):**
```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({
  network: Network.TESTNET,
});
const aptos = new Aptos(config);
```

**After (MoveBridge):**
```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({
  network: 'testnet',
});
```

### Wallet Connection

**Before (Manual wallet handling):**
```typescript
// Each wallet has different APIs
const razor = window.razor;
await razor.connect();
const account = await razor.account();
```

**After (MoveBridge):**
```typescript
// Unified API for all wallets
await movement.wallet.connect('razor');
const state = movement.wallet.getState();
```

### Getting Balance

**Before:**
```typescript
const resources = await aptos.getAccountResources({
  accountAddress: address,
});
const coinResource = resources.find(
  r => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
);
const balance = coinResource?.data?.coin?.value ?? '0';
```

**After:**
```typescript
const balance = await movement.getAccountBalance(address);
```

### Sending Transactions

**Before:**
```typescript
const transaction = await aptos.transaction.build.simple({
  sender: account.address,
  data: {
    function: '0x1::coin::transfer',
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    functionArguments: [recipient, amount],
  },
});
const signedTx = await razor.signTransaction(transaction);
const result = await aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator: signedTx,
});
```

**After:**
```typescript
const payload = await movement.transaction.transfer({
  to: recipient,
  amount,
});
const hash = await movement.transaction.signAndSubmit(payload);
```

### View Functions

**Before:**
```typescript
const result = await aptos.view({
  payload: {
    function: '0x1::coin::balance',
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    functionArguments: [address],
  },
});
```

**After:**
```typescript
const contract = movement.contract({
  address: '0x1',
  module: 'coin',
});
const result = await contract.view('balance', [address], [
  '0x1::aptos_coin::AptosCoin',
]);
```

### Error Handling

**Before:**
```typescript
try {
  await razor.connect();
} catch (error) {
  // Generic error handling
  console.log(error.message);
}
```

**After:**
```typescript
import { isMovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('razor');
} catch (error) {
  if (isMovementError(error)) {
    // Typed error handling
    switch (error.code) {
      case 'WALLET_NOT_FOUND':
        // Handle missing wallet
        break;
      case 'WALLET_CONNECTION_FAILED':
        // Handle rejection
        break;
    }
  }
}
```

## From Custom React Implementation

### Context Provider

**Before:**
```tsx
const WalletContext = createContext(null);

function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Manual wallet detection, connection, events...
  
  return (
    <WalletContext.Provider value={{ address, connected, ... }}>
      {children}
    </WalletContext.Provider>
  );
}
```

**After:**
```tsx
import { MovementProvider } from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      {children}
    </MovementProvider>
  );
}
```

### Wallet Hook

**Before:**
```tsx
function useWallet() {
  const context = useContext(WalletContext);
  // Custom implementation...
  return { address, connect, disconnect, ... };
}
```

**After:**
```tsx
import { useMovement } from '@movebridge/react';

function MyComponent() {
  const { address, connected, connect, disconnect, wallets } = useMovement();
  // Ready to use!
}
```

### Balance Hook

**Before:**
```tsx
function useBalance(address) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Manual fetching logic...
  }, [address]);
  
  return { balance, loading };
}
```

**After:**
```tsx
import { useBalance } from '@movebridge/react';

function MyComponent() {
  const { balance, loading, error, refetch } = useBalance();
  // Automatic fetching, error handling, refetch included
}
```

## Migration Checklist

### 1. Install Packages

```bash
npm install @movebridge/core @movebridge/react
npm install -D @movebridge/codegen @movebridge/testing
```

### 2. Update Imports

```typescript
// Remove
import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';

// Add
import { Movement } from '@movebridge/core';
import { MovementProvider, useMovement } from '@movebridge/react';
```

### 3. Replace Client Initialization

```typescript
// Remove Aptos client setup
// Add Movement client
const movement = new Movement({ network: 'testnet' });
```

### 4. Update Wallet Code

- Replace manual wallet detection with `movement.wallet.detectWallets()`
- Replace wallet-specific connect calls with `movement.wallet.connect(walletType)`
- Replace manual event handling with `movement.wallet.on(event, handler)`

### 5. Update Transaction Code

- Replace manual transaction building with `movement.transaction.build()` or `movement.transaction.transfer()`
- Replace manual signing with `movement.transaction.signAndSubmit()`

### 6. Update React Components

- Wrap app with `MovementProvider`
- Replace custom hooks with MoveBridge hooks
- Replace custom components with MoveBridge components

### 7. Update Error Handling

- Use `isMovementError()` type guard
- Handle specific error codes

### 8. Update Tests

```typescript
// Use MoveBridge testing utilities
import { createTestHarness } from '@movebridge/testing';

const harness = createTestHarness();
harness.client.mockResponse('getAccountBalance', '1000000000');
```

## Gradual Migration

You can migrate gradually by using both SDKs:

```typescript
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });

// Access underlying Aptos client for unsupported features
const aptosClient = movement.getAptosClient();

// Use MoveBridge for supported features
await movement.wallet.connect('razor');
const balance = await movement.getAccountBalance(address);

// Use Aptos SDK for advanced features
const modules = await aptosClient.getAccountModules({ accountAddress: '0x1' });
```

## Need Help?

- [GitHub Issues](https://github.com/AqilaRifti/MoveBridge/issues)
- [Documentation](/)
- [Examples](/docs/examples/basic-usage)
