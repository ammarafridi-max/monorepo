'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  requestMagicLinkApi,
  uploadDocumentApi,
  updateApplicantApi,
  updateApplicationProfileApi,
  adminReviewDocumentApi,
  adminUpdateApplicationApi,
  adminAddApplicantApi,
  adminUpdateApplicantApi,
  adminAddNoteApi,
  adminCreateApplicationApi,
  adminUploadDocumentApi,
  adminMarkInPersonApi,
  adminLinkSatisfiedByApi,
  adminAddDocumentRowApi,
  adminRemoveDocumentRowApi,
} from '../../services/apiVisaApplications.js';

// ---- Customer ----
export function useRequestMagicLink() {
  return useMutation({
    mutationFn: (email) => requestMagicLinkApi(email),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });
}

export function useUploadDocument(applicationRef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, documentId, file }) => uploadDocumentApi({ applicationRef, applicantId, documentId, file }),
    onSuccess: () => {
      toast.success('Document uploaded');
      qc.invalidateQueries({ queryKey: ['application', applicationRef] });
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: (err) => toast.error(err.message || 'Upload failed'),
  });
}

export function useUpdateApplicant(applicationRef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, patch }) => updateApplicantApi({ applicationRef, applicantId, patch }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['application', applicationRef] });
    },
    onError: (err) => toast.error(err.message || 'Could not save'),
  });
}

// Customer sets application-level answers (accommodation type).
export function useUpdateApplicationProfile(applicationRef) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => updateApplicationProfileApi({ applicationRef, patch }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['application', applicationRef] });
    },
    onError: (err) => toast.error(err.message || 'Could not save'),
  });
}

// ---- Admin ----
export function useReviewDocument(applicationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, decision, rejectionReason }) => adminReviewDocumentApi({ documentId, decision, rejectionReason }),
    onSuccess: (_data, vars) => {
      toast.success(vars.decision === 'APPROVED' ? 'Approved' : 'Rejected');
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
    },
    onError: (err) => toast.error(err.message || 'Review failed'),
  });
}

export function useUpdateApplication(applicationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch) => adminUpdateApplicationApi({ id: applicationId, patch }),
    onSuccess: () => {
      toast.success('Application updated');
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  });
}

export function useAddApplicant(applicationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAddApplicantApi({ id: applicationId, data }),
    onSuccess: () => {
      toast.success('Applicant added');
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
    },
    onError: (err) => toast.error(err.message || 'Could not add applicant'),
  });
}

export function useAdminUpdateApplicant(applicationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicantId, patch }) => adminUpdateApplicantApi({ id: applicationId, applicantId, patch }),
    onSuccess: () => {
      toast.success('Applicant updated');
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
    },
    onError: (err) => toast.error(err.message || 'Could not update applicant'),
  });
}

export function useAddNote(applicationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text) => adminAddNoteApi({ id: applicationId, text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
    },
    onError: (err) => toast.error(err.message || 'Could not add note'),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => adminCreateApplicationApi(body),
    onSuccess: () => {
      toast.success('Application created');
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (err) => toast.error(err.message || 'Could not create application'),
  });
}

// ---- Admin document-level actions (all invalidate the application detail) ----
function useAdminDocAction(applicationId, fn, successMsg) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      if (successMsg) toast.success(successMsg);
      qc.invalidateQueries({ queryKey: ['admin-application', applicationId] });
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });
}

export function useAdminUploadDocument(applicationId) {
  return useAdminDocAction(applicationId, ({ documentId, file }) => adminUploadDocumentApi({ documentId, file }), 'Document uploaded');
}
export function useAdminMarkInPerson(applicationId) {
  return useAdminDocAction(applicationId, ({ documentId, note }) => adminMarkInPersonApi({ documentId, note }), 'Marked complete');
}
export function useAdminLinkSatisfiedBy(applicationId) {
  return useAdminDocAction(applicationId, ({ documentId, sourceDocumentId }) => adminLinkSatisfiedByApi({ documentId, sourceDocumentId }), 'Updated');
}
export function useAdminAddDocumentRow(applicationId) {
  return useAdminDocAction(applicationId, ({ applicantId, docTypeKey }) => adminAddDocumentRowApi({ id: applicationId, applicantId, docTypeKey }), 'Document added');
}
export function useAdminRemoveDocumentRow(applicationId) {
  return useAdminDocAction(applicationId, ({ documentId }) => adminRemoveDocumentRowApi({ documentId }), 'Removed');
}

// Pause / resume reminders from the work-queue list (invalidates the list only).
export function useToggleReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reminderState }) => adminUpdateApplicationApi({ id, patch: { reminderState } }),
    onSuccess: (_data, vars) => {
      toast.success(vars.reminderState === 'PAUSED' ? 'Reminders paused' : 'Reminders resumed');
      qc.invalidateQueries({ queryKey: ['admin-applications'] });
    },
    onError: (err) => toast.error(err.message || 'Could not update reminders'),
  });
}
