'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCreateMiniTask } from '@/features/minitasks/hooks/useMiniTasks';
import { MiniTaskWizard } from '@/features/minitasks/components/MiniTaskWizard';
import type { CreateMiniTaskInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewMiniTasksPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;

  const createMiniTask = useCreateMiniTask();

  const handleSubmit = async (tasks: CreateMiniTaskInput[]) => {
    try {
      await Promise.all(tasks.map((task) => createMiniTask.mutateAsync(task)));
      router.push(`/goals/${goalId}`);
    } catch (error) {
      console.error('Error al crear minitasks:', error);
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

      <h1 className="text-3xl font-bold mb-6">Crear MiniTasks</h1>

      <MiniTaskWizard
        goalId={goalId}
        onSubmit={handleSubmit}
        isLoading={createMiniTask.isPending}
      />
    </div>
  );
}


