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

