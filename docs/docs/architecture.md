---
sidebar_position: 6
---

# Architecture

Technical architecture overview of the MoveBridge SDK.

## Package Structure

```
movebridge/
├── packages/
│   ├── core/          # Foundation - wallet, transactions, contracts
│   ├── react/         # React bindings - hooks, components, context
│   ├── codegen/       # CLI tool - TypeScript generation from ABI
│   └── testing/       # Test utilities - mocks, fakers, validators
├── examples/
│   └── demo/          # Next.js demo application
└── demo/
    └── index.html     # Standalone HTML demo
```

## Package Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Next.js    │  │   Vite      │  │  Vanilla TS     │  │
│  │  Demo App   │  │   App       │  │  Application    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    SDK Layer                             │
│  ┌─────────────────────────────────────────────────┐    │
│  │              @movebridge/react                   │    │
│  │  • MovementProvider (context)                   │    │
│  │  • useMovement, useBalance, useContract         │    │
│  │  • WalletButton, AddressDisplay                 │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              @movebridge/core                    │    │
│  │  • Movement client                              │    │
│  │  • WalletManager                                │    │
│  │  • TransactionBuilder                           │    │
│  │  • ContractInterface                            │    │
│  │  • EventListener                                │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
          │                                    │
          ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────────┐
│  @movebridge/codegen│          │  @movebridge/testing    │
│  • ABIParser        │          │  • createTestHarness    │
│  • TypeGenerator    │          │  • createMockClient     │
│  • CLI tool         │          │  • createFaker          │
└─────────────────────┘          │  • validators           │
                                 └─────────────────────────┘
```

## Core Package Architecture

### Components

```
core/src/
├── client.ts        # Movement - main entry point
├── config.ts        # Network configuration, utilities
├── errors.ts        # Structured error handling
├── wallet.ts        # WalletManager - multi-wallet support
├── transaction.ts   # TransactionBuilder - tx construction
├── contract.ts      # ContractInterface - view/entry calls
├── events.ts        # EventListener - subscriptions
└── types.ts         # TypeScript definitions
```

### Movement Client

Central orchestrator that composes all subsystems:

```typescript
class Movement {
  wallet: WalletManager;      // Wallet connections
  transaction: TransactionBuilder; // Transaction building
  events: EventListener;      // Event subscriptions
  
  // Direct methods
  getAccountBalance(address: string): Promise<string>;
  getAccountResources(address: string): Promise<Resource[]>;
  getTransaction(hash: string): Promise<Transaction>;
  waitForTransaction(hash: string): Promise<TransactionResponse>;
  contract(options: ContractOptions): ContractInterface;
}
```

### Data Flow: Transaction

```
User Action
    │
    ▼
┌─────────────────┐
│ TransactionBuilder │
│ • build()         │
│ • transfer()      │
└────────┬──────────┘
         │
         ▼
┌─────────────────┐
│ WalletManager   │
│ • signAndSubmit()│
└────────┬──────────┘
         │
         ▼
┌─────────────────┐
│ Movement Client │
│ • RPC call      │
└────────┬──────────┘
         │
         ▼
   Movement Network
```

## React Package Architecture

### Components

```
react/src/
├── context.tsx      # MovementProvider, context
├── hooks/
│   ├── useMovement.ts         # Wallet state & actions
│   ├── useBalance.ts          # Balance fetching
│   ├── useContract.ts         # Contract interactions
│   ├── useTransaction.ts      # Transaction submission
│   └── useWaitForTransaction.ts # Tx confirmation
└── components/
    ├── WalletButton.tsx       # Connect/disconnect button
    ├── WalletModal.tsx        # Wallet selection modal
    ├── AddressDisplay.tsx     # Formatted address
    └── NetworkSwitcher.tsx    # Network toggle
```

### Context Architecture

```
┌─────────────────────────────────────────────────────┐
│                 MovementProvider                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              MovementContext                   │  │
│  │  • movement: Movement instance                │  │
│  │  • connected: boolean                         │  │
│  │  • address: string | null                     │  │
│  │  • network: NetworkType                       │  │
│  │  • connect/disconnect functions               │  │
│  └───────────────────────────────────────────────┘  │
│                         │                            │
│    ┌────────────────────┼────────────────────┐      │
│    │                    │                    │      │
│    ▼                    ▼                    ▼      │
│ useMovement()     useBalance()        useContract() │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Codegen Architecture

### Generation Flow

```
Move Contract (on-chain)
         │
         ▼
┌─────────────────┐
│   Fetch ABI     │  GET /accounts/{addr}/module/{name}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ABIParser     │  Parse functions, types, generics
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TypeGenerator  │  Emit TypeScript class
└────────┬────────┘
         │
         ▼
   Generated .ts file
```

## Testing Package Architecture

### Test Harness

```
┌─────────────────────────────────────────────────────────┐
│                    createTestHarness()                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │                   TestHarness                    │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │    │
│  │  │MockClient │  │  Faker    │  │ Tracker   │   │    │
│  │  │• mock()   │  │• address()│  │• record() │   │    │
│  │  │• reset()  │  │• balance()│  │• assert() │   │    │
│  │  └───────────┘  └───────────┘  └───────────┘   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐   │    │
│  │  │Simulator  │  │ Snapshot  │  │Validators │   │    │
│  │  │• latency()│  │• take()   │  │• address()│   │    │
│  │  │• timeout()│  │• compare()│  │• tx()     │   │    │
│  │  └───────────┘  └───────────┘  └───────────┘   │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Design Principles

1. **Composition over inheritance** - Small, focused modules that compose together
2. **Type safety first** - Full TypeScript with strict mode
3. **Framework agnostic core** - React bindings are separate from core
4. **Testability** - Every component designed for easy mocking
5. **Progressive disclosure** - Simple defaults, advanced options available
6. **Error transparency** - Structured errors with actionable codes

## Security Considerations

- **No private key handling** - Wallet extensions manage keys
- **Mainnet protection** - Testing utils prevent accidental mainnet calls
- **Input validation** - All addresses and payloads validated
- **Type safety** - Compile-time checks prevent many runtime errors

## Build System

### Monorepo Structure

```
pnpm-workspace.yaml    # Workspace definition
├── packages/*         # Internal packages
└── examples/*         # Demo applications
```

### Build Order

```
1. @movebridge/core     # No internal deps
2. @movebridge/react    # Depends on core
3. @movebridge/codegen  # Depends on core
4. @movebridge/testing  # Depends on core
5. examples/demo        # Depends on core, react
```

### Commands

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Build specific package
pnpm --filter @movebridge/core build

# Run demo
pnpm --filter movebridge-demo dev
```
