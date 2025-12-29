---
sidebar_position: 3
---

# Components

Pre-built React components for MoveBridge.

## WalletButton

Button showing wallet connection state.

```tsx
import { WalletButton } from '@movebridge/react';

<WalletButton
  onClick={() => setModalOpen(true)}
  className="my-button"
/>
```

### Props

```typescript
interface WalletButtonProps {
  onClick?: () => void;
  className?: string;
}
```

## WalletModal

Modal for wallet selection.

```tsx
import { WalletModal } from '@movebridge/react';

<WalletModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  className="my-modal"
/>
```

### Props

```typescript
interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}
```

## AddressDisplay

Display an address with truncation and copy.

```tsx
import { AddressDisplay } from '@movebridge/react';

<AddressDisplay
  address="0x123..."
  truncate={true}
  copyable={true}
  className="my-address"
/>
```

### Props

```typescript
interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  copyable?: boolean;
  className?: string;
}
```

## NetworkSwitcher

Switch between networks.

```tsx
import { NetworkSwitcher } from '@movebridge/react';

<NetworkSwitcher
  onChange={(network) => console.log(network)}
  className="my-switcher"
/>
```

### Props

```typescript
interface NetworkSwitcherProps {
  onChange?: (network: NetworkType) => void;
  className?: string;
}
```

## Complete Example

```tsx
import {
  MovementProvider,
  WalletButton,
  WalletModal,
  AddressDisplay,
  useMovement,
} from '@movebridge/react';

function App() {
  return (
    <MovementProvider network="testnet">
      <Header />
    </MovementProvider>
  );
}

function Header() {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, connected } = useMovement();

  return (
    <header>
      {connected && address && (
        <AddressDisplay address={address} truncate copyable />
      )}
      <WalletButton onClick={() => setModalOpen(true)} />
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  );
}
```
