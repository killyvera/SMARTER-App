import { z } from 'zod';

export const agentChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(16000),
});

export const agentTurnBodySchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('chat'),
    messages: z.array(agentChatMessageSchema).max(40),
    sessionId: z.string().max(128).optional(),
    coachMode: z.boolean().optional(),
    coachStrict: z.boolean().optional(),
  }),
  z.object({
    mode: z.literal('execute_tools'),
    executions: z
      .array(
        z.object({
          approvalToken: z.string().min(20).max(12000),
        })
      )
      .min(1)
      .max(5),
    coachStrict: z.boolean().optional(),
  }),
]);

export type AgentTurnBody = z.infer<typeof agentTurnBodySchema>;
