'use client';

import { MiniTaskBoard } from '@/features/minitasks/components/MiniTaskBoard';

export default function MiniTasksPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Tablero de MiniTasks</h1>
      <MiniTaskBoard />
    </div>
  );
}

