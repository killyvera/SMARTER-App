import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAlarmTimes() {
  console.log('🔄 Migrando alarmTime a alarmTimes...');

  const plugins = await prisma.miniTaskPlugin.findMany({
    where: {
      pluginId: 'calendar',
    },
  });

  let migrated = 0;

  for (const plugin of plugins) {
    try {
      const config = typeof plugin.config === 'string' ? JSON.parse(plugin.config) : plugin.config;
      
      // Si ya tiene alarmTimes, saltar
      if (config.alarmTimes && Array.isArray(config.alarmTimes)) {
        continue;
      }

      // Si tiene alarmTime, migrar a alarmTimes
      if (config.alarmTime && typeof config.alarmTime === 'string') {
        config.alarmTimes = [config.alarmTime];
        delete config.alarmTime;

        await prisma.miniTaskPlugin.update({
          where: { id: plugin.id },
          data: {
            config: JSON.stringify(config),
          },
        });

        migrated++;
      }
    } catch (error) {
      console.error(`Error migrando plugin ${plugin.id}:`, error);
    }
  }

  console.log(`✅ Migrados ${migrated} plugins`);
}

migrateAlarmTimes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

