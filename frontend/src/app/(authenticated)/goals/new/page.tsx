'use client';

import { useRouter } from 'next/navigation';
import { useCreateGoal } from '@/features/goals/hooks/useGoals';
import { GoalForm } from '@/features/goals/components/GoalForm';
import type { CreateGoalInput } from '@smarter-app/shared';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewGoalPage() {
  const router = useRouter();
  const createGoal = useCreateGoal();

  const handleSubmit = async (data: CreateGoalInput) => {
    try {
      const goal = await createGoal.mutateAsync(data);
      router.push(`/goals/${goal.id}`);
    } catch (error) {
      console.error('Error al crear goal:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/goals">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-6">Nueva Meta</h1>

      <GoalForm
        onSubmit={handleSubmit}
        isLoading={createGoal.isPending}
      />
    </div>
  );
}


