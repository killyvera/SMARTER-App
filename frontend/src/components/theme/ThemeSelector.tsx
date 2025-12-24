'use client';

import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { theme, changeTheme } = useTheme();

  const themes = [
    {
      id: 'light' as const,
      name: 'Claro',
      icon: Sun,
      description: 'Tema claro estándar',
      preview: 'bg-gradient-to-br from-white to-gray-100',
    },
    {
      id: 'dark' as const,
      name: 'Oscuro',
      icon: Moon,
      description: 'Tema oscuro elegante',
      preview: 'bg-gradient-to-br from-gray-900 to-gray-800',
    },
    {
      id: 'cyberpunk' as const,
      name: 'Cyberpunk',
      icon: Zap,
      description: 'Tema neón estilo cyberpunk',
      preview: 'bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900',
    },
    {
      id: 'banana-cream' as const,
      name: 'Banana Cream',
      icon: Sparkles,
      description: 'Tema kawaii crema cálido',
      preview: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Tema
        </CardTitle>
        <CardDescription>
          Elige el tema visual de la aplicación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.id;
            
            return (
              <button
                key={themeOption.id}
                onClick={() => changeTheme(themeOption.id)}
                className={cn(
                  'relative flex flex-col gap-3 p-4 rounded-lg border-2 transition-all',
                  'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isActive
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {/* Preview del tema */}
                <div className={cn(
                  'w-full h-16 rounded-md border-2 overflow-hidden',
                  themeOption.preview,
                  isActive ? 'border-primary/50' : 'border-border/50'
                )}>
                  <div className="h-full flex items-center justify-center">
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <p
                      className={cn(
                        'font-semibold text-sm',
                        isActive ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {themeOption.name}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {themeOption.description}
                  </p>
                </div>
                
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

