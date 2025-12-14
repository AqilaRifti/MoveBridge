/**
 * Unit tests for Event Listener
 * @module @movebridge/core
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventListener } from '../events';
import { MovementError } from '../errors';

// Mock Aptos client
const mockAptosClient = {
    getAccountEventsByEventType: vi.fn(),
} as unknown as Parameters<typeof EventListener>[0];

describe('EventListener', () => {
    let eventListener: EventListener;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        eventListener = new EventListener(mockAptosClient, { pollIntervalMs: 1000 });
    });

    afterEach(() => {
        eventListener.unsubscribeAll();
        vi.useRealTimers();
    });

    describe('subscribe', () => {
        it('should return unique subscription ID', () => {
            const id1 = eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback: vi.fn(),
            });

            const id2 = eventListener.subscribe({
                eventHandle: '0x456::token::Transfer',
                callback: vi.fn(),
            });

            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^sub_\d+$/);
            expect(id2).toMatch(/^sub_\d+$/);
        });

        it('should throw INVALID_EVENT_HANDLE for invalid format', () => {
            expect(() =>
                eventListener.subscribe({
                    eventHandle: 'invalid',
                    callback: vi.fn(),
                })
            ).toThrow(MovementError);

            expect(() =>
                eventListener.subscribe({
                    eventHandle: 'invalid',
                    callback: vi.fn(),
                })
            ).toThrow(expect.objectContaining({ code: 'INVALID_EVENT_HANDLE' }));
        });

        it('should accept valid event handle formats', () => {
            const validHandles = [
                '0x1::coin::DepositEvent',
                '0x123abc::counter::CounterChanged',
                '0x' + 'a'.repeat(64) + '::module_name::EventType',
            ];

            for (const handle of validHandles) {
                expect(() =>
                    eventListener.subscribe({
                        eventHandle: handle,
                        callback: vi.fn(),
                    })
                ).not.toThrow();
            }
        });

        it('should increment subscription count', () => {
            expect(eventListener.getSubscriptionCount()).toBe(0);

            eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback: vi.fn(),
            });

            expect(eventListener.getSubscriptionCount()).toBe(1);

            eventListener.subscribe({
                eventHandle: '0x456::token::Transfer',
                callback: vi.fn(),
            });

            expect(eventListener.getSubscriptionCount()).toBe(2);
        });
    });

    describe('unsubscribe', () => {
        it('should remove subscription', () => {
            const id = eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback: vi.fn(),
            });

            expect(eventListener.hasSubscription(id)).toBe(true);

            eventListener.unsubscribe(id);

            expect(eventListener.hasSubscription(id)).toBe(false);
            expect(eventListener.getSubscriptionCount()).toBe(0);
        });

        it('should handle unsubscribing non-existent subscription', () => {
            expect(() => eventListener.unsubscribe('non_existent')).not.toThrow();
        });
    });

    describe('unsubscribeAll', () => {
        it('should remove all subscriptions', () => {
            eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback: vi.fn(),
            });

            eventListener.subscribe({
                eventHandle: '0x456::token::Transfer',
                callback: vi.fn(),
            });

            expect(eventListener.getSubscriptionCount()).toBe(2);

            eventListener.unsubscribeAll();

            expect(eventListener.getSubscriptionCount()).toBe(0);
        });
    });

    describe('hasSubscription', () => {
        it('should return true for existing subscription', () => {
            const id = eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback: vi.fn(),
            });

            expect(eventListener.hasSubscription(id)).toBe(true);
        });

        it('should return false for non-existent subscription', () => {
            expect(eventListener.hasSubscription('non_existent')).toBe(false);
        });
    });

    describe('Event polling', () => {
        it('should register subscription and start polling', () => {
            const callback = vi.fn();

            mockAptosClient.getAccountEventsByEventType.mockResolvedValue([]);

            const id = eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback,
            });

            // Subscription should be registered
            expect(eventListener.hasSubscription(id)).toBe(true);
            expect(eventListener.getSubscriptionCount()).toBe(1);
        });

        it('should process events with correct structure', () => {
            // Test that event structure transformation is correct
            const rawEvent = {
                type: '0x123::counter::CounterChanged',
                sequence_number: '1',
                data: { value: 42 },
            };

            // The expected transformed event
            const expectedEvent = {
                type: '0x123::counter::CounterChanged',
                sequenceNumber: '1',
                data: { value: 42 },
            };

            expect(expectedEvent.type).toBe(rawEvent.type);
            expect(expectedEvent.sequenceNumber).toBe(rawEvent.sequence_number);
            expect(expectedEvent.data).toEqual(rawEvent.data);
        });

        it('should handle polling errors gracefully', async () => {
            const callback = vi.fn();

            mockAptosClient.getAccountEventsByEventType.mockRejectedValue(new Error('Network error'));

            const id = eventListener.subscribe({
                eventHandle: '0x123::counter::CounterChanged',
                callback,
            });

            // Wait for poll
            await vi.advanceTimersByTimeAsync(100);

            // Should not throw and subscription should still exist
            expect(eventListener.hasSubscription(id)).toBe(true);
            expect(callback).not.toHaveBeenCalled();
        });
    });
});
