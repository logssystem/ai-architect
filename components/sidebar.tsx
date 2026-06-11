'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { CheckCircle, LogOut, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { createProject, deleteProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Project = {
  id: number
  title: string
  currentStep: number
  status: string
}

export function Sidebar({
  projects,
  userName,
}: {
  projects: Project[]
  userName: string
}) {
  const router = useRouter()
  const params = useParams()
  const activeId = params?.projectId ? Number(params.projectId) : null
  const [isPending, startTransition] = useTransition()

  const handleNew = () => {
    startTransition(async () => {
      const project = await createProject()
      router.push(`/dashboard/${project.id}`)
    })
  }

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteProject(id)
      if (activeId === id) router.push('/dashboard')
    })
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
      router.push('/sign-in')
    })
  }

  return (
    <aside className="flex h-full flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground">
          AI
        </div>
        <span className="text-sm font-semibold tracking-tight">Solutions Architect</span>
      </div>

      {/* New session */}
      <div className="p-3">
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={handleNew}
          disabled={isPending}
        >
          <Plus className="size-3.5" />
          Nova sessão
        </Button>
      </div>

      {/* Project list */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Nenhuma sessão ainda
          </p>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className={cn(
                'group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                p.id === activeId
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Link
                href={`/dashboard/${p.id}`}
                className="flex min-w-0 flex-1 items-center gap-2"
              >
                {p.status === 'completed' ? (
                  <CheckCircle className="size-3.5 shrink-0 text-primary" />
                ) : (
                  <MessageSquare className="size-3.5 shrink-0" />
                )}
                <span className="truncate text-xs">{p.title}</span>
              </Link>
              {p.status !== 'completed' && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {p.currentStep}/10
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={isPending}
                className="invisible size-5 shrink-0 text-muted-foreground transition-colors hover:text-destructive group-hover:visible"
                aria-label="Excluir sessão"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium uppercase">
            {userName.charAt(0)}
          </div>
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {userName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isPending}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Sair"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
