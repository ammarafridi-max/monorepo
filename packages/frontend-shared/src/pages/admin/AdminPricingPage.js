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
import { normalizePricingOptions } from '../../utils/dummyTicketPricing';

const VALIDITIES = ['2 Days', '7 Days', '14 Days'];

export default function AdminPricingPage() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAdmin = user?.role === 'admin';

  const { currencies = [], isLoadingCurrencies } = useGetCurrencies();
  const { priceBooks, isLoadingPriceBooks } = useAdminDummyTicketPriceBooks();

  const baseCurrency = useMemo(
    () => currencies.find((c) => c.isBaseCurrency) || null,
    [currencies],
  );
  const [selectedCode, setSelectedCode] = useState(null);
  const activeCode = selectedCode || baseCurrency?.code || null;

  const { pricing, isLoadingPricing, isErrorPricing, pricingError } =
    useAdminDummyTicketPricing(activeCode);
  const { updatePricing, isUpdatingPricing } = useUpdateDummyTicketPricing();
  const { deletePricing, isDeletingPricing } = useDeleteDummyTicketPricing();

  const [formOptions, setFormOptions] = useState([]);

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/admin');
  }, [isAdmin, loading, router]);

  // An unconfigured currency returns no options, so start it from blanks
  // rather than silently inheriting another currency's numbers.
  useEffect(() => {
    if (!pricing || pricing.currency !== activeCode) return;
    const existing = normalizePricingOptions(pricing);
    setFormOptions(
      VALIDITIES.map((validity, index) => {
        const match = existing.find((o) => o.value === validity);
        return {
          value: validity,
          label: validity,
          price: match ? String(match.price) : '',
          sortOrder: index,
        };
      }),
    );
  }, [pricing, activeCode]);

  const configuredCodes = useMemo(
    () => new Set(priceBooks.map((b) => b.currency)),
    [priceBooks],
  );
  const symbolFor = (code) => currencies.find((c) => c.code === code)?.symbol || code;
  const isBase = activeCode && activeCode === baseCurrency?.code;
  const hasBook = activeCode ? configuredCodes.has(activeCode) : false;

  function handlePriceChange(validity, value) {
    setFormOptions((current) =>
      current.map((o) => (o.value === validity ? { ...o, price: value } : o)),
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    updatePricing({
      currency: activeCode,
      options: formOptions.map((o, index) => ({
        validity: o.value,
        price: Number(o.price),
        isActive: true,
        sortOrder: index,
      })),
    });
  }

  function handleDelete() {
    if (!activeCode || isBase) return;
    const ok = window.confirm(
      `Remove the ${activeCode} price book? ${activeCode} customers will be charged the ${baseCurrency?.code} price converted at the stored rate.`,
    );
    if (ok) deletePricing(activeCode);
  }

  if (loading || !isAdmin || isLoadingCurrencies || isLoadingPriceBooks) return <PageLoader />;

  const incomplete = formOptions.some((o) => o.price === '' || !Number.isFinite(Number(o.price)));

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Dummy Ticket Pricing</h2>
        <p className="text-sm text-gray-400">
          Set a price per currency. Currencies without their own prices are charged the{' '}
          {baseCurrency?.code || 'base'} price converted at the stored rate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Base currency</p>
          <p className="text-2xl font-extrabold text-gray-900">{baseCurrency?.code || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Price books</p>
          <p className="text-2xl font-extrabold text-gray-900">{priceBooks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase">Currencies</p>
          <p className="text-2xl font-extrabold text-gray-900">{currencies.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-3">Currency</p>
        <div className="flex flex-wrap gap-2">
          {currencies.map((c) => {
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
          A filled dot means that currency has its own prices.
        </p>
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

          <div className="space-y-5">
            {formOptions.map((option) => (
              <div key={option.value} className="grid grid-cols-2 items-center gap-4">
                <Label>{option.label}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-400">{symbolFor(activeCode)}</span>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={option.price}
                    placeholder="0"
                    onChange={(e) => handlePriceChange(option.value, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

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
            <PrimaryButton type="submit" size="small" disabled={isUpdatingPricing || incomplete}>
              {isUpdatingPricing ? 'Saving...' : `Save ${activeCode} pricing`}
            </PrimaryButton>
          </div>
        </form>
      )}
    </div>
  );
}
