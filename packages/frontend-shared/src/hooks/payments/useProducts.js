'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createProductApi,
  deleteProductApi,
  getProductApi,
  listProductsApi,
  updateProductActiveApi,
  updateProductApi,
} from '../../services/apiPayments.js';

export function useProducts({ activeOnly = false, page = 1, limit = 50 } = {}) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-products', { activeOnly, page, limit }],
    queryFn: () => listProductsApi({ activeOnly, page, limit }),
  });
  return {
    products: data?.items ?? [],
    pagination: data?.pagination,
    isLoadingProducts: isLoading,
    isErrorProducts: isError,
    productsError: error,
  };
}

export function useProduct(id) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => getProductApi(id),
    enabled: Boolean(id),
  });
  return {
    product: data,
    isLoadingProduct: isLoading,
    isErrorProduct: isError,
    productError: error,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  const { mutate: createProduct, isPending: isCreatingProduct } = useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      toast.success('Product created');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create product');
    },
  });

  return { createProduct, isCreatingProduct };
}

export function useSetProductActive() {
  const queryClient = useQueryClient();

  const { mutate: setProductActive, isPending: isSettingProductActive } = useMutation({
    mutationFn: ({ id, active }) => updateProductActiveApi(id, active),
    onSuccess: (updated) => {
      toast.success(updated?.isActive ? 'Product enabled' : 'Product disabled');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (updated?._id) {
        queryClient.invalidateQueries({ queryKey: ['admin-product', updated._id] });
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update product');
    },
  });

  return { setProductActive, isSettingProductActive };
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  const { mutate: updateProduct, isPending: isUpdatingProduct } = useMutation({
    mutationFn: ({ id, ...payload }) => updateProductApi(id, payload),
    onSuccess: (updated) => {
      toast.success('Product updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (updated?._id) {
        queryClient.invalidateQueries({ queryKey: ['admin-product', updated._id] });
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update product');
    },
  });

  return { updateProduct, isUpdatingProduct };
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  const { mutate: deleteProduct, isPending: isDeletingProduct } = useMutation({
    mutationFn: (id) => deleteProductApi(id),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete product');
    },
  });

  return { deleteProduct, isDeletingProduct };
}
