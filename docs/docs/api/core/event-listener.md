---
sidebar_position: 5
---

# EventListener

Manages event subscriptions and polling.

## Access

```typescript
const events = movement.events;
```

## Methods

### subscribe

Subscribe to contract events.

```typescript
subscribe(subscription: EventSubscription): string
```

#### Parameters

```typescript
interface EventSubscription {
  eventHandle: string;                    // e.g., '0x1::coin::DepositEvent'
  callback: (event: ContractEvent) => void;
}
```

#### Returns

`string` - Subscription ID

#### Example

```typescript
const subId = movement.events.subscribe({
  eventHandle: '0x123::counter::CounterChanged',
  callback: (event) => console.log(event),
});
```

### unsubscribe

Unsubscribe from events.

```typescript
unsubscribe(subscriptionId: string): void
```

### unsubscribeAll

Unsubscribe from all events.

```typescript
unsubscribeAll(): void
```

### getSubscriptionCount

Get active subscription count.

```typescript
getSubscriptionCount(): number
```

### hasSubscription

Check if subscription exists.

```typescript
hasSubscription(subscriptionId: string): boolean
```

## ContractEvent

```typescript
interface ContractEvent {
  type: string;
  sequenceNumber: string;
  data: Record<string, unknown>;
}
```
