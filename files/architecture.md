# MoveBridge SDK - Architecture

## Overview

MoveBridge is a monorepo containing four packages that work together to provide a complete Movement Network development experience.

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                    (Your dApp / Demo App)                   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  @movebridge  │    │  @movebridge  │    │  @movebridge  │
│    /react     │    │   /codegen    │    │   /testing    │
│               │    │               │    │               │
│  React Hooks  │    │  CLI Tool     │    │  Test Utils   │
│  Components   │    │  Type Gen     │    │  Mocks        │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────────┐
                    │   @movebridge     │
                    │      /core        │
                    │                   │
                    │  Movement Client  │
                    │  Wallet Manager   │
                    │  Transaction Bld  │
                    │  Contract Iface   │
                    │  Event Listener   │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  @aptos-labs/     │
                    │    ts-sdk         │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  Movement Network │
                    │  (RPC / Indexer)  │
                    └───────────────────┘
```

## Package Details

### @movebridge/core

The foundation layer. All other packages depend on this.

```
packages/core/src/
├── index.ts          # Public exports
├── client.ts         # Movement - main entry point
├── config.ts         # Network configuration
├── errors.ts         # Structured error handling
├── wallet.ts         # WalletManager - multi-wallet support
├── transaction.ts    # TransactionBuilder
├── contract.ts       # ContractInterface
├── events.ts         # EventListener - subscriptions
└── types.ts          # TypeScript definitions
```

**Key Classes:**

| Class | Responsibility |
|-------|----------------|
| `Movement` | Main client, orchestrates all modules |
| `WalletManager` | Detects, connects, manages wallet state |
| `TransactionBuilder` | Builds, simulates, signs, submits transactions |
| `ContractInterface` | View/entry function calls on contracts |
| `EventListener` | Subscribe to on-chain events |

**Design Patterns:**
- Facade pattern: `Movement` class provides simple API over complex subsystems
- Event emitter: Wallet state changes broadcast via EventEmitter3
- Builder pattern: Transaction construction with fluent API

### @movebridge/react

React bindings built on top of core.

```
packages/react/src/
├── index.ts          # Public exports
├── context.tsx       # MovementProvider + Context
├── hooks.ts          # useMovement, useBalance, useContract, etc.
└── components.tsx    # WalletButton, WalletModal, AddressDisplay
```

**Hooks:**

| Hook | Purpose |
|------|---------|
| `useMovement()` | Wallet connection state + actions |
| `useBalance(address?)` | Fetch and cache balance |
| `useContract(options)` | Contract read/write operations |
| `useTransaction()` | Send transactions with status tracking |
| `useWaitForTransaction(hash)` | Poll for transaction confirmation |

**Components:**

| Component | Purpose |
|-----------|---------|
| `WalletButton` | Connect/disconnect button |
| `WalletModal` | Wallet selection dialog |
| `AddressDisplay` | Truncated address with copy |
| `NetworkSwitcher` | Network selection dropdown |

### @movebridge/codegen

CLI tool for generating TypeScript from deployed Move modules.

```
packages/codegen/src/
├── index.ts          # Public exports
├── cli.ts            # Commander CLI entry point
├── parser.ts         # ABIParser - parse module ABI
└── generator.ts      # TypeGenerator - emit TypeScript
```

**Flow:**
1. Fetch module ABI from chain via RPC
2. Parse function signatures, type parameters, arguments
3. Generate TypeScript class with typed methods
4. Output to specified file

**Generated Code Structure:**
```typescript
export class CoinContract {
  constructor(movement: Movement) { ... }
  
  // View functions
  async balance(owner: string, typeArgs: [string]): Promise<string> { ... }
  
  // Entry functions  
  async transfer(to: string, amount: string, typeArgs: [string]): Promise<string> { ... }
}
```

### @movebridge/testing

Testing utilities for applications using MoveBridge.

```
packages/testing/src/
├── index.ts          # Public exports
├── harness.ts        # createTestHarness - all-in-one setup
├── mock-client.ts    # MockMovementClient
├── faker.ts          # Fake data generation
├── simulator.ts      # Network condition simulation
├── tracker.ts        # Call tracking and assertions
├── snapshots.ts      # State snapshot utilities
├── integration.ts    # Integration test helpers
└── validators/
    ├── address.ts    # Address validation
    ├── transaction.ts # Transaction payload validation
    └── schema.ts     # JSON schema validation
```

**Test Harness:**
```typescript
const harness = createTestHarness({ seed: 12345 });

// Mock responses
harness.client.mockResponse('getAccountBalance', '1000000');

// Track calls
harness.tracker.assertCalled('getAccountBalance');

// Simulate conditions
harness.simulator.simulateLatency(100);
harness.simulator.simulateNetworkError();

// Generate fake data
const address = harness.faker.fakeAddress();
```

## Data Flow

### Wallet Connection
```
User clicks "Connect"
        │
        ▼
useMovement().connect('razor')
        │
        ▼
WalletManager.connect()
        │
        ├── Detect wallet extension
        ├── Request connection
        ├── Get account info
        └── Emit 'connect' event
        │
        ▼
Context updates → Components re-render
```

### Transaction Submission
```
User initiates transfer
        │
        ▼
useTransaction().send(payload)
        │
        ▼
TransactionBuilder.build()
        │
        ├── Construct payload
        ├── Simulate (optional)
        └── Return raw transaction
        │
        ▼
TransactionBuilder.signAndSubmit()
        │
        ├── Wallet signs
        └── Submit to RPC
        │
        ▼
useWaitForTransaction(hash)
        │
        ├── Poll RPC
        └── Return result
```

## Error Handling

All errors are wrapped in `MovementError`:

```typescript
class MovementError extends Error {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
```

Error codes:
- `INVALID_ADDRESS`
- `WALLET_NOT_FOUND`
- `WALLET_CONNECTION_FAILED`
- `TRANSACTION_FAILED`
- `VIEW_FUNCTION_FAILED`
- `NETWORK_ERROR`

## Build System

- **Bundler:** tsup (esbuild-based)
- **Output:** ESM + CJS + TypeScript declarations
- **Monorepo:** pnpm workspaces
- **Testing:** Vitest with property-based testing (fast-check)

## Network Configuration

```typescript
const NETWORK_CONFIG = {
  mainnet: {
    chainId: 126,
    rpcUrl: 'https://full.mainnet.movementinfra.xyz/v1',
    indexerUrl: 'https://indexer.mainnet.movementinfra.xyz/v1',
  },
  testnet: {
    chainId: 250,
    rpcUrl: 'https://testnet.movementnetwork.xyz/v1',
    indexerUrl: 'https://indexer.testnet.movementnetwork.xyz/v1',
  },
};
```
