# MoveBridge SDK

> ethers.js for Movement Network

MoveBridge SDK is a comprehensive TypeScript SDK that simplifies frontend development on Movement Network. It provides a unified, developer-friendly interface that abstracts wallet complexity and provides type-safe contract interactions.

## Features

- ✅ **Unified wallet connection** - Support for Petra, Pontem, and Nightly wallets
- ✅ **Type-safe contract interactions** - Full TypeScript support with auto-generated types
- ✅ **React hooks** - Easy integration with React applications
- ✅ **Auto-generated types** - Generate TypeScript bindings from deployed Move modules
- ✅ **Event subscriptions** - Real-time contract event listening
- ✅ **Transaction simulation** - Estimate gas before submitting

## Demos

### Interactive Demo

Open `demo/index.html` in your browser for a quick standalone demo that works without a build step.

### Full Demo App

A complete Next.js demo application showcasing all SDK features:

```bash
# From the monorepo root
pnpm install
pnpm build
pnpm --filter movebridge-demo dev
```

Then open [http://localhost:3000](http://localhost:3000)

Features:
- Dashboard with account overview
- Token transfers with transaction tracking
- Contract interaction (view & entry functions)
- Real-time event subscriptions

## Packages

| Package | Description |
|---------|-------------|
| `@movebridge/core` | Core SDK with wallet management, transactions, and contract interactions |
| `@movebridge/react` | React hooks and pre-built components |
| `@movebridge/codegen` | CLI tool for generating TypeScript bindings |
| `@movebridge/testing` | Testing utilities: mocks, fakers, validators |

## Quick Start

### Installation

```bash
# Core SDK
npm install @movebridge/core

# React integration
npm install @movebridge/react

# Code generation CLI
npm install -D @movebridge/codegen

# Testing utilities
npm install -D @movebridge/testing
```

### Basic Usage

```typescript
import { Movement } from '@movebridge/core';

// Initialize client
const movement = new Movement({ network: 'testnet' });

// Connect wallet
await movement.wallet.connect('petra');

// Get balance
const balance = await movement.getAccountBalance(movement.wallet.getState().address!);
console.log('Balance:', balance);

// Transfer tokens
const tx = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000', // 1 APT in octas
});
const hash = await movement.transaction.signAndSubmit(tx);
console.log('Transaction:', hash);
```

### React Integration

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

### Pre-built Components

```tsx
import { WalletButton, WalletModal, AddressDisplay } from '@movebridge/react';

// Drop-in wallet button
<WalletButton />

// Wallet selection modal
<WalletModal open={isOpen} onClose={() => setIsOpen(false)} />

// Address display with copy
<AddressDisplay address="0x123..." truncate copyable />
```

### Contract Interactions

```typescript
// Create contract interface
const contract = movement.contract({
  address: '0x123...',
  module: 'counter',
});

// Read (view function)
const count = await contract.view('get_count', []);

// Write (entry function)
const txHash = await contract.call('increment', []);
await movement.waitForTransaction(txHash);
```

### Type Generation

Generate TypeScript bindings from deployed contracts:

```bash
npx movebridge-gen \
  --address 0x1::coin \
  --network testnet \
  --output ./src/types/coin.ts
```

This generates a fully-typed contract class:

```typescript
import { CoinContract } from './types/coin';

const coin = new CoinContract(movement);
const balance = await coin.balance('0x123...', ['0x1::aptos_coin::AptosCoin']);
```

## API Reference

### Movement Client

```typescript
const movement = new Movement({
  network: 'testnet', // 'mainnet' | 'testnet'
  rpcUrl?: string,    // Custom RPC URL
  indexerUrl?: string, // Custom indexer URL
  autoConnect?: boolean, // Auto-connect to last wallet
});

// Methods
movement.getAccountBalance(address: string): Promise<string>
movement.getAccountResources(address: string): Promise<Resource[]>
movement.getTransaction(hash: string): Promise<Transaction>
movement.waitForTransaction(hash: string): Promise<TransactionResponse>
movement.contract(options: ContractOptions): ContractInterface
```

### Wallet Manager

```typescript
movement.wallet.detectWallets(): WalletType[]
movement.wallet.connect(wallet: WalletType): Promise<void>
movement.wallet.disconnect(): Promise<void>
movement.wallet.getState(): WalletState

// Events
movement.wallet.on('connect', (address) => {})
movement.wallet.on('disconnect', () => {})
movement.wallet.on('accountChanged', (newAddress) => {})
movement.wallet.on('networkChanged', (network) => {})
```

### Transaction Builder

```typescript
// Transfer
const tx = await movement.transaction.transfer({
  to: '0x123...',
  amount: '1000000',
  coinType?: '0x1::aptos_coin::AptosCoin',
});

// Build custom transaction
const tx = await movement.transaction.build({
  function: '0x1::counter::increment',
  typeArguments: [],
  arguments: [],
});

// Sign and submit
const hash = await movement.transaction.signAndSubmit(tx);
```

### React Hooks

```typescript
// Wallet connection
const { address, connected, connecting, connect, disconnect, wallets, wallet } = useMovement();

// Balance
const { balance, loading, error, refetch } = useBalance(address?);

// Contract
const { data, loading, error, read, write } = useContract({ address, module });

// Transaction
const { send, data, loading, error, reset } = useTransaction();

// Wait for confirmation
const { data, loading, error } = useWaitForTransaction(hash);
```

## Network Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 126 | https://full.mainnet.movementinfra.xyz/v1 |
| Testnet | 250 | https://testnet.movementnetwork.xyz/v1 |

## Error Handling

All SDK errors are instances of `MovementError`:

```typescript
import { MovementError, isMovementError } from '@movebridge/core';

try {
  await movement.wallet.connect('petra');
} catch (error) {
  if (isMovementError(error)) {
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Details:', error.details);
  }
}
```

Error codes:
- `INVALID_ADDRESS` - Invalid address format
- `WALLET_NOT_FOUND` - Wallet not installed
- `WALLET_CONNECTION_FAILED` - Connection rejected
- `TRANSACTION_FAILED` - Transaction execution failed
- `VIEW_FUNCTION_FAILED` - View function call failed
- `NETWORK_ERROR` - Network request failed

## Testing

The `@movebridge/testing` package provides comprehensive testing utilities:

```typescript
import { 
  createTestHarness, 
  createFaker,
  isValidAddress,
  validateSchema 
} from '@movebridge/testing';

// Create a test harness with mocked components
const harness = createTestHarness({ seed: 12345 });

// Configure mock responses
harness.client.mockResponse('getAccountBalance', '1000000000');

// Use the mocked client
const balance = await harness.client.getAccountBalance('0x1');

// Assert on calls
harness.tracker.assertCalled('getAccountBalance');
harness.tracker.assertCalledWith('getAccountBalance', '0x1');

// Simulate network conditions
harness.simulator.simulateLatency(100);
harness.simulator.simulateNetworkError();
harness.simulator.simulateRateLimit(5);

// Generate fake data
const faker = createFaker({ seed: 42 });
const address = faker.fakeAddress();
const balance = faker.fakeBalance({ min: '0', max: '1000000000' });
const tx = faker.fakeTransaction();

// Validate data
isValidAddress('0x1234...'); // true/false
validateSchema(data, 'Resource'); // throws if invalid

// Cleanup
harness.cleanup();
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## License

MIT
