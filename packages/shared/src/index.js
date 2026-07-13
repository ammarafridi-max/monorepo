/**
 * @picturesk/shared
 *
 * The contracts every other service imports so they can never disagree about
 * what an order is: its states, its schema, and the queue that moves it.
 *
 * Consumers do:
 *   import { ORDER_STATES, Order, canTransition, QUEUE_NAMES } from '@picturesk/shared';
 */

export { ORDER_STATES, ORDER_TRANSITIONS, canTransition } from './orderStates.js';
export {
  LOOKS,
  ATTIRE,
  AGE_RANGES,
  GENDERS,
  RACES,
  FACIAL_HAIR,
  buildPrompts,
  buildSubject,
  isValidLook,
  isValidAttire,
  isValidAgeRange,
  isValidGender,
  isValidRace,
  isValidFacialHair,
} from './catalog.js';
export { Order } from './orderModel.js';
export { User } from './userModel.js';
export { AdminUser } from './adminUserModel.js';
export { QUEUE_NAMES } from './queue.js';
export { connectMongo } from './db.js';
export { transitionOrder, OrderTransitionConflictError } from './transitions.js';
export { createRedisConnection } from './redis.js';
export { createStorage } from './storage.js';
export { createEmailClient, renderDeliveryEmail } from './emailClient.js';
