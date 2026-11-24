// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUSES,
  ALLOWED_TRANSITIONS,
  canTransitionOrder,
  getTransitionErrorMessage,
  getNextOrderAction,
} from '../utils/orderState';

describe('Order State Machine & Transitions', () => {
  it('allows valid state transitions matching backend contract', () => {
    expect(canTransitionOrder('pending_payment', 'payment_review')).toBe(true);
    expect(canTransitionOrder('payment_review', 'confirmed')).toBe(true);
    expect(canTransitionOrder('confirmed', 'ready_for_pickup')).toBe(true);
    expect(canTransitionOrder('confirmed', 'out_for_delivery')).toBe(true);
    expect(canTransitionOrder('ready_for_pickup', 'completed')).toBe(true);
    expect(canTransitionOrder('out_for_delivery', 'completed')).toBe(true);
    expect(canTransitionOrder('out_for_delivery', 'delivered')).toBe(true); // alias to completed
  });

  it('rejects illegal transitions including legacy processing status', () => {
    // Crucial bug fix: frontend must never attempt 'processing'
    expect(canTransitionOrder('confirmed', 'processing')).toBe(false);
    expect(canTransitionOrder('completed', 'confirmed')).toBe(false);
    expect(canTransitionOrder('cancelled', 'completed')).toBe(false);
    expect(canTransitionOrder('expired', 'confirmed')).toBe(false);

    const errMsg = getTransitionErrorMessage('confirmed', 'processing');
    expect(errMsg).toContain('لا يمكن نقل الطلب');
  });

  it('determines the next legal action for pickup orders', () => {
    const pickupOrder = {
      order_number: 'WEX-001',
      status: 'confirmed',
      delivery_type: 'pickup',
    };
    const nextAction = getNextOrderAction(pickupOrder);
    expect(nextAction).not.toBeNull();
    expect(nextAction.targetStatus).toBe('ready_for_pickup');
    expect(nextAction.actionLabel).toBe('جاهز للاستلام');
    expect(nextAction.needsCourierModal).toBe(false);
  });

  it('determines the next legal action for delivery orders', () => {
    const deliveryOrder = {
      order_number: 'WEX-002',
      status: 'confirmed',
      delivery_type: 'delivery',
    };
    const nextAction = getNextOrderAction(deliveryOrder);
    expect(nextAction).not.toBeNull();
    expect(nextAction.targetStatus).toBe('out_for_delivery');
    expect(nextAction.actionLabel).toBe('تسليم للمندوب');
    expect(nextAction.needsCourierModal).toBe(true);
  });

  it('handles completion stage correctly', () => {
    const readyOrder = {
      order_number: 'WEX-001',
      status: 'ready_for_pickup',
      delivery_type: 'pickup',
    };
    expect(getNextOrderAction(readyOrder).targetStatus).toBe('completed');

    const outOrder = {
      order_number: 'WEX-002',
      status: 'out_for_delivery',
      delivery_type: 'delivery',
    };
    expect(getNextOrderAction(outOrder).targetStatus).toBe('completed');

    const completedOrder = {
      order_number: 'WEX-003',
      status: 'completed',
    };
    expect(getNextOrderAction(completedOrder)).toBeNull();
  });
});
