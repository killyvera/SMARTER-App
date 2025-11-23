'use client';

import { ChevronDown, ChevronUp, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePluginVisibilityStore } from '@/stores/pluginVisibilityStore';
import { cn } from '@/lib/utils';

interface PluginSectionProps {
  miniTaskId: string;
  pluginId: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export function PluginSection({
  miniTaskId,
  pluginId,
  title,
  icon,
  children,
  defaultExpanded = false,
}: PluginSectionProps) {
  const { isExpanded, isPinned, togglePlugin, pinPlugin, unpinPlugin } = usePluginVisibilityStore();
  
  const pinned = isPinned(miniTaskId, pluginId);
  const expanded = isExpanded(miniTaskId, pluginId) || (defaultExpanded && !pinned) || pinned;

  const handleToggle = () => {
    togglePlugin(miniTaskId, pluginId);
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinned) {
      unpinPlugin(miniTaskId, pluginId);
    } else {
      pinPlugin(miniTaskId, pluginId);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePinToggle}
            className={cn(
              "h-8 w-8 p-0",
              pinned && "text-primary"
            )}
            title={pinned ? "Desfijar plugin" : "Fijar plugin"}
          >
            {pinned ? (
              <Pin className="h-4 w-4 fill-current" />
            ) : (
              <PinOff className="h-4 w-4" />
            )}
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="p-4 border-t bg-card">
          {children}
        </div>
      )}
    </div>
  );
}

