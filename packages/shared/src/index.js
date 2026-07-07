/**
 * @headliner/shared
 *
 * The contracts every other service imports so they can never disagree about
 * what an order is: its states, its schema, and the queue that moves it.
 *
 * Consumers do:
 *   import { ORDER_STATES, Order, canTransition, QUEUE_NAMES } from '@headliner/shared';
 */

export { ORDER_STATES, ORDER_TRANSITIONS, canTransition } from './orderStates.js';
export { Order } from './orderModel.js';
export { QUEUE_NAMES } from './queue.js';
export { connectMongo } from './db.js';
