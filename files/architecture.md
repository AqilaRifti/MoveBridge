# MoveBridge SDK - Architecture

Technical architecture overview of the MoveBridge SDK monorepo.

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

---

## Core Package (`@movebridge/core`)

The foundation layer providing all blockchain interactions.

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
  tx: TransactionBuilder;     // Transaction building
  contract: ContractInterface; // Contract calls
  events: EventListener;      // Event subscriptions
  
  // Direct methods
  getAccountBalance(address: string): Promise<string>;
  getAccountResources(address: string): Promise<Resource[]>;
  submitTransaction(payload: TransactionPayload): Promise<string>;
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

### Error Handling

Structured errors with codes for programmatic handling:

```typescript
enum ErrorCode {
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  // ...
}

class MovementError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
}
```

---

## React Package (`@movebridge/react`)

React bindings built on top of core.

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

### Hook Data Flow

```typescript
// useBalance hook flow
function useBalance() {
  const { movement, address } = useMovementContext();
  const [balance, setBalance] = useState<string | null>(null);
  
  useEffect(() => {
    if (!address) return;
    
    let cancelled = false;
    movement.getAccountBalance(address)
      .then(b => !cancelled && setBalance(b));
    
    return () => { cancelled = true; };
  }, [movement, address]);
  
  return { balance, loading, refetch };
}
```

---

## Codegen Package (`@movebridge/codegen`)

CLI tool for generating TypeScript from Move ABIs.

### Components

```
codegen/src/
├── parser.ts        # ABIParser - parse Move module ABI
├── generator.ts     # TypeGenerator - emit TypeScript
└── index.ts         # Exports
```

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

### Generated Output Structure

```typescript
// Generated: coin.ts
import type { Movement } from '@movebridge/core';

export class CoinContract {
  constructor(private movement: Movement) {}
  
  // View functions
  async balance<CoinType>(owner: string): Promise<string> {
    return this.movement.contract.view({
      function: '0x1::coin::balance',
      typeArguments: [CoinType],
      arguments: [owner],
    });
  }
  
  // Entry functions
  async transfer<CoinType>(to: string, amount: string): Promise<string> {
    return this.movement.contract.call({
      function: '0x1::coin::transfer',
      typeArguments: [CoinType],
      arguments: [to, amount],
    });
  }
}
```

---

## Testing Package (`@movebridge/testing`)

Comprehensive testing utilities.

### Components

```
testing/src/
├── harness.ts       # createTestHarness - unified test setup
├── mock-client.ts   # createMockClient - mock Movement client
├── faker.ts         # createFaker - deterministic fake data
├── tracker.ts       # createCallTracker - call assertions
├── simulator.ts     # createNetworkSimulator - network conditions
├── snapshots.ts     # createSnapshotUtils - snapshot testing
├── integration.ts   # createIntegrationUtils - live testing
└── validators/
    ├── address.ts   # Address validation
    ├── transaction.ts # Transaction validation
    └── schema.ts    # JSON schema validation
```

### Test Harness Architecture

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

### Mock Client Flow

```typescript
// Setup
const harness = createTestHarness({ seed: 12345 });

// Configure mock
harness.client.mockResponse('getAccountBalance', '1000000000');

// Execute code under test
const balance = await harness.client.getAccountBalance('0x1');

// Assert
harness.tracker.assertCalled('getAccountBalance');
harness.tracker.assertCalledWith('getAccountBalance', ['0x1']);

// Cleanup
harness.cleanup();
```

### Network Simulation

```typescript
const simulator = createNetworkSimulator();

// Simulate conditions
simulator.setLatency(100);           // 100ms delay
simulator.enableTimeout(5000);       // 5s timeout
simulator.enableNetworkError();      // Connection failures
simulator.enableRateLimit(10);       // 10 calls then 429

// Apply to mock client
harness.client.setSimulator(simulator);
```

---

## Extension Points

### Custom Wallet Adapter

```typescript
// Implement WalletAdapter interface
interface WalletAdapter {
  name: string;
  connect(): Promise<{ address: string }>;
  disconnect(): Promise<void>;
  signTransaction(tx: TransactionPayload): Promise<SignedTransaction>;
  signAndSubmitTransaction(tx: TransactionPayload): Promise<string>;
}

// Register with WalletManager
movement.wallet.registerAdapter(new MyWalletAdapter());
```

### Custom Network

```typescript
const movement = new Movement({
  network: 'custom',
  rpcUrl: 'https://my-node.example.com/v1',
  indexerUrl: 'https://my-indexer.example.com/v1',
  chainId: 999,
});
```

### Custom Validators

```typescript
import { registerSchema } from '@movebridge/testing';

registerSchema('myCustomType', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    value: { type: 'number' },
  },
  required: ['id', 'value'],
});
```

---

## Build & Development

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

---

## Design Principles

1. **Composition over inheritance** - Small, focused modules that compose together
2. **Type safety first** - Full TypeScript with strict mode
3. **Framework agnostic core** - React bindings are separate from core
4. **Testability** - Every component designed for easy mocking
5. **Progressive disclosure** - Simple defaults, advanced options available
6. **Error transparency** - Structured errors with actionable codes

---

## Security Considerations

- **No private key handling** - Wallet extensions manage keys
- **Mainnet protection** - Testing utils prevent accidental mainnet calls
- **Input validation** - All addresses and payloads validated
- **Type safety** - Compile-time checks prevent many runtime errors
