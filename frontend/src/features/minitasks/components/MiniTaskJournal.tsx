'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { useMiniTaskJournal, useCreateMiniTaskJournalEntry, useUpdateMiniTaskJournalEntry, useDeleteMiniTaskJournalEntry } from '../hooks/useMiniTaskJournal';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalEntryCard } from './JournalEntryCard';
import { CoachDialog } from './CoachDialog';
import type { MiniTaskJournalEntry, CreateMiniTaskJournalEntryInput } from '@/types/miniTaskJournal';

interface MiniTaskJournalProps {
  miniTaskId: string;
}

export function MiniTaskJournal({ miniTaskId }: MiniTaskJournalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MiniTaskJournalEntry | null>(null);
  const [showCoach, setShowCoach] = useState(false);

  const { data: entries, isLoading } = useMiniTaskJournal(miniTaskId);
  const createEntry = useCreateMiniTaskJournalEntry();
  const updateEntry = useUpdateMiniTaskJournalEntry();
  const deleteEntry = useDeleteMiniTaskJournalEntry();

  const handleSubmit = async (data: CreateMiniTaskJournalEntryInput) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({
        miniTaskId,
        entryId: editingEntry.id,
        data,
      });
      setEditingEntry(null);
    } else {
      await createEntry.mutateAsync({
        miniTaskId,
        data,
      });
    }
    setShowForm(false);
  };

  const handleEdit = (entry: MiniTaskJournalEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      await deleteEntry.mutateAsync({ miniTaskId, entryId });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Journal Diario</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCoach(true)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Consultar Coach
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Entrada
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry ? 'Editar Entrada' : 'Nueva Entrada del Journal'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JournalEntryForm
              miniTaskId={miniTaskId}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              initialData={editingEntry ? {
                entryDate: editingEntry.entryDate,
                progressValue: editingEntry.progressValue ?? undefined,
                progressUnit: editingEntry.progressUnit ?? undefined,
                notes: editingEntry.notes ?? undefined,
                obstacles: editingEntry.obstacles ?? undefined,
                mood: editingEntry.mood as 'positivo' | 'neutral' | 'negativo' | undefined,
                timeSpent: editingEntry.timeSpent ?? undefined,
              } : undefined}
              isLoading={createEntry.isPending || updateEntry.isPending}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando entradas del journal...
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No hay entradas en el journal aún.</p>
            <p className="text-sm mt-2">Crea tu primera entrada para comenzar a registrar tu progreso.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCoach && (
        <CoachDialog
          miniTaskId={miniTaskId}
          open={showCoach}
          onClose={() => setShowCoach(false)}
        />
      )}
    </div>
  );
}

