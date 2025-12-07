'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { HelpCircle, Target, TrendingUp, CheckCircle2, Eye, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FAQPage() {
  const smarterSections = [
    {
      letter: 'S',
      name: 'Specific (Específico)',
      icon: Target,
      description: 'Tu objetivo debe ser claro, preciso y bien definido. Evita ambigüedades.',
      faqs: [
        {
          question: '¿Qué significa que un objetivo sea Específico?',
          answer: `Un objetivo **específico** es claro, preciso y bien definido. Evita ambigüedades y deja poco espacio para interpretaciones.

**Características de un objetivo específico:**
- Define exactamente qué quieres lograr
- Incluye detalles relevantes (qué, quién, dónde, por qué)
- Usa lenguaje claro y directo
- Evita palabras vagas como "mejor", "más", "algunos"

**Ejemplo:**
- ❌ Incorrecto: "Quiero estar en mejor forma física"
- ✅ Correcto: "Quiero correr 5 kilómetros en menos de 30 minutos para el 1 de junio de 2025"`,
        },
        {
          question: '¿Cómo hago que mi objetivo sea más específico?',
          answer: `Para hacer tu objetivo más específico, responde estas preguntas:

1. **¿Qué?** - ¿Qué quiero lograr exactamente?
2. **¿Por qué?** - ¿Por qué es importante este objetivo?
3. **¿Quién?** - ¿Quién está involucrado?
4. **¿Dónde?** - ¿Dónde se llevará a cabo?
5. **¿Cuándo?** - ¿Cuándo quiero lograrlo?
6. **¿Cómo?** - ¿Cómo lo voy a lograr?

Cuanto más detalles incluyas, más específico será tu objetivo.`,
        },
      ],
    },
    {
      letter: 'M',
      name: 'Measurable (Medible)',
      icon: TrendingUp,
      description: 'Debes poder medir tu progreso y determinar cuándo has alcanzado el objetivo.',
      faqs: [
        {
          question: '¿Por qué es importante que un objetivo sea medible?',
          answer: `Un objetivo **medible** te permite:

- **Saber cuándo lo has logrado**: Tienes un criterio claro de éxito
- **Rastrear tu progreso**: Puedes ver qué tan cerca estás de alcanzarlo
- **Mantenerte motivado**: Ver el progreso te ayuda a seguir adelante
- **Ajustar tu estrategia**: Si no estás avanzando, puedes cambiar el enfoque

Sin medición, no sabes si estás progresando o si ya alcanzaste tu objetivo.`,
        },
        {
          question: '¿Qué tipos de métricas puedo usar?',
          answer: `Dependiendo de tu objetivo, puedes usar diferentes tipos de métricas:

**Métricas cuantitativas:**
- Números (peso, dinero, cantidad de libros, etc.)
- Porcentajes (completado, mejorado, etc.)
- Tiempo (horas, días, semanas)
- Distancia, velocidad, tamaño

**Métricas cualitativas:**
- Niveles de satisfacción (escala del 1 al 10)
- Certificaciones o niveles alcanzados
- Feedback de otros
- Auto-evaluación estructurada

Lo importante es que puedas comparar tu estado actual con tu estado objetivo.`,
        },
      ],
    },
    {
      letter: 'A',
      name: 'Achievable (Alcanzable)',
      icon: CheckCircle2,
      description: 'El objetivo debe ser realista y alcanzable con los recursos y tiempo disponibles.',
      faqs: [
        {
          question: '¿Cómo sé si mi objetivo es alcanzable?',
          answer: `Un objetivo es **alcanzable** cuando:

- **Tienes los recursos necesarios**: Tiempo, dinero, habilidades, herramientas
- **Es realista para tu situación actual**: Considera tus limitaciones
- **Has logrado objetivos similares antes**: O al menos algo relacionado
- **Los obstáculos son superables**: No son imposibles de vencer

**Pregúntate:**
- ¿Tengo lo que necesito para lograrlo?
- ¿He hecho algo similar antes?
- ¿Qué obstáculos puedo enfrentar y cómo los superaré?
- ¿Es demasiado ambicioso o demasiado fácil?`,
        },
        {
          question: '¿Puede un objetivo ser desafiante y alcanzable a la vez?',
          answer: `¡Absolutamente! De hecho, los mejores objetivos son **desafiantes pero alcanzables**.

**Objetivos demasiado fáciles:**
- No te motivan
- No te ayudan a crecer
- Pueden hacerte sentir que no estás progresando

**Objetivos demasiado difíciles:**
- Te desmotivan cuando no los logras
- Pueden hacerte sentir fracasado
- Pueden hacerte abandonar

**Objetivos desafiantes pero alcanzables:**
- Te motivan a esforzarte
- Te ayudan a crecer y aprender
- Te dan una sensación de logro cuando los alcanzas
- Están en tu "zona de crecimiento"`,
        },
      ],
    },
    {
      letter: 'R',
      name: 'Relevant (Relevante)',
      icon: Eye,
      description: 'El objetivo debe ser importante para ti y alineado con tus valores y objetivos a largo plazo.',
      faqs: [
        {
          question: '¿Qué hace que un objetivo sea relevante?',
          answer: `Un objetivo es **relevante** cuando:

- **Es importante para ti personalmente**: No solo porque otros lo esperan
- **Se alinea con tus valores**: Refleja lo que realmente valoras
- **Contribuye a tus objetivos a largo plazo**: Te acerca a tu visión de futuro
- **Es el momento adecuado**: No compite con otras prioridades urgentes

**Pregúntate:**
- ¿Por qué quiero esto realmente?
- ¿Cómo se conecta con mis valores y creencias?
- ¿Me acerca a donde quiero estar en 5 años?
- ¿Es el momento adecuado para perseguir esto?`,
        },
        {
          question: '¿Qué pasa si un objetivo no es relevante para mí?',
          answer: `Si un objetivo no es relevante, probablemente:

- **No te motivará lo suficiente**: Te costará mantener el esfuerzo
- **Lo abandonarás**: Cuando las cosas se pongan difíciles
- **No te dará satisfacción**: Incluso si lo logras
- **Desperdiciará tu tiempo**: Tiempo que podrías usar en algo más importante

**Solución:**
- Replantea el objetivo para conectarlo con tus valores
- O considera si realmente necesitas perseguirlo
- A veces es mejor abandonar objetivos que no son relevantes para ti`,
        },
      ],
    },
    {
      letter: 'T',
      name: 'Time-bound (Con límite de tiempo)',
      icon: Clock,
      description: 'Debe tener una fecha límite clara para crear urgencia y permitir la planificación.',
      faqs: [
        {
          question: '¿Por qué es importante tener una fecha límite?',
          answer: `Una **fecha límite** es crucial porque:

- **Crea urgencia**: Te motiva a actuar ahora, no "algún día"
- **Permite planificación**: Puedes dividir el tiempo en pasos manejables
- **Evita procrastinación**: Sin fecha límite, es fácil posponer indefinidamente
- **Facilita la evaluación**: Sabes cuándo revisar tu progreso

**Sin fecha límite:**
- "Algún día" nunca llega
- Es fácil posponer el trabajo
- No hay presión para completar

**Con fecha límite:**
- Tienes un objetivo claro en el tiempo
- Puedes planificar pasos intermedios
- Sabes cuándo evaluar y ajustar`,
        },
        {
          question: '¿Cómo establezco una fecha límite realista?',
          answer: `Para establecer una fecha límite realista:

1. **Estima el tiempo necesario**: Considera todos los pasos y posibles obstáculos
2. **Añade un buffer**: Agrega 20-30% de tiempo extra para imprevistos
3. **Considera tus otros compromisos**: No sobrecargues tu agenda
4. **Revisa objetivos similares**: ¿Cuánto tiempo tomó algo parecido?
5. **Divide en hitos**: Establece fechas intermedias para pasos importantes

**Ejemplo:**
- Objetivo: Escribir un libro de 80,000 palabras
- Tiempo estimado: 6 meses escribiendo 1,000 palabras por semana
- Buffer: +1 mes = 7 meses total
- Fecha límite: 30 de septiembre de 2025`,
        },
      ],
    },
    {
      letter: 'E',
      name: 'Evaluated (Evaluado)',
      icon: TrendingUp,
      description: 'Evalúa regularmente tu progreso para medir qué tan bien estás avanzando hacia tu objetivo.',
      faqs: [
        {
          question: '¿Qué significa evaluar un objetivo?',
          answer: `**Evaluar** significa medir y analizar tu progreso regularmente.

**La evaluación te permite:**
- Ver qué tan bien estás avanzando
- Identificar si estás en el camino correcto
- Detectar problemas temprano
- Celebrar pequeños logros
- Ajustar tu estrategia si es necesario

**Preguntas clave para evaluar:**
- ¿Estoy avanzando al ritmo esperado?
- ¿Qué tan cerca estoy de mi objetivo?
- ¿Qué está funcionando bien?
- ¿Qué necesito mejorar?
- ¿Necesito ajustar mi plan?`,
        },
        {
          question: '¿Con qué frecuencia debo evaluar mi progreso?',
          answer: `La frecuencia de evaluación depende del tipo de objetivo:

**Objetivos a corto plazo (semanales):**
- Evalúa **diariamente** o cada 2-3 días
- Ejemplo: Meta de ejercicio semanal → evalúa cada día

**Objetivos a mediano plazo (mensuales):**
- Evalúa **semanalmente**
- Ejemplo: Meta de ahorro mensual → evalúa cada semana

**Objetivos a largo plazo (anuales):**
- Evalúa **mensualmente** o **trimestralmente**
- Ejemplo: Meta de carrera anual → evalúa cada mes

**Regla general:** Evalúa con suficiente frecuencia para detectar problemas temprano, pero no tan seguido que te abrume.`,
        },
      ],
    },
    {
      letter: 'R',
      name: 'Reviewed (Revisado)',
      icon: RefreshCw,
      description: 'Revisa periódicamente tu objetivo completo para ajustar estrategias, plazos o incluso el objetivo mismo.',
      faqs: [
        {
          question: '¿Cuál es la diferencia entre Evaluar y Revisar?',
          answer: `**Evaluar** y **Revisar** son procesos complementarios pero diferentes:

**Evaluar (Evaluated):**
- Se enfoca en el **progreso actual**
- Pregunta: ¿Estoy avanzando? ¿A qué velocidad?
- Es más frecuente (diario, semanal)
- Mide métricas específicas
- Compara dónde estás vs. dónde deberías estar

**Revisar (Reviewed):**
- Se enfoca en el **plan completo**
- Pregunta: ¿Sigue siendo relevante? ¿Funciona la estrategia?
- Es menos frecuente (mensual, trimestral)
- Analiza el objetivo en su totalidad
- Decide si necesitas ajustar o replantear

**En resumen:** Evaluar es "¿cómo voy?" y Revisar es "¿sigue siendo el objetivo correcto?"`,
        },
        {
          question: '¿Cuándo debo replantear un objetivo?',
          answer: `Debes **replantear** un objetivo cuando:

1. **Ya no es relevante**: Tus prioridades o valores cambiaron
2. **Las circunstancias cambiaron**: Situación personal, profesional o del mercado
3. **La estrategia no funciona**: Has intentado varias veces sin éxito
4. **Los recursos no están disponibles**: No tienes tiempo, dinero o habilidades necesarias
5. **Encontraste algo mejor**: Descubriste un objetivo más importante o valioso

**No tengas miedo de replantear:**
- No es un fracaso, es adaptabilidad
- Es mejor ajustar que persistir en algo que no funciona
- La flexibilidad es una fortaleza, no una debilidad

**Proceso de replanteamiento:**
1. Analiza por qué el objetivo original no funciona
2. Identifica qué partes siguen siendo valiosas
3. Ajusta o crea un nuevo objetivo basado en lo aprendido
4. Establece un nuevo plan SMARTER`,
        },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (letter: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [letter]: !prev[letter],
    }));
  };

  return (
    <div className="w-full max-w-full py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">SMARTER FAQ</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Preguntas frecuentes sobre el método SMARTER organizadas por componente
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {smarterSections.map((section) => {
          const Icon = section.icon;
          const isOpen = openSections[section.letter] || false;

          return (
            <Card key={section.letter} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.letter)}
                className="w-full"
              >
                <CardHeader className="bg-primary/10 hover:bg-primary/15 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex-shrink-0">
                      {section.letter}
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
                        <span className="break-words inline">{section.name}</span>
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {section.description}
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
                <CardContent className="pt-6 animate-in slide-in-from-top-2 duration-200">
                  <Accordion>
                    {section.faqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        question={faq.question}
                        answer={faq.answer}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>¿Quieres saber más?</CardTitle>
          <CardDescription>
            Explora nuestra guía detallada sobre el método SMARTER
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/smarter"
            className="text-primary hover:underline font-medium inline-flex items-center gap-2"
          >
            Ver guía completa SMARTER
            <span>→</span>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
