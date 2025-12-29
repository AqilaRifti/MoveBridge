---
sidebar_position: 2
---

# WalletManager

Handles wallet detection, connection, and state management.

## Import

```typescript
import { WalletManager } from '@movebridge/core';
```

## Access

```typescript
const movement = new Movement({ network: 'testnet' });
const walletManager = movement.wallet;
```

## Methods

### detectWallets

Detect available wallet extensions.

```typescript
detectWallets(): WalletType[]
```

#### Returns

`WalletType[]` - Array of available wallet types

```typescript
type WalletType = 'petra' | 'pontem' | 'nightly';
```

#### Example

```typescript
const wallets = movement.wallet.detectWallets();
console.log('Available:', wallets); // ['petra', 'pontem']
```

### getWalletInfo

Get detailed information about available wallets.

```typescript
getWalletInfo(): Array<{ type: WalletType; name: string; icon: string }>
```

#### Returns

Array of wallet info objects with type, display name, and icon URL.

#### Example

```typescript
const info = movement.wallet.getWalletInfo();
// [{ type: 'petra', name: 'Petra Wallet', icon: 'data:image/...' }]
```

### connect

Connect to a wallet.

```typescript
connect(wallet: WalletType): Promise<void>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `wallet` | `WalletType` | Wallet type to connect |

#### Throws

- `MovementError` with code `WALLET_NOT_FOUND` if wallet not installed
- `MovementError` with code `WALLET_CONNECTION_FAILED` if connection fails

#### Example

```typescript
try {
  await movement.wallet.connect('petra');
  console.log('Connected!');
} catch (error) {
  if (error.code === 'WALLET_NOT_FOUND') {
    console.log('Please install Petra wallet');
  }
}
```

### disconnect

Disconnect from the current wallet.

```typescript
disconnect(): Promise<void>
```

#### Example

```typescript
await movement.wallet.disconnect();
```

### getState

Get the current wallet state.

```typescript
getState(): WalletState
```

#### Returns

```typescript
interface WalletState {
  connected: boolean;
  address: string | null;
  publicKey: string | null;
}
```

#### Example

```typescript
const state = movement.wallet.getState();
if (state.connected) {
  console.log('Address:', state.address);
}
```

### getWallet

Get the currently connected wallet type.

```typescript
getWallet(): WalletType | null
```

#### Returns

`WalletType | null` - Current wallet type or null if not connected

#### Example

```typescript
const wallet = movement.wallet.getWallet();
console.log('Connected to:', wallet); // 'petra' or null
```

### autoConnect

Attempt to reconnect to the last used wallet.

```typescript
autoConnect(): Promise<void>
```

#### Example

```typescript
await movement.wallet.autoConnect();
```

### destroy

Clean up event listeners and resources.

```typescript
destroy(): void
```

#### Example

```typescript
movement.wallet.destroy();
```

## Events

The WalletManager extends EventEmitter and emits the following events:

### connect

Emitted when a wallet is connected.

```typescript
movement.wallet.on('connect', (address: string) => {
  console.log('Connected to:', address);
});
```

### disconnect

Emitted when a wallet is disconnected.

```typescript
movement.wallet.on('disconnect', () => {
  console.log('Wallet disconnected');
});
```

### accountChanged

Emitted when the user switches accounts in their wallet.

```typescript
movement.wallet.on('accountChanged', (newAddress: string) => {
  console.log('Account changed to:', newAddress);
});
```

### networkChanged

Emitted when the wallet's network changes.

```typescript
movement.wallet.on('networkChanged', (network: string) => {
  console.log('Network changed to:', network);
});
```

## Event Methods

### on

Subscribe to an event.

```typescript
on<E extends keyof WalletEvents>(
  event: E,
  listener: WalletEvents[E]
): this
```

### off

Unsubscribe from an event.

```typescript
off<E extends keyof WalletEvents>(
  event: E,
  listener: WalletEvents[E]
): this
```

### once

Subscribe to an event once.

```typescript
once<E extends keyof WalletEvents>(
  event: E,
  listener: WalletEvents[E]
): this
```

## Complete Example

```typescript
const movement = new Movement({ network: 'testnet' });

// Set up event listeners
movement.wallet.on('connect', (address) => {
  console.log('Connected:', address);
});

movement.wallet.on('disconnect', () => {
  console.log('Disconnected');
});

movement.wallet.on('accountChanged', (newAddress) => {
  console.log('Account changed:', newAddress);
});

// Detect and connect
const wallets = movement.wallet.detectWallets();
if (wallets.includes('petra')) {
  await movement.wallet.connect('petra');
}

// Check state
const state = movement.wallet.getState();
console.log('State:', state);

// Later: disconnect
await movement.wallet.disconnect();
```
