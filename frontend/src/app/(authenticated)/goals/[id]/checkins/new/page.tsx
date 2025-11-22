'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCreateCheckIn } from '@/features/checkins/hooks/useCheckIns';
import { CheckInForm } from '@/features/checkins/components/CheckInForm';
import type { CreateCheckInInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;

  const createCheckIn = useCreateCheckIn();

  const handleSubmit = async (data: CreateCheckInInput) => {
    try {
      await createCheckIn.mutateAsync(data);
      router.push(`/goals/${goalId}`);
    } catch (error) {
      console.error('Error al crear check-in:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href={`/goals/${goalId}`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-6">Nuevo Check-in</h1>

      <CheckInForm
        goalId={goalId}
        onSubmit={handleSubmit}
        isLoading={createCheckIn.isPending}
      />
    </div>
  );
}


