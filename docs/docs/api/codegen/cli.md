---
sidebar_position: 1
---

# CLI

Command-line interface for code generation.

## Installation

```bash
npm install -D @movebridge/codegen
```

## Usage

```bash
npx movebridge-gen [options]
```

## Options

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--address` | `-a` | Module address (e.g., `0x1::coin`) | Yes |
| `--network` | `-n` | Network (`mainnet` or `testnet`) | Yes |
| `--output` | `-o` | Output file path | Yes |

## Examples

```bash
# Generate coin module bindings
npx movebridge-gen -a 0x1::coin -n testnet -o ./src/types/coin.ts

# Generate custom contract bindings
npx movebridge-gen \
  --address 0x123abc::my_module \
  --network mainnet \
  --output ./src/contracts/my-module.ts
```

## Output

The CLI generates a TypeScript class with:

- Constructor accepting `Movement` instance
- Methods for each exposed function
- JSDoc comments
- Type-safe parameters and return types

## Build Script Integration

```json
{
  "scripts": {
    "codegen": "movebridge-gen -a 0x1::coin -n testnet -o ./src/types/coin.ts",
    "build": "npm run codegen && tsc"
  }
}
```
