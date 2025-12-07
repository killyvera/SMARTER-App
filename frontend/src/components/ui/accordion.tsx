'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  question: string;
  answer: string | React.ReactNode;
  defaultOpen?: boolean;
}

export function AccordionItem({ question, answer, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors group"
      >
        <span className="font-semibold text-base pr-4 group-hover:text-primary transition-colors">
          {question}
        </span>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t bg-muted/30 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-4">
            {typeof answer === 'string' ? (
              <div className="text-muted-foreground leading-relaxed space-y-3">
                {answer.split('\n\n').map((paragraph, idx) => {
                  // Renderizar markdown básico
                  let content = paragraph;
                  
                  // Negritas **texto**
                  content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
                  
                  // Listas con guiones
                  if (content.trim().startsWith('- ')) {
                    const items = paragraph.split('\n').filter(line => line.trim().startsWith('- '));
                    return (
                      <ul key={idx} className="list-disc list-inside space-y-2 ml-4">
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item.replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>') }} />
                        ))}
                      </ul>
                    );
                  }
                  
                  // Listas numeradas
                  if (/^\d+\.\s/.test(content.trim())) {
                    const items = paragraph.split('\n').filter(line => /^\d+\.\s/.test(line.trim()));
                    return (
                      <ol key={idx} className="list-decimal list-inside space-y-2 ml-4">
                        {items.map((item, itemIdx) => (
                          <li key={itemIdx} dangerouslySetInnerHTML={{ __html: item.replace(/^\d+\.\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>') }} />
                        ))}
                      </ol>
                    );
                  }
                  
                  // Párrafo normal
                  return (
                    <p key={idx} dangerouslySetInnerHTML={{ __html: content }} />
                  );
                })}
              </div>
            ) : (
              answer
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface AccordionProps {
  children: React.ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
}

