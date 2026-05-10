/**
 * Referencia de API REST interna (prefijo /api) para el agente Smarter.
 * Se inyecta en el system prompt junto al snapshot de datos del usuario.
 */
export const AGENT_API_CATALOG = `
## API interna (autenticacion: header Authorization Bearer JWT)

### Metas (goals)
- GET /goals — Lista metas. Query opcional: ?status=DRAFT|ACTIVE|COMPLETED|ARCHIVED
- POST /goals — Crea meta en borrador. Body JSON: { title (string requerido), description?, deadline? (ISO o datetime-local YYYY-MM-DDTHH:mm), plannedHours?, isSingleDayGoal? }
- GET /goals/:id — Detalle de una meta (incluye minitasks, score si existe)
- PATCH /goals/:id — Actualiza meta. Body parcial: title, description, deadline, plannedHours, isSingleDayGoal, status (DRAFT|ACTIVE|COMPLETED|ARCHIVED)
- POST /goals/:id/validate — Validacion SMARTER con IA. Sin body: fase preview (devuelve feedback y sugerencias). Con body de confirmacion: { acceptedTitle?, acceptedDescription?, acceptedMiniTasks?: [{ title, description?, priority?, order?, dependsOn?, schedulingType?, scheduledDate?, scheduledTime? }] } crea minitasks y score
- PATCH /goals/:id/activate — Activa meta DRAFT ya validada (requiere SmarterScore passed y umbrales)
- POST /goals/check-completion — Revisa goals activas y marca completadas si todas las minitasks estan hechas

### Minitasks
- GET /minitasks — Lista. Query: ?goalId=... o ?status=... o sin query = todas del usuario
- POST /minitasks — Crea minitask. Body: { goalId, title, description?, deadline?, plannedHours?, isSingleDayTask? }
- GET /minitasks/:id — Detalle
- PATCH /minitasks/:id — Actualiza. Body parcial: title, description, deadline, status (DRAFT|PENDING|IN_PROGRESS|COMPLETED|CANCELLED), color, positionX/Y, order, priority, dependsOn, schedulingType, scheduledDate, scheduledTime, plannedHours, isSingleDayTask
- POST /minitasks/:id/validate — Valida minitask DRAFT con IA
- POST /minitasks/:id/unlock — Desbloquea minitask (IA + plugins); requiere dependencias cumplidas

### Journal (por minitask)
- GET /minitasks/:id/journal — Lista entradas
- POST /minitasks/:id/journal — Crea o fusiona entrada (misma fecha actualiza). Body: entryDate?, progressValue?, progressUnit?, notes?, obstacles?, mood?, timeSpent?, checklistCompleted?, metricsData?
- PATCH /minitasks/:id/journal/:entryId — Actualiza entrada
- GET /minitasks/:id/journal/metrics — Metricas agregadas
- POST /minitasks/:id/journal/coach — Coach IA por minitask. Body: { query, includeHistory? }

### Checklist
- GET|POST /minitasks/:id/checklist — Items de checklist
- PATCH /minitasks/:id/checklist/:itemId — Actualiza item

### Alarmas y resumen
- GET /alarms/pending-today — Pendientes de hoy (plugins calendar/reminder)
- GET /stats — Totales de goals/minitasks y progreso medio

### Reajustes
- GET /readjustments — Lista
- POST /readjustments — Crea reajuste
- GET /readjustments/goal/:goalId — Por meta

### Usuario
- GET|PATCH /user/profile — Perfil
- PATCH /user/password — Cambio de password

## Flujos recomendados
1) Nueva meta / validar DRAFT: create_goal si hace falta -> bucle de preguntas SMARTER en chat (minimo 2 respuestas del usuario) o cuestionario Grid SMARTER -> recien entonces validate_goal fase preview -> usuario revisa -> validate_goal fase confirm con accepted* -> activate_goal cuando corresponda. No saltes el bucle si el usuario solo dijo "si" a "validamos?".
2) Nueva minitask bajo meta activa: create_minitask con goalId del contexto -> opcional validate_minitask / unlock_minitask.
3) Cerrar dia: upsert_journal_today por minitask.
4) Eliminar meta: delete_goal (borra en cascada minitasks relacionadas en BD).
`.trim();
