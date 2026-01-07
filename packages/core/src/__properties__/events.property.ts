/**
 * Property-based tests for Event Listener
 * @module @movebridge/core
 * 
 * Feature: sdk-rework
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { EventListener } from '../events';

// Mock Aptos client factory
const createMockAptosClient = (events: Array<{ type: string; sequence_number: string; data: unknown }> = []) => ({
    getAccountEventsByEventType: vi.fn().mockResolvedValue(events),
} as unknown as Parameters<typeof EventListener>[0]);

describe('Event Listener Properties', () => {
    let eventListener: EventListener;
    let mockAptosClient: ReturnType<typeof createMockAptosClient>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockAptosClient = createMockAptosClient();
        eventListener = new EventListener(mockAptosClient, { pollIntervalMs: 1000 });
    });

    afterEach(() => {
        eventListener.unsubscribeAll();
        vi.useRealTimers();
    });

    /**
     * Feature: sdk-rework, Property 6: Event Callback Invocation
     * For any event subscription, when new events are detected with sequence numbers
     * greater than the last processed sequence number, the callback SHALL be invoked
     * with each new event's data.
     * 
     * **Validates: Requirements 4.2**
     */
    it('Property 6: Event Callback Invocation', async () => {
        // Generate random events with increasing sequence numbers
        const eventDataArb = fc.record({
            value: fc.integer(),
            sender: fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => `0x${h}`),
        });

        await fc.assert(
            fc.asyncProperty(
                fc.array(eventDataArb, { minLength: 1, maxLength: 5 }),
                async (eventDataList) => {
                    const receivedEvents: unknown[] = [];
                    const callback = vi.fn((event) => {
                        receivedEvents.push(event.data);
                    });

                    // Create events with sequential sequence numbers
                    const events = eventDataList.map((data, index) => ({
                        type: '0x1::test::TestEvent',
                        sequence_number: String(index),
                        data,
                    }));

                    // Update mock to return these events
                    mockAptosClient.getAccountEventsByEventType.mockResolvedValue(events);

                    // Subscribe
                    eventListener.subscribe({
                        accountAddress: '0x1',
                        eventType: '0x1::test::TestEvent',
                        callback,
                    });

                    // Wait for initial poll
                    await vi.advanceTimersByTimeAsync(100);

                    // Callback should be invoked for each event
                    expect(callback).toHaveBeenCalledTimes(events.length);

                    // Each event data should be received
                    for (const data of eventDataList) {
                        expect(receivedEvents).toContainEqual(data);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: sdk-rework, Property 7: Event Unsubscribe Cleanup
     * For any active subscription, calling unsubscribe() SHALL:
     * - Clear the polling interval
     * - Remove the subscription from the internal map
     * - Result in hasSubscription() returning false for that subscription ID
     * 
     * **Validates: Requirements 4.3**
     */
    it('Property 7: Event Unsubscribe Cleanup', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (numSubscriptions) => {
                    const subscriptionIds: string[] = [];

                    // Create multiple subscriptions
                    for (let i = 0; i < numSubscriptions; i++) {
                        const id = eventListener.subscribe({
                            accountAddress: `0x${i}`,
                            eventType: `0x1::test::Event${i}`,
                            callback: vi.fn(),
                        });
                        subscriptionIds.push(id);
                    }

                    // Verify all subscriptions exist
                    expect(eventListener.getSubscriptionCount()).toBe(numSubscriptions);
                    for (const id of subscriptionIds) {
                        expect(eventListener.hasSubscription(id)).toBe(true);
                    }

                    // Unsubscribe from each one
                    for (const id of subscriptionIds) {
                        eventListener.unsubscribe(id);
                        expect(eventListener.hasSubscription(id)).toBe(false);
                    }

                    // All subscriptions should be removed
                    expect(eventListener.getSubscriptionCount()).toBe(0);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: sdk-rework, Property 8: Event Deduplication
     * For any sequence of polled events, events with sequence numbers less than or equal
     * to the last processed sequence number SHALL NOT trigger callback invocations.
     * 
     * **Validates: Requirements 4.4**
     */
    it('Property 8: Event Deduplication', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 0, max: 100 }),
                async (lastSeqNum) => {
                    const callback = vi.fn();

                    // Create events: some old (should be skipped), some new (should be processed)
                    const oldEvents = Array.from({ length: 3 }, (_, i) => ({
                        type: '0x1::test::TestEvent',
                        sequence_number: String(lastSeqNum - 2 + i), // lastSeqNum-2, lastSeqNum-1, lastSeqNum
                        data: { old: true, seq: lastSeqNum - 2 + i },
                    })).filter(e => parseInt(e.sequence_number) >= 0);

                    const newEvents = Array.from({ length: 3 }, (_, i) => ({
                        type: '0x1::test::TestEvent',
                        sequence_number: String(lastSeqNum + 1 + i), // lastSeqNum+1, lastSeqNum+2, lastSeqNum+3
                        data: { new: true, seq: lastSeqNum + 1 + i },
                    }));

                    const allEvents = [...oldEvents, ...newEvents];

                    // First poll: return events up to lastSeqNum
                    mockAptosClient.getAccountEventsByEventType.mockResolvedValueOnce(
                        allEvents.filter(e => parseInt(e.sequence_number) <= lastSeqNum)
                    );

                    // Subscribe
                    eventListener.subscribe({
                        accountAddress: '0x1',
                        eventType: '0x1::test::TestEvent',
                        callback,
                    });

                    // Wait for initial poll
                    await vi.advanceTimersByTimeAsync(100);
                    const initialCallCount = callback.mock.calls.length;

                    // Reset callback
                    callback.mockClear();

                    // Second poll: return all events (including old ones)
                    mockAptosClient.getAccountEventsByEventType.mockResolvedValueOnce(allEvents);

                    // Advance to next poll
                    await vi.advanceTimersByTimeAsync(1000);

                    // Only new events should trigger callbacks (not old ones)
                    // Each call should have sequence number > lastSeqNum
                    for (const call of callback.mock.calls) {
                        const event = call[0];
                        expect(parseInt(event.sequenceNumber)).toBeGreaterThan(lastSeqNum);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Feature: sdk-rework, Property 9: Event Polling Error Resilience
     * For any network error during event polling, the Event_Listener SHALL:
     * - Not throw an exception
     * - Continue polling at the next interval
     * - Maintain all existing subscriptions
     * 
     * **Validates: Requirements 4.5**
     */
    it('Property 9: Event Polling Error Resilience', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 3 }),
                async (numErrors) => {
                    const callback = vi.fn();

                    // Make the mock fail multiple times then succeed
                    const mockClient = createMockAptosClient();
                    const listener = new EventListener(mockClient, { pollIntervalMs: 1000 });

                    for (let i = 0; i < numErrors; i++) {
                        mockClient.getAccountEventsByEventType.mockRejectedValueOnce(
                            new Error(`Network error ${i}`)
                        );
                    }
                    mockClient.getAccountEventsByEventType.mockResolvedValue([
                        { type: '0x1::test::TestEvent', sequence_number: '0', data: { success: true } },
                    ]);

                    // Subscribe
                    const subId = listener.subscribe({
                        accountAddress: '0x1',
                        eventType: '0x1::test::TestEvent',
                        callback,
                    });

                    // Wait for initial poll (may fail but should not throw)
                    await vi.advanceTimersByTimeAsync(100);

                    // Subscription should still exist after potential error
                    expect(listener.hasSubscription(subId)).toBe(true);

                    // Advance through all error polls plus one more for success
                    for (let i = 0; i <= numErrors; i++) {
                        await vi.advanceTimersByTimeAsync(1000);
                        // Subscription should still exist after each poll
                        expect(listener.hasSubscription(subId)).toBe(true);
                    }

                    // Clean up
                    listener.unsubscribeAll();

                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Additional property: Subscription IDs are unique
     */
    it('Property: Subscription IDs are unique', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 20 }),
                (numSubscriptions) => {
                    const ids = new Set<string>();

                    for (let i = 0; i < numSubscriptions; i++) {
                        const id = eventListener.subscribe({
                            accountAddress: `0x${i}`,
                            eventType: `0x1::test::Event${i}`,
                            callback: vi.fn(),
                        });

                        // ID should not already exist
                        expect(ids.has(id)).toBe(false);
                        ids.add(id);
                    }

                    // All IDs should be unique
                    expect(ids.size).toBe(numSubscriptions);

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Additional property: unsubscribeAll removes all subscriptions
     */
    it('Property: unsubscribeAll removes all subscriptions', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (numSubscriptions) => {
                    const subscriptionIds: string[] = [];

                    // Create multiple subscriptions
                    for (let i = 0; i < numSubscriptions; i++) {
                        const id = eventListener.subscribe({
                            accountAddress: `0x${i}`,
                            eventType: `0x1::test::Event${i}`,
                            callback: vi.fn(),
                        });
                        subscriptionIds.push(id);
                    }

                    expect(eventListener.getSubscriptionCount()).toBe(numSubscriptions);

                    // Unsubscribe all
                    eventListener.unsubscribeAll();

                    // All should be removed
                    expect(eventListener.getSubscriptionCount()).toBe(0);
                    for (const id of subscriptionIds) {
                        expect(eventListener.hasSubscription(id)).toBe(false);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});
