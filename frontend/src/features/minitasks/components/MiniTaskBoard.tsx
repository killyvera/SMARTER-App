'use client';

import { useState, useMemo } from 'react';
import { useMiniTasks } from '../hooks/useMiniTasks';
import { MiniTaskCard } from './MiniTaskCard';
import { useUpdateMiniTask } from '../hooks/useMiniTasks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

const statusTabs = [
  { key: 'DRAFT', label: 'Borrador', icon: FileText },
  { key: 'PENDING', label: 'Pendiente', icon: Clock },
  { key: 'IN_PROGRESS', label: 'En Progreso', icon: PlayCircle },
  { key: 'COMPLETED', label: 'Completadas', icon: CheckCircle2 },
  { key: 'CANCELLED', label: 'Canceladas', icon: XCircle },
];

export function MiniTaskBoard() {
  const [activeTab, setActiveTab] = useState('PENDING');
  const updateMiniTask = useUpdateMiniTask();

  // Obtener todas las mini-tasks para contar por estado (sin filtros)
  const { data: allMiniTasks } = useMiniTasks(undefined);
  
  // Contar mini-tasks por estado
  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    statusTabs.forEach(tab => {
      counts[tab.key] = 0;
    });
    allMiniTasks?.forEach(task => {
      if (task.status in counts) {
        counts[task.status] = (counts[task.status] || 0) + 1;
      }
    });
    return counts;
  }, [allMiniTasks]);

  // Obtener mini-tasks del estado activo
  const { data: miniTasks } = useMiniTasks({ status: activeTab });

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateMiniTask.mutateAsync({ id, data: { status: status as any } });
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  // Obtener la información del tab activo
  const activeTabInfo = statusTabs.find(tab => tab.key === activeTab);
  const ActiveIcon = activeTabInfo?.icon || FileText;
  const activeCount = countsByStatus[activeTab] || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-full sm:w-auto mb-3 sm:mb-4">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              const count = countsByStatus[tab.key] || 0;
              
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 md:px-4 flex-1 sm:flex-initial"
                  title={tab.label} // Tooltip para móvil
                >
                  <Icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-0.5 sm:ml-1 h-5 min-w-[20px] px-1 sm:px-1.5 text-xs flex-shrink-0">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Subcabecera mostrando el estado activo - debajo de las pestañas */}
        <div className="flex items-center justify-between border-b pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <ActiveIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">
                {activeTabInfo?.label || 'Mini-tasks'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {activeCount === 0 
                  ? 'No hay tareas en este estado' 
                  : activeCount === 1 
                  ? '1 tarea' 
                  : `${activeCount} tareas`}
              </p>
            </div>
          </div>
          {activeCount > 0 && (
            <Badge variant="secondary" className="hidden sm:flex text-sm px-3 py-1">
              {activeCount}
            </Badge>
          )}
        </div>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <div className="space-y-2 sm:space-y-3">
              {miniTasks && miniTasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {miniTasks.map((task) => (
                    <MiniTaskCard
                      key={task.id}
                      miniTask={task}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-muted-foreground text-sm sm:text-base">
                    No hay mini-tasks en estado "{tab.label.toLowerCase()}"
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}


