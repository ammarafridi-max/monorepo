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
