# MoveBridge SDK - Submission Details

## What is MoveBridge?

MoveBridge SDK is a comprehensive TypeScript SDK for Movement Network - essentially **"ethers.js for Movement"**. It provides a unified, developer-friendly interface for building dApps on Movement blockchain, abstracting away the complexity of wallet integrations, transaction building, and contract interactions.

## The Problem We Solve

Building dApps on Movement Network today requires:
- Writing separate integration code for each wallet (Razor, Nightly, OKX)
- Working with untyped responses from the Aptos SDK
- No abstraction layer for common operations
- Testing against live testnets (slow, flaky CI)
- Building React hooks and components from scratch

MoveBridge eliminates all of this friction.

## What We Built

### Package 1: @movebridge/core (v0.3.0)

The foundation layer providing:

- **Movement Client** - Main entry point with network configuration
- **WalletManager** - Unified API for Razor, Nightly, and OKX wallets with event emitters for state changes
- **TransactionBuilder** - Build, simulate, sign, and submit transactions
- **ContractInterface** - Call view functions (read) and entry functions (write) on any deployed contract
- **EventListener** - Subscribe to real-time on-chain events with callbacks

```typescript
const movement = new Movement({ network: 'testnet' });
await movement.wallet.connect('razor');
const balance = await movement.getAccountBalance(address);
```

### Package 2: @movebridge/react (v0.3.0)

React bindings with:

- **MovementProvider** - Context provider for app-wide state
- **useMovement()** - Wallet connection state and actions
- **useBalance()** - Fetch and cache account balance
- **useContract()** - Contract read/write with loading states
- **useTransaction()** - Send transactions with status tracking
- **useWaitForTransaction()** - Poll for confirmation
- **Pre-built Components** - WalletButton, WalletModal, AddressDisplay, NetworkSwitcher

```tsx
const { address, connect, disconnect } = useMovement();
const { balance, loading } = useBalance();
```

### Package 3: @movebridge/codegen (v0.3.0)

CLI tool for type generation:

- Fetches module ABI from deployed contracts
- Parses function signatures, type parameters, and arguments
- Generates fully-typed TypeScript classes
- Supports both view and entry functions

```bash
npx movebridge-gen --address 0x1::coin --network testnet --output ./types/coin.ts
```

### Package 4: @movebridge/testing (v0.3.0)

Comprehensive testing utilities:

- **Test Harness** - All-in-one setup with mocked client
- **Mock Client** - Mock any SDK response
- **Faker** - Generate fake addresses, balances, transactions
- **Network Simulator** - Simulate latency, errors, rate limits
- **Call Tracker** - Assert on method calls
- **Validators** - Address, transaction, and schema validation

```typescript
const harness = createTestHarness({ seed: 12345 });
harness.client.mockResponse('getAccountBalance', '1000000');
harness.tracker.assertCalled('getAccountBalance');
```

## Demo Application

Built a complete Next.js demo app showcasing all SDK features:

- **Dashboard** - Wallet connection, balance display
- **Transfer** - Token transfers with transaction tracking
- **Contract** - View and entry function calls
- **Events** - Real-time event subscriptions with live log

## Documentation Site

Complete Docusaurus documentation with:

- Getting started guide
- Package-specific documentation
- API reference
- Code examples (TypeScript + React)
- Migration guide from raw Aptos SDK
- Golden Gate Bridge-inspired orange theme

## Technical Implementation

### Architecture
- Monorepo with pnpm workspaces
- Each package builds to ESM + CJS with TypeScript declarations
- Core package uses facade pattern for clean API
- React package uses context + hooks pattern
- Event-driven architecture with EventEmitter3

### Build System
- **Bundler:** tsup (esbuild-based, fast builds)
- **Testing:** Vitest with property-based testing via fast-check
- **Linting:** ESLint + Prettier
- **Types:** Full TypeScript with strict mode

### Error Handling
All errors wrapped in `MovementError` with typed error codes:
- INVALID_ADDRESS
- WALLET_NOT_FOUND
- WALLET_CONNECTION_FAILED
- TRANSACTION_FAILED
- VIEW_FUNCTION_FAILED
- NETWORK_ERROR

## Development Process

1. **Research** - Studied Aptos SDK, wallet adapter patterns, and ethers.js API design
2. **Architecture** - Designed modular package structure with clear dependencies
3. **Core Implementation** - Built wallet manager, transaction builder, contract interface
4. **React Bindings** - Created hooks and components following React best practices
5. **Codegen** - Built ABI parser and TypeScript generator
6. **Testing Utils** - Developed comprehensive mocking and validation tools
7. **Demo App** - Built Next.js app demonstrating all features
8. **Documentation** - Created Docusaurus site with guides and API reference

## Repository

**GitHub:** https://github.com/AqilaRifti/MoveBridge
**Docs:** https://movebridge-docs.vercel.app
**Demo:** https://movebridge-demo.vercel.app

## Quick Start

```bash
# Install
npm install @movebridge/core @movebridge/react

# Use
import { Movement } from '@movebridge/core';
import { MovementProvider, useMovement } from '@movebridge/react';
```

## Why MoveBridge?

- **Unified API** - One interface for all wallets
- **Type Safety** - Full TypeScript with generated types
- **React-First** - Hooks and components out of the box
- **Testable** - Mock everything, test fast
- **Production Ready** - Error handling, event subscriptions, transaction tracking

**MoveBridge: Build on Movement, ship with confidence.**
