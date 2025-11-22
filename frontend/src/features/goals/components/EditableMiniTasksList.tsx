'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Edit2, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface EditableMiniTask {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: 'accepted' | 'edited' | 'new' | 'deleted';
  selected: boolean;
}

interface EditableMiniTasksListProps {
  suggestedTasks: Array<{
    title: string;
    description?: string;
    priority: number;
  }>;
  onTasksChange: (tasks: EditableMiniTask[]) => void;
}

export function EditableMiniTasksList({
  suggestedTasks,
  onTasksChange,
}: EditableMiniTasksListProps) {
  const [tasks, setTasks] = useState<EditableMiniTask[]>(
    suggestedTasks.map((task, index) => ({
      id: `suggested-${index}`,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'accepted',
      selected: true, // Preseleccionadas por defecto
    }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; description: string; priority: number } | null>(null);

  const handleTaskChange = (updatedTasks: EditableMiniTask[]) => {
    setTasks(updatedTasks);
    // Solo pasar las tareas que estén seleccionadas y no eliminadas
    onTasksChange(updatedTasks.filter(t => t.status !== 'deleted' && t.selected));
  };

  const handleToggleSelection = (id: string) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    );
    handleTaskChange(updated);
  };

  const handleAccept = (id: string) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, status: 'accepted' as const } : t
    );
    handleTaskChange(updated);
  };

  const handleEdit = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setEditingId(id);
      setEditForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
      });
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm) return;
    const updated = tasks.map(t =>
      t.id === id
        ? {
            ...t,
            title: editForm.title,
            description: editForm.description || undefined,
            priority: editForm.priority,
            status: t.status === 'accepted' ? 'edited' as const : t.status,
          }
        : t
    );
    handleTaskChange(updated);
    setEditingId(null);
    setEditForm(null);
  };

  const handleDelete = (id: string) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, status: 'deleted' as const } : t
    );
    handleTaskChange(updated);
  };

  const handleAddNew = () => {
    const newTask: EditableMiniTask = {
      id: `new-${Date.now()}`,
      title: '',
      description: '',
      priority: 5,
      status: 'new',
      selected: true, // Las nuevas también vienen preseleccionadas
    };
    setTasks([...tasks, newTask]);
    setEditingId(newTask.id);
    setEditForm({
      title: '',
      description: '',
      priority: 5,
    });
  };

  const visibleTasks = tasks.filter(t => t.status !== 'deleted');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">MiniTasks Sugeridas</h3>
        <Button size="sm" variant="outline" onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Nueva
        </Button>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay minitasks sugeridas
        </p>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const isEditing = editingId === task.id;

            return (
              <Card
                key={task.id}
                className={
                  task.status === 'deleted'
                    ? 'opacity-50'
                    : task.status === 'edited'
                    ? 'border-primary'
                    : task.status === 'new'
                    ? 'border-green-500'
                    : ''
                }
              >
                <CardContent className="p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`title-${task.id}`}>Título *</Label>
                        <Input
                          id={`title-${task.id}`}
                          value={editForm?.title || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, title: e.target.value })
                          }
                          placeholder="Título de la minitask"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`desc-${task.id}`}>Descripción</Label>
                        <Textarea
                          id={`desc-${task.id}`}
                          value={editForm?.description || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm!, description: e.target.value })
                          }
                          placeholder="Descripción opcional"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`priority-${task.id}`}>Prioridad (1-10)</Label>
                        <Input
                          id={`priority-${task.id}`}
                          type="number"
                          min="1"
                          max="10"
                          value={editForm?.priority || 5}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm!,
                              priority: parseInt(e.target.value) || 5,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(task.id)}>
                          <Check className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={task.selected}
                            onCheckedChange={() => handleToggleSelection(task.id)}
                            className="mt-1"
                            id={`checkbox-${task.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Label 
                                htmlFor={`checkbox-${task.id}`}
                                className={cn(
                                  "font-medium cursor-pointer",
                                  !task.selected && "text-muted-foreground line-through"
                                )}
                              >
                                {task.title}
                              </Label>
                              {task.status === 'edited' && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Editada
                                </span>
                              )}
                              {task.status === 'new' && (
                                <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded">
                                  Nueva
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className={cn(
                                "text-sm mt-1",
                                !task.selected ? "text-muted-foreground line-through" : "text-muted-foreground"
                              )}>
                                {task.description}
                              </p>
                            )}
                            <p className={cn(
                              "text-xs mt-1",
                              !task.selected ? "text-muted-foreground line-through" : "text-muted-foreground"
                            )}>
                              Prioridad: {task.priority}/10
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {task.status !== 'accepted' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAccept(task.id)}
                              title="Aceptar"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(task.id)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

