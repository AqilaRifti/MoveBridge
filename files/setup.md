# MoveBridge SDK - Setup Guide

Complete guide to setting up MoveBridge SDK in your project.

## Table of Contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Project Setup](#project-setup)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### Runtime
- Node.js 18.0.0 or higher
- npm, yarn, or pnpm

### Browser Support
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### Wallet Extensions (for testing)
- [Razor Wallet](https://razorwallet.xyz/)
- [Nightly Wallet](https://nightly.app/)
- [OKX Wallet](https://www.okx.com/web3)

---

## Installation

### Core Package Only

For vanilla JavaScript/TypeScript projects:

```bash
npm install @movebridge/core
# or
yarn add @movebridge/core
# or
pnpm add @movebridge/core
```

### With React

For React applications:

```bash
npm install @movebridge/core @movebridge/react
```

### Full Suite

For complete development setup:

```bash
# Runtime dependencies
npm install @movebridge/core @movebridge/react

# Development dependencies
npm install -D @movebridge/codegen @movebridge/testing
```

---

## Project Setup

### Vanilla TypeScript

```typescript
// src/movement.ts
import { Movement } from '@movebridge/core';

export const movement = new Movement({
  network: 'testnet',
  autoConnect: true,
});

// Usage
async function main() {
  // Connect wallet
  await movement.wallet.connect('razor');
  
  // Get balance
  const address = movement.wallet.getState().address!;
  const balance = await movement.getAccountBalance(address);
  console.log('Balance:', balance);
}
```

### React (Create React App)

```tsx
// src/App.tsx
import { MovementProvider } from '@movebridge/react';
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <WalletConnect />
    </MovementProvider>
  );
}

export default App;
```

```tsx
// src/components/WalletConnect.tsx
import { useMovement, useBalance } from '@movebridge/react';

export function WalletConnect() {
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
      <p>Balance: {loading ? 'Loading...' : balance}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### Next.js

```tsx
// app/providers.tsx
'use client';

import { MovementProvider } from '@movebridge/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MovementProvider network="testnet" autoConnect>
      {children}
    </MovementProvider>
  );
}
```

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx
'use client';

import { useMovement, useBalance } from '@movebridge/react';

export default function Home() {
  const { address, connected } = useMovement();
  const { balance } = useBalance();

  return (
    <main>
      {connected ? (
        <p>Balance: {balance}</p>
      ) : (
        <p>Please connect wallet</p>
      )}
    </main>
  );
}
```

### Vite

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MovementProvider } from '@movebridge/react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MovementProvider network="testnet">
      <App />
    </MovementProvider>
  </React.StrictMode>
);
```

---

## Configuration

### Network Configuration

```typescript
import { Movement } from '@movebridge/core';

// Testnet (default)
const testnet = new Movement({ network: 'testnet' });

// Mainnet
const mainnet = new Movement({ network: 'mainnet' });

// Custom RPC
const custom = new Movement({
  network: 'testnet',
  rpcUrl: 'https://your-custom-rpc.com/v1',
  indexerUrl: 'https://your-indexer.com/v1',
});
```

### Provider Options

```tsx
<MovementProvider
  network="testnet"           // 'mainnet' | 'testnet'
  autoConnect={true}          // Auto-reconnect to last wallet
  onError={(error) => {       // Global error handler
    console.error(error.code, error.message);
  }}
>
  {children}
</MovementProvider>
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true
  }
}
```

---

## Code Generation Setup

### Generate Contract Types

```bash
# Install CLI
npm install -D @movebridge/codegen

# Generate types for a contract
npx movebridge-gen \
  --address 0x1::coin \
  --network testnet \
  --output ./src/contracts/coin.ts
```

### Use Generated Types

```typescript
// src/contracts/coin.ts (generated)
import type { Movement } from '@movebridge/core';

export class CoinContract {
  constructor(private movement: Movement) {}
  
  async balance(owner: string, typeArgs: string[]): Promise<string> {
    // ...
  }
}
```

```typescript
// src/app.ts
import { Movement } from '@movebridge/core';
import { CoinContract } from './contracts/coin';

const movement = new Movement({ network: 'testnet' });
const coin = new CoinContract(movement);

const balance = await coin.balance(address, ['0x1::aptos_coin::AptosCoin']);
```

---

## Testing Setup

### Install Testing Package

```bash
npm install -D @movebridge/testing vitest
```

### Configure Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

### Write Tests

```typescript
// src/__tests__/wallet.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestHarness } from '@movebridge/testing';

describe('Wallet Integration', () => {
  let harness: ReturnType<typeof createTestHarness>;

  beforeEach(() => {
    harness = createTestHarness({ seed: 12345 });
  });

  afterEach(() => {
    harness.cleanup();
  });

  it('should fetch balance', async () => {
    harness.client.mockResponse('getAccountBalance', '1000000000');

    const balance = await harness.client.getAccountBalance('0x1');

    expect(balance).toBe('1000000000');
    harness.tracker.assertCalled('getAccountBalance');
  });
});
```

---

## Verification

### Check Installation

```typescript
// verify.ts
import { Movement } from '@movebridge/core';

const movement = new Movement({ network: 'testnet' });
console.log('SDK initialized:', movement.config);
// Should print: { network: 'testnet', chainId: 250, ... }
```

### Test Wallet Detection

```typescript
const wallets = movement.wallet.detectWallets();
console.log('Available wallets:', wallets);
// Should print: ['razor'] or similar
```

### Test Network Connection

```typescript
try {
  const balance = await movement.getAccountBalance('0x1');
  console.log('Network connected, balance:', balance);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Troubleshooting

### "Module not found" Error

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Ensure you have the correct TypeScript version:
```bash
npm install -D typescript@^5.0.0
```

### Wallet Not Detected

1. Install wallet extension
2. Refresh the page
3. Check browser console for errors
4. Ensure wallet is unlocked

### Network Errors

1. Check internet connection
2. Verify RPC URL is correct
3. Try switching networks in wallet
4. Check if testnet is operational

### React Hydration Errors (Next.js)

Ensure wallet-related code is client-side only:
```tsx
'use client'; // Add this directive

import { useMovement } from '@movebridge/react';
```

### Build Errors

```bash
# Rebuild packages
npm run build

# Clear cache
npm cache clean --force
```

---

## Environment Variables

For production deployments:

```env
# .env.local
NEXT_PUBLIC_MOVEMENT_NETWORK=mainnet
NEXT_PUBLIC_MOVEMENT_RPC_URL=https://your-rpc.com/v1
```

```typescript
const movement = new Movement({
  network: process.env.NEXT_PUBLIC_MOVEMENT_NETWORK as 'mainnet' | 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_MOVEMENT_RPC_URL,
});
```

---

## Next Steps

1. **Explore the demo** - See `docs/demo.md`
2. **Read the API docs** - See `README.md`
3. **Generate contract types** - Use `@movebridge/codegen`
4. **Write tests** - Use `@movebridge/testing`
5. **Join the community** - Get help and share feedback
