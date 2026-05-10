import { AuthGuard } from '@/components/AuthGuard';
import { AgentAppLayout } from '@/components/layout/AgentAppLayout';
import { UpdateBanner } from '@/components/UpdateBanner';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AgentAppLayout>{children}</AgentAppLayout>
      <UpdateBanner />
    </AuthGuard>
  );
}


