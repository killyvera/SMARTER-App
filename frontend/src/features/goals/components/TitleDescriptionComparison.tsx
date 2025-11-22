'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Edit2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TitleDescriptionComparisonProps {
  currentTitle: string;
  currentDescription?: string | null;
  suggestedTitle?: string | null;
  suggestedDescription?: string | null;
  onAccept: (title: string, description?: string) => void;
  onReject: () => void;
}

type FieldType = 'title' | 'description';
type SelectionState = 'current' | 'suggested' | 'edited' | null;

export function TitleDescriptionComparison({
  currentTitle,
  currentDescription,
  suggestedTitle,
  suggestedDescription,
  onAccept,
  onReject,
}: TitleDescriptionComparisonProps) {
  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const [editedTitle, setEditedTitle] = useState(currentTitle);
  const [editedDescription, setEditedDescription] = useState(currentDescription || '');
  const [titleSelection, setTitleSelection] = useState<SelectionState>(null);
  const [descriptionSelection, setDescriptionSelection] = useState<SelectionState>(null);
  const [finalTitle, setFinalTitle] = useState(currentTitle);
  const [finalDescription, setFinalDescription] = useState(currentDescription || '');
  const [allAccepted, setAllAccepted] = useState(false);
  const [showComparisons, setShowComparisons] = useState(true);

  const hasTitleSuggestion = suggestedTitle && suggestedTitle !== currentTitle;
  const hasDescriptionSuggestion = suggestedDescription && suggestedDescription !== (currentDescription || '');

  if (!hasTitleSuggestion && !hasDescriptionSuggestion) {
    return null;
  }

  const handleAcceptTitle = () => {
    if (suggestedTitle) {
      setTitleSelection('suggested');
      setFinalTitle(suggestedTitle);
      onAccept(suggestedTitle, finalDescription || undefined);
    }
  };

  const handleAcceptDescription = () => {
    if (suggestedDescription) {
      setDescriptionSelection('suggested');
      setFinalDescription(suggestedDescription);
      onAccept(finalTitle, suggestedDescription);
    }
  };

  const handleRejectTitle = () => {
    setTitleSelection('current');
    setFinalTitle(currentTitle);
    onAccept(currentTitle, finalDescription || undefined);
  };

  const handleRejectDescription = () => {
    setDescriptionSelection('current');
    setFinalDescription(currentDescription || '');
    onAccept(finalTitle, currentDescription || undefined);
  };

  const handleAcceptAll = () => {
    if (allAccepted) {
      // Si ya está aceptado, mostrar de nuevo para editar
      setShowComparisons(true);
      setAllAccepted(false);
    } else {
      // Aceptar todas las mejoras
      setTitleSelection('suggested');
      setDescriptionSelection('suggested');
      const newTitle = suggestedTitle || currentTitle;
      const newDescription = suggestedDescription || currentDescription || '';
      setFinalTitle(newTitle);
      setFinalDescription(newDescription);
      setAllAccepted(true);
      setShowComparisons(false);
      onAccept(newTitle, newDescription || undefined);
    }
  };

  const handleSaveEdit = (field: FieldType) => {
    if (field === 'title') {
      setTitleSelection('edited');
      setFinalTitle(editedTitle);
      onAccept(editedTitle, finalDescription || undefined);
    } else {
      setDescriptionSelection('edited');
      setFinalDescription(editedDescription);
      onAccept(finalTitle, editedDescription || undefined);
    }
    setEditingField(null);
  };

  const handleStartEdit = (field: FieldType) => {
    // Si estaba todo aceptado, mostrar comparaciones de nuevo
    if (allAccepted) {
      setShowComparisons(true);
      setAllAccepted(false);
    }
    // Resetear selección cuando se empieza a editar
    if (field === 'title') {
      setTitleSelection(null);
      setEditedTitle(finalTitle);
    } else {
      setDescriptionSelection(null);
      setEditedDescription(finalDescription);
    }
    setEditingField(field);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Mejoras Sugeridas por IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen cuando todo está aceptado */}
        {allAccepted && !showComparisons && (
          <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </motion.div>
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  Todas las mejoras han sido aceptadas
                </h3>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Título final:</p>
                <p className="font-medium">{finalTitle}</p>
              </div>
              {finalDescription && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descripción final:</p>
                  <p className="text-sm">{finalDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Título */}
        {hasTitleSuggestion && showComparisons && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Título</Label>
            {editingField === 'title' ? (
              <div className="space-y-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Título mejorado"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit('title')}>
                    <Check className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedTitle(currentTitle);
                      setEditingField(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  titleSelection === 'current' 
                    ? "bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-500"
                    : "bg-muted border-transparent"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground">Actual:</p>
                    {titleSelection === 'current' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <p className={cn(
                    "font-medium",
                    titleSelection === 'current' && "text-green-700 dark:text-green-300"
                  )}>{currentTitle}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  titleSelection === 'suggested'
                    ? "bg-primary/20 border-primary dark:bg-primary/30"
                    : "bg-primary/10 border-primary/20"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(
                      "text-sm font-medium",
                      titleSelection === 'suggested' 
                        ? "text-primary" 
                        : "text-primary/70"
                    )}>Sugerido por IA:</p>
                    {titleSelection === 'suggested' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className={cn(
                    "font-medium",
                    titleSelection === 'suggested' && "text-primary"
                  )}>{suggestedTitle}</p>
                </div>
                {titleSelection === 'edited' && (
                  <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-lg dark:bg-blue-950/20 dark:border-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Versión editada:</p>
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-medium text-blue-700 dark:text-blue-300">{finalTitle}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAcceptTitle}
                    className={cn(
                      "relative transition-all duration-300",
                      titleSelection === 'suggested' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {titleSelection === 'suggested' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Usar Sugerido</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span>Usar Sugerido</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStartEdit('title')}
                    className={cn(
                      "relative transition-all duration-300",
                      titleSelection === 'edited' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {titleSelection === 'edited' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Editar</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          <span>Editar</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleRejectTitle}
                    className={cn(
                      "relative transition-all duration-300",
                      titleSelection === 'current' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {titleSelection === 'current' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Mantener Actual</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          <span>Mantener Actual</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Descripción */}
        {hasDescriptionSuggestion && showComparisons && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">Descripción</Label>
            {editingField === 'description' ? (
              <div className="space-y-2">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Descripción mejorada"
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleSaveEdit('description')}>
                    <Check className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditedDescription(currentDescription || '');
                      setEditingField(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  descriptionSelection === 'current' 
                    ? "bg-green-50 border-green-500 dark:bg-green-950/20 dark:border-green-500"
                    : "bg-muted border-transparent"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground">Actual:</p>
                    {descriptionSelection === 'current' && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <p className={cn(
                    "text-sm",
                    descriptionSelection === 'current' && "text-green-700 dark:text-green-300"
                  )}>{currentDescription || '(Sin descripción)'}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg border-2 transition-all",
                  descriptionSelection === 'suggested'
                    ? "bg-primary/20 border-primary dark:bg-primary/30"
                    : "bg-primary/10 border-primary/20"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(
                      "text-sm font-medium",
                      descriptionSelection === 'suggested' 
                        ? "text-primary" 
                        : "text-primary/70"
                    )}>Sugerido por IA:</p>
                    {descriptionSelection === 'suggested' && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className={cn(
                    "text-sm",
                    descriptionSelection === 'suggested' && "text-primary"
                  )}>{suggestedDescription}</p>
                </div>
                {descriptionSelection === 'edited' && (
                  <div className="p-3 bg-blue-50 border-2 border-blue-500 rounded-lg dark:bg-blue-950/20 dark:border-blue-500">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Versión editada:</p>
                      <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{finalDescription}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleAcceptDescription}
                    className={cn(
                      "relative transition-all duration-300",
                      descriptionSelection === 'suggested' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {descriptionSelection === 'suggested' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Usar Sugerido</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span>Usar Sugerido</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStartEdit('description')}
                    className={cn(
                      "relative transition-all duration-300",
                      descriptionSelection === 'edited' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {descriptionSelection === 'edited' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Editar</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          <span>Editar</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleRejectDescription}
                    className={cn(
                      "relative transition-all duration-300",
                      descriptionSelection === 'current' 
                        ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                        : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {descriptionSelection === 'current' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>Mantener Actual</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="normal"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center"
                        >
                          <X className="h-4 w-4 mr-1" />
                          <span>Mantener Actual</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón para aceptar todo */}
        {hasTitleSuggestion && hasDescriptionSuggestion && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleAcceptAll} 
              className={cn(
                "w-full relative transition-all duration-300",
                allAccepted 
                  ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-700" 
                  : "bg-background hover:bg-accent text-foreground border border-input hover:border-primary/50"
              )}
            >
              <AnimatePresence mode="wait">
                {allAccepted ? (
                  <motion.div
                    key="accepted"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Editar Mejoras Aceptadas</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    <span>Aceptar Todas las Mejoras</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

