// Exportar plugins
export { CalendarPlugin } from './calendar/CalendarPlugin';
export { ReminderPlugin } from './reminder/ReminderPlugin';
export { ProgressTrackerPlugin } from './progress/ProgressTrackerPlugin';
export { ChartPlugin } from './chart/ChartPlugin';

// Exportar registry
export { pluginRegistry, registerPlugin } from './pluginRegistry';

// Inicializar y registrar todos los plugins
import { CalendarPlugin } from './calendar/CalendarPlugin';
import { ReminderPlugin } from './reminder/ReminderPlugin';
import { ProgressTrackerPlugin } from './progress/ProgressTrackerPlugin';
import { ChartPlugin } from './chart/ChartPlugin';
import { registerPlugin } from './pluginRegistry';

// Registrar plugins al importar este módulo
if (typeof window !== 'undefined') {
  registerPlugin(new CalendarPlugin());
  registerPlugin(new ReminderPlugin());
  registerPlugin(new ProgressTrackerPlugin());
  registerPlugin(new ChartPlugin());
}

