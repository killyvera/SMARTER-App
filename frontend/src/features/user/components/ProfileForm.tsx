'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarUpload } from './AvatarUpload';
import { useUserProfile, useUpdateProfile } from '../hooks/useUserProfile';
import { Loader2 } from 'lucide-react';

export function ProfileForm() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || null);
      setIsDirty(false);
    }
  }, [profile]);

  const handleNameChange = (value: string) => {
    setName(value);
    setIsDirty(true);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setIsDirty(true);
  };

  const handleAvatarChange = (url: string | null) => {
    setAvatarUrl(url);
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync({
        name: name || undefined,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>
          Actualiza tu información personal y avatar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onAvatarChange={handleAvatarChange}
              disabled={updateProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              El email no se puede cambiar
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Tu nombre completo"
              disabled={updateProfile.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+1234567890"
              disabled={updateProfile.isPending}
            />
          </div>

          {updateProfile.isError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Error al actualizar perfil'}
            </div>
          )}

          {updateProfile.isSuccess && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              Perfil actualizado correctamente
            </div>
          )}

          <Button
            type="submit"
            disabled={!isDirty || updateProfile.isPending}
            className="w-full"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

