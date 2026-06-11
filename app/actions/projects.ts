'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, messages } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getProjects() {
  const userId = await getUserId()
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
}

export async function getProject(id: number) {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function getMessages(projectId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.projectId, projectId), eq(messages.userId, userId)))
    .orderBy(messages.createdAt)
}

export async function createProject(title?: string) {
  const userId = await getUserId()
  const rows = await db
    .insert(projects)
    .values({ userId, title: title?.slice(0, 80) || 'Nova sessão' })
    .returning()
  revalidatePath('/dashboard')
  return rows[0]
}

export async function renameProject(id: number, title: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({ title: title.slice(0, 80), updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath('/dashboard')
}

export async function updateProjectStep(id: number, step: number) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({
      currentStep: step,
      status: step >= 10 ? 'completed' : 'active',
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath('/dashboard')
}

export async function deleteProject(id: number) {
  const userId = await getUserId()
  await db
    .delete(messages)
    .where(and(eq(messages.projectId, id), eq(messages.userId, userId)))
  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath('/dashboard')
}

export async function saveMessage(
  projectId: number,
  role: 'user' | 'assistant',
  content: string,
) {
  const userId = await getUserId()
  await db.insert(messages).values({ userId, projectId, role, content })
  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
}
