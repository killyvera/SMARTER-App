'use client';

import { ProfileForm } from '@/features/user/components/ProfileForm';
import { PasswordChangeForm } from '@/features/user/components/PasswordChangeForm';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <ProfileForm />
        <PasswordChangeForm />
      </div>
    </div>
  );
}

