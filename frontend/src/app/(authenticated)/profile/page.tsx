'use client';

import { ProfileForm } from '@/features/user/components/ProfileForm';
import { PasswordChangeForm } from '@/features/user/components/PasswordChangeForm';

export default function ProfilePage() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <ProfileForm />
        <PasswordChangeForm />
      </div>
    </div>
  );
}

