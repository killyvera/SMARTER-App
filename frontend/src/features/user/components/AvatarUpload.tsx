'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useDeleteAvatar, useUploadAvatar } from '../hooks/useUserProfile';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string | null) => void;
  disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarUpload({ currentAvatarUrl, onAvatarChange, disabled }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  useEffect(() => {
    setPreview(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Usá JPEG, PNG, WebP o GIF');
      return;
    }

    if (file.size > MAX_BYTES) {
      alert('La imagen no puede superar 5 MB');
      return;
    }

    try {
      const url = await uploadAvatar.mutateAsync(file);
      setPreview(url);
      onAvatarChange(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo subir el avatar');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    const isHttp =
      typeof preview === 'string' &&
      (preview.startsWith('http://') || preview.startsWith('https://'));

    if (isHttp) {
      try {
        await deleteAvatar.mutateAsync();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'No se pudo eliminar el avatar');
        return;
      }
    }

    setPreview(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const busy = uploadAvatar.isPending || deleteAvatar.isPending;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="Avatar"
              width={120}
              height={120}
              unoptimized={preview.startsWith('data:')}
              className="rounded-full object-cover border-4 border-border"
            />
            {!disabled && !busy && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                onClick={() => void handleRemove()}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="w-[120px] h-[120px] rounded-full bg-muted flex items-center justify-center border-4 border-border">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {!disabled && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {preview ? 'Cambiar' : 'Subir'} Avatar
          </Button>
          {preview && !busy && (
            <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemove()}>
              Eliminar
            </Button>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || busy}
      />
      
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Se guarda en Supabase Storage. JPG, PNG, WebP o GIF. Máximo 5 MB.
      </p>
    </div>
  );
}

