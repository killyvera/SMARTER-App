'use client';

import { useState, useEffect } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/api';
import type { MiniTaskChecklistItem, ChecklistProgress } from '@/types/miniTaskChecklist';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ChecklistItemManagerProps {
  miniTaskId: string;
  checklistType: 'single' | 'multi-item';
  initialItems?: string[]; // Para crear items iniciales desde checklistItems del plugin
}

export function ChecklistItemManager({ 
  miniTaskId, 
  checklistType,
  initialItems = []
}: ChecklistItemManagerProps) {
  const queryClient = useQueryClient();
  const [newItemLabel, setNewItemLabel] = useState('');

  // Obtener items del checklist
  const { data, isLoading } = useQuery({
    queryKey: ['checklist-items', miniTaskId],
    queryFn: () =>
      apiRequest<{ items: MiniTaskChecklistItem[]; progress: ChecklistProgress }>(
        `/minitasks/${miniTaskId}/checklist`,
        { method: 'GET' }
      ),
  });

  // Crear item inicial si hay initialItems y no hay items aún
  const createInitialItems = useMutation({
    mutationFn: async (labels: string[]) => {
      const promises = labels.map((label, index) =>
        apiRequest<MiniTaskChecklistItem>(`/minitasks/${miniTaskId}/checklist`, {
          method: 'POST',
          body: JSON.stringify({ label, order: index }),
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', miniTaskId] });
    },
  });

  // Crear nuevo item
  const createItem = useMutation({
    mutationFn: (label: string) =>
      apiRequest<MiniTaskChecklistItem>(`/minitasks/${miniTaskId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ label }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', miniTaskId] });
      setNewItemLabel('');
    },
  });

  // Toggle item
  const toggleItem = useMutation({
    mutationFn: (itemId: string) =>
      apiRequest<MiniTaskChecklistItem>(`/minitasks/${miniTaskId}/checklist/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'toggle' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', miniTaskId] });
      queryClient.invalidateQueries({ queryKey: ['minitasks', miniTaskId] });
    },
  });

  // Eliminar item
  const deleteItem = useMutation({
    mutationFn: (itemId: string) =>
      apiRequest(`/minitasks/${miniTaskId}/checklist/${itemId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items', miniTaskId] });
    },
  });

  // Crear items iniciales si existen y no hay items aún (usar useEffect para evitar ejecución en cada render)
  useEffect(() => {
    if (initialItems.length > 0 && !isLoading && data && data.items.length === 0 && !createInitialItems.isPending) {
      createInitialItems.mutate(initialItems);
    }
  }, [initialItems.length, isLoading, data?.items.length, createInitialItems.isPending]);

  const items = data?.items || [];
  const progress = data?.progress || { total: 0, completed: 0, percentage: 0, allCompleted: false };

  const handleAddItem = () => {
    if (newItemLabel.trim()) {
      createItem.mutate(newItemLabel.trim());
    }
  };

  if (checklistType === 'single') {
    // Para single, mostrar un solo checkbox
    const singleItem = items[0];
    
    return (
      <div className="space-y-4">
        {singleItem ? (
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
            <Checkbox
              checked={singleItem.completed}
              onCheckedChange={() => toggleItem.mutate(singleItem.id)}
              disabled={toggleItem.isPending}
              className="h-5 w-5"
            />
            <label className="flex-1 cursor-pointer">
              <div className="font-medium">{singleItem.label}</div>
            </label>
            {singleItem.completed && (
              <div className="text-green-600">
                <Check className="h-5 w-5" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No hay elementos en el checklist
          </div>
        )}
      </div>
    );
  }

  // Para multi-item
  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      {progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {progress.completed} / {progress.total} elementos
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Lista de items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
              item.completed ? 'bg-green-50 border-green-200' : 'bg-card'
            }`}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem.mutate(item.id)}
              disabled={toggleItem.isPending}
              className="h-5 w-5"
            />
            <label className="flex-1 cursor-pointer">
              <div className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                {item.label}
              </div>
              {item.completedAt && (
                <div className="text-xs text-muted-foreground">
                  Completado: {new Date(item.completedAt).toLocaleDateString('es-ES')}
                </div>
              )}
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteItem.mutate(item.id)}
              disabled={deleteItem.isPending}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Agregar nuevo item */}
      <div className="flex gap-2">
        <Input
          value={newItemLabel}
          onChange={(e) => setNewItemLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddItem();
            }
          }}
          placeholder="Agregar elemento al checklist..."
          className="flex-1"
        />
        <Button
          onClick={handleAddItem}
          disabled={!newItemLabel.trim() || createItem.isPending}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      {/* Mensaje cuando todos están completados */}
      {progress.allCompleted && (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-900 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span className="font-medium">¡Todos los elementos están completados!</span>
          </div>
        </div>
      )}
    </div>
  );
}

