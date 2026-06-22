// In-memory broadcaster for "a ticket was just paid" SSE events.
//
// Caveat: this only reaches admins connected to the SAME backend instance
// that processed the payment webhook. If the apps ever scale beyond a
// single Fly machine (or split webhook handling across regions), upgrade
// to a Redis pub/sub channel — same subscribe/publish API.
export function createPaidOrderBus() {
  const subscribers = new Set();

  function subscribe(res) {
    subscribers.add(res);
    return () => subscribers.delete(res);
  }

  function publish(payload) {
    const line = `event: paid-order\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of subscribers) {
      try {
        res.write(line);
      } catch {
        subscribers.delete(res);
      }
    }
  }

  return { subscribe, publish, size: () => subscribers.size };
}
