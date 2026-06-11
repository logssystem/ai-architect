import { notFound } from 'next/navigation'
import type { UIMessage } from 'ai'
import { getProject, getMessages } from '@/app/actions/projects'
import { Chat } from '@/components/chat'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const project = await getProject(Number(projectId))
  return { title: project ? `${project.title} — AI Solutions Architect` : 'Sessão' }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const id = Number(projectId)
  if (isNaN(id)) notFound()

  const [project, dbMessages] = await Promise.all([getProject(id), getMessages(id)])
  if (!project) notFound()

  const initialMessages: UIMessage[] = dbMessages.map((msg) => ({
    id: String(msg.id),
    role: msg.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: msg.content }],
  }))

  return (
    <Chat
      projectId={project.id}
      initialMessages={initialMessages}
      initialStep={project.currentStep}
    />
  )
}
