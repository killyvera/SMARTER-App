'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import type { UserProfileResponse, UpdateProfileInput, ChangePasswordInput } from '@smarter-app/shared';

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiRequest<UserProfileResponse>('/user/profile', {
      method: 'GET',
    }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      apiRequest<UserProfileResponse>('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      apiRequest<{ success: boolean; message: string }>('/user/password', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json().catch(() => ({}))) as { avatarUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      if (!data.avatarUrl) {
        throw new Error('Respuesta inválida del servidor');
      }
      return data.avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

