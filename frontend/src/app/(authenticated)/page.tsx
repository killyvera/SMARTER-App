'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStats } from '@/features/dashboard/hooks/useStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Target, CheckSquare, TrendingUp, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de bienvenida */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {user?.email?.split('@')[0] || 'Usuario'}
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tu progreso
        </p>
      </div>

      {/* Cards de estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goals.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.goals.active} activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Completadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goals.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.progress.percentage}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MiniTasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.miniTasks.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.miniTasks.pending} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MiniTasks Completadas</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.miniTasks.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.miniTasks.total > 0 
                ? Math.round((stats.miniTasks.completed / stats.miniTasks.total) * 100) 
                : 0}% completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de progreso de metas */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Metas</CardTitle>
          <CardDescription>
            Visualización del progreso general de tus metas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso general</span>
              <span className="font-medium">{stats.progress.percentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.progress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>{stats.progress.completed} completadas</span>
              <span>{stats.progress.total} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribución de estados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Metas</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Activas</span>
                </div>
                <span className="font-medium">{stats.goals.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completadas</span>
                </div>
                <span className="font-medium">{stats.goals.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Borradores</span>
                </div>
                <span className="font-medium">{stats.goals.draft}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de MiniTasks</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <span className="font-medium">{stats.miniTasks.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completadas</span>
                </div>
                <span className="font-medium">{stats.miniTasks.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Borradores</span>
                </div>
                <span className="font-medium">{stats.miniTasks.draft}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/goals/new" className="w-full">
                <Plus className="h-5 w-5 mb-2" />
                <span className="font-semibold">Nueva Meta</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Crear una nueva meta SMARTER
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/goals" className="w-full">
                <Target className="h-5 w-5 mb-2" />
                <span className="font-semibold">Ver Metas</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Gestionar todas tus metas
                </span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto flex-col items-start p-4">
              <Link href="/minitasks" className="w-full">
                <CheckSquare className="h-5 w-5 mb-2" />
                <span className="font-semibold">Ver MiniTasks</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Gestionar tus tareas
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

