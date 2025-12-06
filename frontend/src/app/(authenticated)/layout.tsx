import { AuthGuard } from '@/components/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { UpdateBanner } from '@/components/UpdateBanner';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
      <UpdateBanner />
    </AuthGuard>
  );
}


