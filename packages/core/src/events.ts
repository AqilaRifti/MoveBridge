/**
 * @movebridge/core - Event Listener
 * Subscribes to and handles contract events
 */

import type { Aptos } from '@aptos-labs/ts-sdk';
import { isValidEventHandle } from './config';
import { Errors } from './errors';
import type { EventSubscription, ContractEvent } from './types';

/**
 * Internal subscription data
 */
interface InternalSubscription {
    eventHandle: string;
    callback: (event: ContractEvent) => void;
    lastSequenceNumber: string;
    intervalId: ReturnType<typeof setInterval> | null;
}

/**
 * Event Listener
 * Manages event subscriptions and polling
 *
 * @example
 * ```typescript
 * // Subscribe to events
 * const subscriptionId = movement.events.subscribe({
 *   eventHandle: '0x123::counter::CounterChanged',
 *   callback: (event) => {
 *     console.log('Counter changed:', event);
 *   },
 * });
 *
 * // Unsubscribe
 * movement.events.unsubscribe(subscriptionId);
 * ```
 */
export class EventListener {
    private subscriptions: Map<string, InternalSubscription> = new Map();
    private subscriptionCounter = 0;
    private readonly pollIntervalMs: number;

    constructor(
        private readonly aptosClient: Aptos,
        options?: { pollIntervalMs?: number }
    ) {
        this.pollIntervalMs = options?.pollIntervalMs ?? 3000;
    }

    /**
     * Subscribes to contract events
     * @param subscription - Subscription configuration
     * @returns Subscription ID
     * @throws MovementError with code INVALID_EVENT_HANDLE if event handle is invalid
     */
    subscribe(subscription: EventSubscription): string {
        if (!isValidEventHandle(subscription.eventHandle)) {
            throw Errors.invalidEventHandle(subscription.eventHandle);
        }

        const subscriptionId = `sub_${++this.subscriptionCounter}`;

        const internalSub: InternalSubscription = {
            eventHandle: subscription.eventHandle,
            callback: subscription.callback,
            lastSequenceNumber: '0',
            intervalId: null,
        };

        // Start polling
        internalSub.intervalId = setInterval(() => {
            this.pollEvents(subscriptionId).catch(() => {
                // Silently handle polling errors
            });
        }, this.pollIntervalMs);

        // Do initial poll
        this.pollEvents(subscriptionId).catch(() => {
            // Silently handle initial poll errors
        });

        this.subscriptions.set(subscriptionId, internalSub);

        return subscriptionId;
    }

    /**
     * Unsubscribes from events
     * @param subscriptionId - Subscription ID to remove
     */
    unsubscribe(subscriptionId: string): void {
        const subscription = this.subscriptions.get(subscriptionId);

        if (subscription) {
            if (subscription.intervalId) {
                clearInterval(subscription.intervalId);
            }
            this.subscriptions.delete(subscriptionId);
        }
    }

    /**
     * Unsubscribes from all events
     */
    unsubscribeAll(): void {
        for (const [id] of this.subscriptions) {
            this.unsubscribe(id);
        }
    }

    /**
     * Gets active subscription count
     * @returns Number of active subscriptions
     */
    getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /**
     * Checks if a subscription exists
     * @param subscriptionId - Subscription ID
     * @returns true if subscription exists
     */
    hasSubscription(subscriptionId: string): boolean {
        return this.subscriptions.has(subscriptionId);
    }

    /**
     * Polls for new events
     * @param subscriptionId - Subscription ID
     */
    private async pollEvents(subscriptionId: string): Promise<void> {
        const subscription = this.subscriptions.get(subscriptionId);

        if (!subscription) {
            return;
        }

        try {
            // Parse event handle: 0xADDRESS::module::EventType
            const parts = subscription.eventHandle.split('::');
            if (parts.length !== 3) {
                return;
            }

            const [address, module, eventType] = parts;

            // Construct the event handle address
            const eventHandleStruct = `${address}::${module}::${eventType}`;

            // Get events from the account
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = this.aptosClient as any;
            const events = await client.getAccountEventsByEventType({
                accountAddress: address,
                eventType: eventHandleStruct,
                options: {
                    limit: 25,
                },
            });

            // Process new events
            for (const event of events) {
                const sequenceNumber = event.sequence_number?.toString() ?? '0';

                if (BigInt(sequenceNumber) > BigInt(subscription.lastSequenceNumber)) {
                    const contractEvent: ContractEvent = {
                        type: event.type,
                        sequenceNumber,
                        data: event.data as Record<string, unknown>,
                    };

                    subscription.callback(contractEvent);
                    subscription.lastSequenceNumber = sequenceNumber;
                }
            }
        } catch {
            // Silently handle polling errors
        }
    }
}
