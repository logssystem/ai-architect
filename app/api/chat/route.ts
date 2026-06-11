import { createAnthropic } from '@ai-sdk/anthropic'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, messages as messagesTable } from '@/lib/db/schema'
import { SYSTEM_PROMPT, detectStep } from '@/lib/system-prompt'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 60

function getText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  const userId = session.user.id

  const { messages, projectId } = (await req.json()) as {
    messages: UIMessage[]
    projectId: number
  }

  // Verifica que o projeto pertence ao usuário.
  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)
  if (!projectRows[0]) {
    return new Response('Project not found', { status: 404 })
  }

  // Persiste a última mensagem do usuário.
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUser) {
    const content = getText(lastUser)
    if (content) {
      await db
        .insert(messagesTable)
        .values({ userId, projectId, role: 'user', content })

      // Auto-título: usa as primeiras palavras da 1ª mensagem do usuário.
      const isFirstMessage = messages.filter((m) => m.role === 'user').length === 1
      if (isFirstMessage && projectRows[0].title === 'Nova sessão') {
        const title = content.slice(0, 60).replace(/\n/g, ' ').trim()
        await db
          .update(projects)
          .set({ title })
          .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      }
    }
  }

  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // Persiste a resposta do assistente e atualiza a etapa atual da sessão.
      await db
        .insert(messagesTable)
        .values({ userId, projectId, role: 'assistant', content: text })

      const step = detectStep(text)
      await db
        .update(projects)
        .set({
          updatedAt: new Date(),
          ...(step
            ? { currentStep: step, status: step >= 10 ? 'completed' : 'active' }
            : {}),
        })
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    },
  })

  return result.toUIMessageStreamResponse()
}
