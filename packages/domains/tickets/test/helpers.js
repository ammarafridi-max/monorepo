export function currencyModel(rows) {
  return {
    findOne: (query = {}) => ({
      lean: async () =>
        rows.find((row) => (query.code ? row.code === query.code : row.isBaseCurrency)) ?? null,
    }),
    exists: async (query) => rows.some((row) => row.code === query.code),
  };
}

export function pricingModel(books, { failFirstCreate = false } = {}) {
  let createCalls = 0;
  return {
    findOne: async (query) =>
      books.find(
        (book) => book.key === query.key && (query.currency ? book.currency === query.currency : true),
      ) ?? null,
    find: () => ({ lean: async () => books.slice() }),
    create: async (doc) => {
      createCalls += 1;
      if (failFirstCreate && createCalls === 1) {
        books.push({ ...doc });
        const err = new Error('duplicate key');
        err.code = 11000;
        throw err;
      }
      books.push(doc);
      return doc;
    },
    findOneAndUpdate: async (query, update) => {
      let book = books.find((b) => b.currency === query.currency);
      if (!book) {
        book = { key: query.key, currency: query.currency, options: [] };
        books.push(book);
      }
      Object.assign(book, update.$set);
      return book;
    },
    deleteOne: async (query) => {
      const index = books.findIndex((b) => b.currency === query.currency);
      if (index === -1) return { deletedCount: 0 };
      books.splice(index, 1);
      return { deletedCount: 1 };
    },
  };
}

export const usdBase = [
  { code: 'USD', rate: 1, isBaseCurrency: true },
  { code: 'AED', rate: 3.6725 },
  { code: 'INR', rate: 95.55 },
  { code: 'JPY', rate: 151.2 },
  { code: 'KWD', rate: 0.306 },
];

export const baseBook = () => [
  {
    key: 'dummy-ticket',
    currency: 'USD',
    options: [
      { validity: '2 Days', price: 13, isActive: true, sortOrder: 0 },
      { validity: '7 Days', price: 19, isActive: true, sortOrder: 1 },
      { validity: '14 Days', price: 21, isActive: false, sortOrder: 2 },
    ],
  },
];
