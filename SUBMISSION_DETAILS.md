## MoveBridge SDK - Submission Details

### What is MoveBridge?

MoveBridge SDK is a comprehensive TypeScript SDK for Movement Network - essentially "ethers.js for Movement". It provides a unified, developer-friendly interface for building dApps on Movement blockchain.

### Packages Built

1. **@movebridge/core** - Core SDK with wallet management (Razor, Nightly, OKX), transaction building, contract interactions, and event subscriptions
2. **@movebridge/react** - React hooks (`useMovement`, `useBalance`, `useContract`) and components (`ConnectButton`, `WalletModal`)
3. **@movebridge/codegen** - CLI tool for generating TypeScript bindings from deployed Move modules
4. **@movebridge/testing** - Testing utilities including mocks, fake data generators, validators, and transaction simulators

### Documentation

Built a complete Docusaurus documentation site featuring:
- Getting started guide and installation instructions
- Package-specific documentation for all 4 packages
- API reference with detailed method signatures
- Code examples for vanilla TypeScript and React
- Migration guide from raw Aptos SDK
- Custom Golden Gate Bridge-inspired branding (orange theme)

### Key Features

- Unified wallet connection API across multiple wallet providers
- Type-safe contract interactions with auto-generated TypeScript bindings
- React-first design with hooks and pre-built components
- Structured error handling with typed error codes
- Real-time event subscriptions
- Comprehensive testing utilities for confident shipping

### Technical Stack

- TypeScript with full type safety
- pnpm workspaces for monorepo management
- tsup for building ESM/CJS bundles
- Vitest for testing with property-based testing support
- Docusaurus for documentation
- Configured for Netlify deployment

### Repository

GitHub: https://github.com/AqilaRifti/MoveBridge
