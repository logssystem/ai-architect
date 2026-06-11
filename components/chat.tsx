'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ArrowUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageContent } from '@/components/message-content'
import { StepProgress } from '@/components/step-progress'
import { detectStep, STEP_LABELS } from '@/lib/system-prompt'
import { cn } from '@/lib/utils'

function getText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ''
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

const SUGGESTIONS = [
  'Quero um sistema de chamados (helpdesk) para minha equipe de suporte.',
  'Preciso integrar meu CRM com a API do WhatsApp Business.',
  'Quero automatizar o atendimento do meu call center com URA e filas.',
  'Preciso de um e-commerce B2B com catálogo e pedidos.',
]

export function Chat({
  projectId,
  initialMessages,
  initialStep,
}: {
  projectId: number
  initialMessages: UIMessage[]
  initialStep: number
}) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, projectId },
      }),
    }),
    onFinish: () => {
      // Atualiza dados do servidor (título/etapa da sessão na sidebar).
      router.refresh()
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Etapa atual: deriva da última mensagem do assistente, com fallback no valor
  // persistido.
  const currentStep = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        const step = detectStep(getText(messages[i]))
        if (step) return step
      }
    }
    return initialStep
  }, [messages, initialStep])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  const submit = (text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Coluna principal de conversa */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {isEmpty ? (
              <div className="flex flex-col items-center gap-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="font-mono text-lg font-bold">AI</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-balance">
                    Descreva sua necessidade de negócio
                  </h2>
                  <p className="max-w-md text-sm text-muted-foreground text-pretty">
                    Vou conduzir uma sessão estruturada em 10 etapas — do
                    levantamento de requisitos até a entrega de código,
                    arquitetura e deploy.
                  </p>
                </div>
                <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-lg border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((message) => (
                  <Message key={message.id} message={message} />
                ))}
                {status === 'submitted' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Analisando...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Caixa de entrada */}
        <div className="border-t border-border bg-background/80 backdrop-blur">
          <div className="mx-auto w-full max-w-3xl px-4 py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit(input)
              }}
              className="relative flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-primary/50"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit(input)
                  }
                }}
                placeholder="Descreva o que você precisa, ou responda às perguntas..."
                rows={1}
                className="max-h-40 min-h-[40px] resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="size-9 shrink-0"
                aria-label="Enviar mensagem"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </form>
            <p className="mt-1.5 px-1 text-center text-[11px] text-muted-foreground">
              Etapa atual: {currentStep} — {STEP_LABELS[currentStep - 1]}
            </p>
          </div>
        </div>
      </div>

      {/* Painel de progresso das etapas */}
      <aside className="hidden w-64 shrink-0 border-l border-border bg-sidebar p-4 lg:block">
        <h3 className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Etapas da sessão
        </h3>
        <StepProgress currentStep={currentStep} />
      </aside>
    </div>
  )
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const text = getText(message)

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary/15 text-primary',
        )}
        aria-hidden
      >
        {isUser ? 'EU' : 'AI'}
      </div>
      <div
        className={cn(
          'min-w-0 max-w-[85%] rounded-xl px-4 py-2.5',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-card border border-border',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        ) : (
          <MessageContent content={text} />
        )}
      </div>
    </div>
  )
}
