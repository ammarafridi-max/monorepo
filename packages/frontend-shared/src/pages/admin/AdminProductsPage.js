'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react';
import Breadcrumb from '../../components/v1/layout/Breadcrumb';
import PageLoader from '../../components/v1/ui/PageLoader';
import PageHeading from '../../components/v1/layout/PageHeading';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  useProducts,
  useCreateProduct,
  useDeleteProduct,
  useSetProductActive,
  useUpdateProduct,
} from '../../hooks/payments/useProducts';
import AdminProductModal from './AdminProductModal';

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'AED').toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${(currency || '').toUpperCase()} ${Number(amount).toFixed(2)}`;
  }
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { adminUser: user, isLoadingAdminAuth: loading } = useAdminAuth();
  const isAllowed = user?.role === 'admin' || user?.role === 'agent';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const { products, isLoadingProducts } = useProducts({ activeOnly: false });
  const { createProduct, isCreatingProduct } = useCreateProduct();
  const { updateProduct, isUpdatingProduct } = useUpdateProduct();
  const { setProductActive, isSettingProductActive } = useSetProductActive();
  const { deleteProduct, isDeletingProduct } = useDeleteProduct();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!loading && !isAllowed) router.replace('/admin');
  }, [isAllowed, loading, router]);

  if (loading || !isAllowed) return <PageLoader />;

  function handleSave(payload) {
    if (editingProduct) {
      updateProduct(
        { id: editingProduct._id, ...payload },
        { onSuccess: () => setEditingProduct(null) },
      );
    } else {
      createProduct(payload, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <>
      <Breadcrumb
        paths={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Products', href: '/admin/products' },
        ]}
      />

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <PageHeading>Products</PageHeading>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary-800"
        >
          <Plus size={14} />
          New product
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Reusable products in your catalog. Create a product once, then spawn payment links
        from it with any chosen quantity.
      </p>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-right font-medium">Unit price</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoadingProducts ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">Loading…</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No products yet. Click “New product” to add one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium text-gray-900">
                      {formatMoney(p.unitAmount, p.currency)}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.description || '—'}</td>
                    <td className="px-5 py-3">
                      {p.isActive ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          title="Edit product"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={isSettingProductActive}
                          onClick={() => setProductActive({ id: p._id, active: !p.isActive })}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                            p.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {p.isActive ? <PowerOff size={12} /> : <Power size={12} />}
                          {p.isActive ? 'Disable' : 'Enable'}
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            disabled={isDeletingProduct}
                            onClick={() => {
                              if (
                                typeof window !== 'undefined' &&
                                !window.confirm(
                                  `Delete "${p.name}"? This is only allowed if no payment link references it.`,
                                )
                              ) {
                                return;
                              }
                              deleteProduct(p._id);
                            }}
                            title="Delete product"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modalOpen || editingProduct) && (
        <AdminProductModal
          product={editingProduct}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSave}
          saving={editingProduct ? isUpdatingProduct : isCreatingProduct}
        />
      )}
    </>
  );
}
