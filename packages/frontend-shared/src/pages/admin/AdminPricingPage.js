'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLoader from '../../components/ui/v1/PageLoader';
import PrimaryButton from '../../components/ui/v1/PrimaryButton';
import Input from '../../components/form-elements/v1/Input';
import Label from '../../components/form-elements/v1/Label';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useGetCurrencies } from '../../hooks/currencies/useGetCurrencies';
import {
  useAdminDummyTicketPricing,
  useAdminDummyTicketPriceBooks,
} from '../../hooks/pricing/useAdminDummyTicketPricing';
import {
  useUpdateDummyTicketPricing,
  useDeleteDummyTicketPricing,
} from '../../hooks/pricing/useUpdateDummyTicketPricing';
import { useDummyTicketPricing } from '../../hooks/pricing/useDummyTicketPricing';
import { normalizePricingOptions } from '../../utils/dummyTicketPricing';
import { TICKET_VALIDITIES } from '../../utils/ticketValidity';



export default function AdminPricingPage() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAdmin = user?.role === 'admin';

  const { currencies = [] } = useGetCurrencies();
  const { priceBooks, isLoadingPriceBooks } = useAdminDummyTicketPriceBooks();

  const baseCurrency = useMemo(
    () => currencies.find((c) => c.isBaseCurrency) || null,
    [currencies],
  );
  // Single-currency brands do not mount the currencies API, so the price books are the only list available.
  const selectableCurrencies = useMemo(() => {
    if (currencies.length > 0) return currencies;
    return priceBooks.map((b) => ({
      code: b.currency,
      symbol: b.currency,
      isBaseCurrency: b.isBaseCurrency,
    }));
  }, [currencies, priceBooks]);
  const baseCode =
    baseCurrency?.code || selectableCurrencies.find((c) => c.isBaseCurrency)?.code || null;

  const [selectedCode, setSelectedCode] = useState(null);
  const activeCode = selectedCode || baseCode || null;

  const { pricing, isLoadingPricing, isErrorPricing, pricingError } =
    useAdminDummyTicketPricing(activeCode);
  const { updatePricing, isUpdatingPricing } = useUpdateDummyTicketPricing();
  const { deletePricing, isDeletingPricing } = useDeleteDummyTicketPricing();

  const [formOptions, setFormOptions] = useState([]);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/admin');
  }, [isAdmin, loading, router]);

  useEffect(() => {
    if (!pricing || pricing.currency !== activeCode) return;
    const existing = normalizePricingOptions(pricing);
    const rawOptions = Array.isArray(pricing.options) ? pricing.options : [];
    setFormOptions(
      TICKET_VALIDITIES.map((validity, index) => {
        const match = existing.find((o) => o.value === validity);
        const raw = rawOptions.find((o) => o.validity === validity);
        return {
          value: validity,
          label: validity,
          price: match ? String(match.price) : '',
          isActive: raw ? raw.isActive !== false : true,
          sortOrder: index,
        };
      }),
    );
  }, [pricing, activeCode]);

  const configuredCodes = useMemo(
    () => new Set(priceBooks.map((b) => b.currency)),
    [priceBooks],
  );
  const symbolFor = (code) => selectableCurrencies.find((c) => c.code === code)?.symbol || code || '';
  const isBase = Boolean(activeCode) && activeCode === baseCode;
  const hasBook = activeCode ? configuredCodes.has(activeCode) : false;

  // Price books whose currency is no longer configured still price orders, so they must stay visible.
  const orphanBooks = useMemo(() => {
    if (currencies.length === 0) return [];
    const known = new Set(currencies.map((c) => c.code));
    return priceBooks.filter((b) => !known.has(b.currency));
  }, [currencies, priceBooks]);

  const { pricing: livePricing } = useDummyTicketPricing(hasBook ? null : activeCode);

  const incomplete = formOptions.some(
    (o) => o.price === '' || !Number.isFinite(Number(o.price)) || Number(o.price) < 0,
  );
  const invalidActivePrice = formOptions.some((o) => o.isActive !== false && Number(o.price) <= 0);

  function handlePriceChange(validity, value) {
    setFormOptions((current) =>
      current.map((o) => (o.value === validity ? { ...o, price: value } : o)),
    );
  }

  function handleActiveChange(validity, isActive) {
    setFormOptions((current) =>
      current.map((o) => (o.value === validity ? { ...o, isActive } : o)),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (incomplete || invalidActivePrice) return;
    updatePricing({
      currency: activeCode,
      options: formOptions.map((o, index) => ({
        validity: o.value,
        price: Number(o.price),
        isActive: o.isActive !== false,
        sortOrder: index,
      })),
    });
  }

  function handlePrefillFromBase() {
    const converted = livePricing?.options ?? [];
    if (converted.length === 0) return;
    setFormOptions((current) =>
      current.map((option) => {
        const match = converted.find((o) => o.validity === option.value);
        return match ? { ...option, price: String(match.price), isActive: true } : option;
      }),
    );
  }

  function handleDelete() {
    if (!activeCode || isBase) return;
    const ok = window.confirm(
      `Remove the ${activeCode} price book? ${activeCode} customers will be charged the ${baseCode} price converted at the stored rate.`,
    );
    if (ok) deletePricing(activeCode);
  }

  if (loading || !isAdmin || isLoadingPriceBooks) return <PageLoader />;


  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Dummy Ticket Pricing</h2>
        <p className="text-sm text-gray-400">
          Set a price per currency. Currencies without their own prices are charged the{' '}
          {baseCode || 'base'} price converted at the stored rate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Base currency</p>
          <p className="text-2xl font-extrabold text-gray-900">{baseCode || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Price books</p>
          <p className="text-2xl font-extrabold text-gray-900">{priceBooks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Currencies</p>
          <p className="text-2xl font-extrabold text-gray-900">{selectableCurrencies.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-3">Currency</p>
        <div className="flex flex-wrap gap-2">
          {selectableCurrencies.map((c) => {
            const active = c.code === activeCode;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedCode(c.code)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
                  active
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    configuredCodes.has(c.code)
                      ? active
                        ? 'bg-white'
                        : 'bg-primary-600'
                      : active
                        ? 'bg-white/40'
                        : 'bg-gray-300'
                  }`}
                />
                {c.code}
                {c.isBaseCurrency && (
                  <span className={active ? 'text-white/70' : 'text-gray-400'}>base</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          A filled dot means that currency has its own prices. Clearing &ldquo;On sale&rdquo; hides a validity
          from the booking form and blocks checkout for it.
        </p>

        {orphanBooks.length > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            These price books are still live but their currency is no longer configured:{' '}
            {orphanBooks.map((b) => b.currency).join(', ')}. Add the currency back or remove the book.
          </p>
        )}
      </div>

      {isErrorPricing ? (
        <p className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
          {pricingError?.message || 'Could not load pricing'}
        </p>
      ) : (
        <form className="bg-white border border-gray-200 rounded-2xl p-6" onSubmit={handleSubmit}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              {activeCode} prices
              {!hasBook && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                  not set
                </span>
              )}
            </h3>
            {isLoadingPricing && <span className="text-xs text-gray-400">Loading...</span>}
          </div>

          {activeCode && !hasBook && livePricing?.options?.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-600">
                {activeCode} customers pay{' '}
                {livePricing.options
                  .map((o) => `${o.validity} ${livePricing.currency} ${o.price}`)
                  .join(', ')}{' '}
                right now, converted from {baseCode}.
              </p>
              <button
                type="button"
                onClick={handlePrefillFromBase}
                className="shrink-0 text-xs font-bold text-primary-700 hover:text-primary-800"
              >
                Use these prices
              </button>
            </div>
          )}

          <div className="space-y-5">
            {formOptions.map((option) => (
              <div key={option.value} className="grid grid-cols-2 items-center gap-4">
                <Label>{option.label}</Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400">{symbolFor(activeCode)}</span>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={option.price}
                    placeholder="0"
                    onChange={(e) => handlePriceChange(option.value, e.target.value)}
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <input
                      type="checkbox"
                      checked={option.isActive !== false}
                      onChange={(e) => handleActiveChange(option.value, e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-primary-600"
                    />
                    On sale
                  </label>
                </div>
              </div>
            ))}
          </div>

          {invalidActivePrice && (
            <p className="mt-4 text-xs font-semibold text-red-600">
              A validity that is on sale needs a price above zero. Clear &ldquo;On sale&rdquo; instead to stop
              selling it.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            {hasBook && !isBase ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeletingPricing}
                className="text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {isDeletingPricing ? 'Removing...' : `Remove ${activeCode} prices`}
              </button>
            ) : (
              <span />
            )}
            <PrimaryButton
              type="submit"
              size="small"
              disabled={isUpdatingPricing || incomplete || invalidActivePrice || !activeCode}
            >
              {isUpdatingPricing ? 'Saving...' : `Save ${activeCode} pricing`}
            </PrimaryButton>
          </div>
        </form>
      )}
    </div>
  );
}
