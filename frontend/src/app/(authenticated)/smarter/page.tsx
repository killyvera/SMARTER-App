'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Target, TrendingUp, Clock, RefreshCw, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function SmarterDetailPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (letter: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [letter]: !prev[letter],
    }));
  };
  const smarterComponents = [
    {
      letter: 'S',
      name: 'Specific (Específico)',
      icon: Target,
      description: 'Tu objetivo debe ser claro, preciso y bien definido. Evita ambigüedades.',
      questions: [
        '¿Qué quiero lograr exactamente?',
        '¿Por qué es importante este objetivo?',
        '¿Quién está involucrado?',
        '¿Dónde se llevará a cabo?',
        '¿Qué recursos o limitaciones existen?',
      ],
      examples: [
        {
          bad: 'Quiero estar en mejor forma física',
          good: 'Quiero correr 5 kilómetros en menos de 30 minutos para el 1 de junio de 2025',
        },
        {
          bad: 'Quiero aprender un idioma',
          good: 'Quiero alcanzar el nivel B2 de inglés certificado mediante examen TOEFL para diciembre de 2025',
        },
      ],
      tips: [
        'Usa números y fechas específicas',
        'Define el resultado final claramente',
        'Evita palabras vagas como "mejor", "más", "algunos"',
      ],
    },
    {
      letter: 'M',
      name: 'Measurable (Medible)',
      icon: TrendingUp,
      description: 'Debes poder medir tu progreso y determinar cuándo has alcanzado el objetivo.',
      questions: [
        '¿Cómo sabré que he logrado el objetivo?',
        '¿Qué métricas usaré para medir el progreso?',
        '¿Cuánto es suficiente?',
        '¿Cómo rastrearé mi avance?',
      ],
      examples: [
        {
          bad: 'Quiero leer más libros',
          good: 'Quiero leer 24 libros este año (2 por mes), registrando cada lectura en mi lista',
        },
        {
          bad: 'Quiero ahorrar dinero',
          good: 'Quiero ahorrar $5,000 para el 31 de diciembre de 2025, depositando $417 mensuales',
        },
      ],
      tips: [
        'Establece números concretos',
        'Define unidades de medida claras',
        'Crea un sistema de seguimiento',
        'Usa herramientas de medición (apps, hojas de cálculo, etc.)',
      ],
    },
    {
      letter: 'A',
      name: 'Achievable (Alcanzable)',
      icon: CheckCircle2,
      description: 'El objetivo debe ser realista y alcanzable con los recursos y tiempo disponibles.',
      questions: [
        '¿Tengo los recursos necesarios para lograr esto?',
        '¿Es realista considerando mis limitaciones?',
        '¿He logrado objetivos similares antes?',
        '¿Qué obstáculos puedo enfrentar?',
      ],
      examples: [
        {
          bad: 'Quiero ser millonario en 3 meses sin experiencia',
          good: 'Quiero aumentar mis ingresos en un 30% este año mediante la promoción en mi trabajo actual y proyectos freelance',
        },
        {
          bad: 'Quiero correr un maratón mañana sin entrenamiento',
          good: 'Quiero completar un maratón en 6 meses, siguiendo un plan de entrenamiento progresivo de 3 veces por semana',
        },
      ],
      tips: [
        'Evalúa honestamente tus capacidades actuales',
        'Considera tus recursos disponibles (tiempo, dinero, energía)',
        'Divide objetivos grandes en pasos más pequeños',
        'Busca objetivos desafiantes pero no imposibles',
      ],
    },
    {
      letter: 'R',
      name: 'Relevant (Relevante)',
      icon: Eye,
      description: 'El objetivo debe ser importante para ti y alineado con tus valores y objetivos a largo plazo.',
      questions: [
        '¿Por qué es importante este objetivo para mí?',
        '¿Cómo se alinea con mis valores?',
        '¿Contribuye a mis objetivos a largo plazo?',
        '¿Es el momento adecuado para perseguir esto?',
      ],
      examples: [
        {
          bad: 'Aprender a tocar piano porque mi amigo lo hace',
          good: 'Aprender a tocar piano porque siempre he amado la música y quiero desarrollar mi creatividad como parte de mi crecimiento personal',
        },
        {
          bad: 'Hacer un MBA porque está de moda',
          good: 'Completar un MBA porque necesito estas habilidades para avanzar en mi carrera hacia un puesto de liderazgo, que es mi objetivo profesional a 5 años',
        },
      ],
      tips: [
        'Conecta el objetivo con tus valores personales',
        'Asegúrate de que te motive genuinamente',
        'Verifica que no entre en conflicto con otras prioridades',
        'Considera el impacto en tu vida personal y profesional',
      ],
    },
    {
      letter: 'T',
      name: 'Time-bound (Con límite de tiempo)',
      icon: Clock,
      description: 'Debe tener una fecha límite clara para crear urgencia y permitir la planificación.',
      questions: [
        '¿Cuándo quiero lograr esto?',
        '¿Cuál es la fecha límite?',
        '¿Cuánto tiempo necesito para cada paso?',
        '¿Hay hitos intermedios con fechas?',
      ],
      examples: [
        {
          bad: 'Quiero escribir un libro algún día',
          good: 'Quiero completar el primer borrador de mi novela (80,000 palabras) para el 30 de septiembre de 2025, escribiendo 1,000 palabras por semana',
        },
        {
          bad: 'Quiero perder peso',
          good: 'Quiero perder 10 kilogramos para el 1 de julio de 2025, perdiendo aproximadamente 0.5 kg por semana mediante dieta y ejercicio',
        },
      ],
      tips: [
        'Establece fechas específicas, no aproximadas',
        'Crea hitos intermedios con fechas',
        'Considera el tiempo realista necesario',
        'Usa calendarios y recordatorios',
      ],
    },
    {
      letter: 'E',
      name: 'Evaluated (Evaluado)',
      icon: TrendingUp,
      description: 'Evalúa regularmente tu progreso para medir qué tan bien estás avanzando hacia tu objetivo.',
      questions: [
        '¿Cómo mediré mi progreso regularmente?',
        '¿Con qué frecuencia debo evaluar?',
        '¿Qué métricas usaré?',
        '¿Estoy avanzando al ritmo esperado?',
      ],
      examples: [
        {
          bad: 'Voy a revisar mi progreso cuando me acuerde',
          good: 'Evaluaré mi progreso cada viernes, midiendo las palabras escritas, páginas completadas y calidad del contenido',
        },
        {
          bad: 'Veré cómo va mi objetivo al final',
          good: 'Evaluaré semanalmente mi progreso de ahorro, comparando el monto ahorrado con la meta mensual y ajustando gastos si es necesario',
        },
      ],
      tips: [
        'Establece un horario regular de evaluación',
        'Usa herramientas de seguimiento (apps, hojas de cálculo)',
        'Compara tu progreso actual con el planificado',
        'Celebra los pequeños logros',
        'Identifica patrones y tendencias',
      ],
    },
    {
      letter: 'R',
      name: 'Reviewed (Revisado)',
      icon: RefreshCw,
      description: 'Revisa periódicamente tu objetivo completo para ajustar estrategias, plazos o incluso el objetivo mismo.',
      questions: [
        '¿Sigue siendo relevante este objetivo?',
        '¿Necesito ajustar mi estrategia?',
        '¿Hay obstáculos que no anticipé?',
        '¿Debo modificar los plazos?',
        '¿El objetivo necesita ser replanteado?',
      ],
      examples: [
        {
          bad: 'Sigo con el mismo plan sin importar qué',
          good: 'Revisaré mi objetivo mensualmente, analizando si las estrategias funcionan, si los plazos son realistas, y si necesito hacer ajustes basados en lo aprendido',
        },
        {
          bad: 'No cambio nada aunque no funcione',
          good: 'Revisaré trimestralmente mi objetivo profesional, considerando cambios en el mercado, nuevas oportunidades y ajustando mi plan de carrera según sea necesario',
        },
      ],
      tips: [
        'Programa revisiones periódicas (mensuales o trimestrales)',
        'Sé honesto sobre qué está funcionando y qué no',
        'No tengas miedo de ajustar o replantear objetivos',
        'Aprende de los obstáculos y fracasos',
        'Mantén la flexibilidad sin perder el enfoque',
      ],
    },
  ];

  return (
    <div className="w-full max-w-full py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 sm:gap-3">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary flex-shrink-0" />
          SMARTER: Guía Completa
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
          Una guía detallada sobre el método SMARTER para establecer y alcanzar objetivos efectivos
        </p>
      </div>

      {/* Introducción */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>¿Qué es SMARTER?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            SMARTER es una metodología mejorada para el establecimiento de objetivos que extiende el popular método SMART 
            añadiendo dos elementos cruciales: <strong>Evaluación (Evaluated)</strong> y <strong>Revisión (Reviewed)</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Mientras que SMART te ayuda a <em>definir</em> objetivos claros, SMARTER te ayuda a <em>alcanzarlos</em> 
            mediante un seguimiento continuo y ajustes estratégicos. Es especialmente útil para objetivos a largo plazo 
            donde las circunstancias pueden cambiar.
          </p>
        </CardContent>
      </Card>

      {/* Componentes SMARTER */}
      <div className="space-y-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Los 7 Componentes de SMARTER</h2>
        
        {smarterComponents.map((component, index) => {
          const Icon = component.icon;
          const isOpen = openSections[component.letter] || false;
          
          return (
            <Card key={index} className="overflow-hidden">
              <button
                onClick={() => toggleSection(component.letter)}
                className="w-full"
              >
                <CardHeader className="bg-primary/10 hover:bg-primary/15 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex-shrink-0">
                      {component.letter}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <CardTitle 
                        className="line-clamp-2" 
                        style={{
                          fontSize: 'clamp(0.875rem, 2vw, 1.5rem)',
                          lineHeight: '1.3',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        <Icon className="h-[1.2em] w-[1.2em] inline-block align-middle mr-2 flex-shrink-0" style={{ verticalAlign: 'middle' }} />
                        <span className="break-words inline">{component.name}</span>
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {component.description}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </button>
              {isOpen && (
                <CardContent className="pt-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Preguntas clave */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Preguntas clave para este componente:</h3>
                  <ul className="space-y-2">
                    {component.questions.map((question, qIndex) => (
                      <li key={qIndex} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ejemplos */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Ejemplos:</h3>
                  <div className="space-y-4">
                    {component.examples.map((example, eIndex) => (
                      <div key={eIndex} className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="font-semibold text-destructive mb-2">❌ Incorrecto:</p>
                          <p className="text-sm text-muted-foreground">{example.bad}</p>
                        </div>
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="font-semibold text-primary mb-2">✅ Correcto:</p>
                          <p className="text-sm text-muted-foreground">{example.good}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Consejos prácticos:</h3>
                  <ul className="space-y-2">
                    {component.tips.map((tip, tIndex) => (
                      <li key={tIndex} className="flex items-start gap-2">
                        <span className="text-primary mt-1">💡</span>
                        <span className="text-muted-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Proceso completo */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-2xl">Proceso Completo SMARTER</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Define tu objetivo SMARTER</h4>
                <p className="text-sm text-muted-foreground">
                  Asegúrate de que cumple con los 5 primeros criterios: Específico, Medible, Alcanzable, Relevante y con límite de tiempo.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Establece un plan de acción</h4>
                <p className="text-sm text-muted-foreground">
                  Divide tu objetivo en pasos más pequeños y asigna fechas a cada hito.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Programa evaluaciones regulares</h4>
                <p className="text-sm text-muted-foreground">
                  Decide con qué frecuencia evaluarás tu progreso (diario, semanal, mensual) y qué métricas usarás.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Realiza las evaluaciones</h4>
                <p className="text-sm text-muted-foreground">
                  Mide tu progreso según lo planificado, registra los datos y analiza las tendencias.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h4 className="font-semibold">Revisa y ajusta</h4>
                <p className="text-sm text-muted-foreground">
                  Periódicamente (mensual o trimestralmente), revisa el objetivo completo, ajusta estrategias, plazos o incluso replantea el objetivo si es necesario.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                6
              </div>
              <div>
                <h4 className="font-semibold">Repite el ciclo</h4>
                <p className="text-sm text-muted-foreground">
                  Continúa evaluando y revisando hasta alcanzar tu objetivo o hasta que decidas que ya no es relevante.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Beneficios del Método SMARTER</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Mayor claridad:</strong> Sabes exactamente qué quieres lograr y cómo medirlo.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Mejor seguimiento:</strong> Las evaluaciones regulares te mantienen consciente de tu progreso.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Adaptabilidad:</strong> Las revisiones te permiten ajustar el curso cuando es necesario.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Mayor tasa de éxito:</strong> Los objetivos bien definidos y monitoreados tienen más probabilidades de lograrse.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <strong>Aprendizaje continuo:</strong> Cada evaluación y revisión te enseña algo sobre ti mismo y tus procesos.
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Enlaces */}
      <div className="flex gap-4">
        <a
          href="/faq"
          className="text-primary hover:underline font-medium"
        >
          ← Ver FAQ básico
        </a>
      </div>
    </div>
  );
}

