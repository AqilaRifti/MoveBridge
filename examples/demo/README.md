# MoveBridge Demo

Interactive demo application showcasing the MoveBridge SDK for Movement Network.

## Features

- **Dashboard** - Account overview with balance display
- **Transfer** - Send MOVE tokens with transaction tracking
- **Contract** - Interact with Move modules (view & entry functions)
- **Events** - Real-time event subscriptions

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A Movement-compatible wallet (Razor, Nightly, or OKX)

### Installation

From the monorepo root:

```bash
# Install dependencies
pnpm install

# Build the SDK packages
pnpm build

# Start the demo
pnpm --filter movebridge-demo dev
```

### Running

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

### Dashboard (`/`)

- Connect wallet
- View account balance
- Quick access to all features
- SDK code examples

### Transfer (`/transfer`)

- Send MOVE tokens to any address
- Real-time transaction status
- Explorer integration

### Contract (`/contract`)

- Call view functions (read-only)
- Execute entry functions (transactions)
- Pre-configured example contracts
- Custom contract interaction

### Events (`/events`)

- Subscribe to blockchain events
- Real-time event log
- Filter and search events

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- @movebridge/core
- @movebridge/react

## SDK Usage Examples

### Initialize Provider

```tsx
import { MovementProvider } from '@movebridge/react'

function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <YourApp />
    </MovementProvider>
  )
}
```

### Use Hooks

```tsx
import { useMovement, useBalance, useTransaction } from '@movebridge/react'

function Component() {
  const { address, connected, connect, disconnect } = useMovement()
  const { balance, loading, refetch } = useBalance()
  const { send, loading: sending } = useTransaction()

  // ...
}
```

### Contract Interaction

```tsx
import { useContract } from '@movebridge/react'

function ContractComponent() {
  const { read, write } = useContract({
    address: '0x1',
    module: 'coin',
  })

  const getBalance = async () => {
    const result = await read('balance', [address])
    console.log(result)
  }
}
```

## License

MIT
