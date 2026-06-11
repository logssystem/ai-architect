'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { ArrowUp, Download, ImagePlus, Loader2, X } from 'lucide-react'
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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, projectId },
      }),
    }),
    onFinish: () => {
      router.refresh()
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

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

  const handleImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setImageBase64(result)
    }
    reader.readAsDataURL(file)
  }

  const submit = (text: string) => {
    if ((!text.trim() && !imageBase64) || isLoading) return

    if (imageBase64) {
      // Envia com imagem
      const imageText = text.trim()
        ? text
        : 'Analise esta imagem e me ajude a criar um sistema baseado nela.'
      sendMessage({
        text: imageText,
        files: [{ type: 'image', data: imageBase64 }],
      } as Parameters<typeof sendMessage>[0])
      setImagePreview(null)
      setImageBase64(null)
    } else {
      sendMessage({ text })
    }
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
            {/* Preview da imagem */}
            {imagePreview && (
              <div className="mb-2 flex items-start gap-2">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setImageBase64(null) }}
                    className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground pt-1">
                  Imagem anexada — descreva o que quer ou envie direto
                </span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit(input)
              }}
              className="relative flex items-end gap-2 rounded-xl border border-border bg-card p-2 focus-within:border-primary/50"
            >
              {/* Botão de imagem */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImage(file)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
                className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                aria-label="Anexar imagem"
              >
                <ImagePlus className="size-4" />
              </button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submit(input)
                  }
                }}
                onPaste={(e) => {
                  const file = e.clipboardData.files[0]
                  if (file?.type.startsWith('image/')) {
                    e.preventDefault()
                    handleImage(file)
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
                disabled={isLoading || (!input.trim() && !imageBase64)}
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

        {messages.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <a
              href={`/api/export?projectId=${projectId}`}
              download
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Download className="size-3.5" />
              Exportar arquivos (.zip)
            </a>
          </div>
        )}
      </aside>
    </div>
  )
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  const text = getText(message)

  // Verifica se há imagem na mensagem
  const imagePart = message.parts?.find(
    (p): p is { type: 'file'; mediaType: string; url: string } =>
      p.type === 'file' && typeof (p as { mediaType?: string }).mediaType === 'string' &&
      (p as { mediaType: string }).mediaType.startsWith('image/'),
  )

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
        {imagePart && (
          <img
            src={imagePart.url}
            alt="imagem enviada"
            className="mb-2 max-h-48 rounded-lg object-contain"
          />
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        ) : (
          <MessageContent content={text} />
        )}
      </div>
    </div>
  )
}
