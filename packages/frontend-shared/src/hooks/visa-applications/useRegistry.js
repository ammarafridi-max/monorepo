'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  listDocumentTypesApi, createDocumentTypeApi, updateDocumentTypeApi,
  listTemplatesApi, getTemplateApi, upsertTemplateApi, previewTemplateApi,
} from '../../services/apiVisaApplications.js';

// ---- Document types ---------------------------------------------------------
export function useDocumentTypes() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['document-types'],
    queryFn: listDocumentTypesApi,
  });
  return { documentTypes: data?.documentTypes ?? [], isLoading, isError, refetch };
}

export function useCreateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createDocumentTypeApi(body),
    onSuccess: () => { toast.success('Document type created'); qc.invalidateQueries({ queryKey: ['document-types'] }); },
    onError: (err) => toast.error(err.message || 'Could not create'),
  });
}

export function useUpdateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateDocumentTypeApi({ id, patch }),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['document-types'] }); },
    onError: (err) => toast.error(err.message || 'Could not save'),
  });
}

// ---- Templates --------------------------------------------------------------
export function useTemplates() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: listTemplatesApi,
  });
  return { templates: data?.templates ?? [], isLoading, isError, refetch };
}

export function useTemplate(id) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['checklist-template', id],
    queryFn: () => getTemplateApi(id),
    enabled: Boolean(id),
  });
  return { template: data?.template ?? null, isLoading, isError, refetch };
}

export function useUpsertTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => upsertTemplateApi(body),
    onSuccess: (_d, vars) => {
      toast.success('Template saved');
      qc.invalidateQueries({ queryKey: ['checklist-templates'] });
      if (vars?._id) qc.invalidateQueries({ queryKey: ['checklist-template', vars._id] });
    },
    onError: (err) => toast.error(err.message || 'Could not save template'),
  });
}

// Read-only preview: returns { samples, warnings } for the given (unsaved) rules.
export function usePreviewTemplate() {
  return useMutation({ mutationFn: (rules) => previewTemplateApi(rules) });
}
