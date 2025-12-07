/**
 * Calcula el progreso de una goal basado en el estado de sus minitasks
 * @param miniTasks Array de minitasks con al menos el campo status
 * @returns Objeto con completed, total y percentage
 */
export function calculateGoalProgress(miniTasks: Array<{ status: string }> = []) {
  // Contar todas las minitasks excepto las que están CANCELLED
  // Las minitasks DRAFT SÍ se cuentan porque forman parte del total de la goal
  // Solo excluimos las canceladas porque no forman parte del trabajo a realizar
  const validMiniTasks = miniTasks.filter(task => task.status !== 'CANCELLED');
  const total = validMiniTasks.length;
  const completed = validMiniTasks.filter(task => task.status === 'COMPLETED').length;
  
  // Calcular porcentaje basado en todas las minitasks válidas (excepto CANCELLED)
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Debug: log para verificar el cálculo
  if (process.env.NODE_ENV === 'development') {
    console.log('[calculateGoalProgress]', {
      totalMiniTasks: miniTasks.length,
      validMiniTasks: validMiniTasks.length,
      completed,
      total,
      percentage,
      statuses: miniTasks.map(t => t.status),
      statusCounts: {
        DRAFT: miniTasks.filter(t => t.status === 'DRAFT').length,
        PENDING: miniTasks.filter(t => t.status === 'PENDING').length,
        IN_PROGRESS: miniTasks.filter(t => t.status === 'IN_PROGRESS').length,
        COMPLETED: miniTasks.filter(t => t.status === 'COMPLETED').length,
        CANCELLED: miniTasks.filter(t => t.status === 'CANCELLED').length,
      },
    });
  }
  
  return {
    completed,
    total,
    percentage,
  };
}

