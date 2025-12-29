---
sidebar_position: 1
---

# MovementProvider

React context provider for MoveBridge SDK.

## Import

```typescript
import { MovementProvider } from '@movebridge/react';
```

## Usage

```tsx
function App() {
  return (
    <MovementProvider network="testnet" autoConnect>
      <YourApp />
    </MovementProvider>
  );
}
```

## Props

```typescript
interface MovementProviderProps {
  network: 'mainnet' | 'testnet';
  autoConnect?: boolean;
  onError?: (error: MovementError) => void;
  children: ReactNode;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `network` | `NetworkType` | Required | Network to connect to |
| `autoConnect` | `boolean` | `false` | Auto-connect to last wallet |
| `onError` | `function` | - | Global error callback |
| `children` | `ReactNode` | Required | Child components |

## Context Value

```typescript
interface MovementContextValue {
  movement: Movement | null;
  network: NetworkType;
  address: string | null;
  connected: boolean;
  connecting: boolean;
  wallets: WalletType[];
  wallet: WalletType | null;
  connect: (wallet: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  onError?: (error: MovementError) => void;
}
```

## useMovementContext

Access the context directly:

```typescript
import { useMovementContext } from '@movebridge/react';

const context = useMovementContext();
```

Throws if used outside `MovementProvider`.
