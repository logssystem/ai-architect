import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { projects, messages } from '@/lib/db/schema'
import { and, eq, asc } from 'drizzle-orm'
import { headers } from 'next/headers'

export const maxDuration = 30

// Extrai blocos de código do markdown: ```lang\ncode\n```
function extractCodeBlocks(content: string): Array<{ lang: string; code: string }> {
  const blocks: Array<{ lang: string; code: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const lang = (match[1] || 'txt').toLowerCase()
    if (lang !== 'mermaid') {
      blocks.push({ lang, code: match[2].trim() })
    }
  }
  return blocks
}

function langToExt(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
    python: 'py', py: 'py', sql: 'sql', html: 'html', css: 'css',
    json: 'json', yaml: 'yml', yml: 'yml', bash: 'sh', sh: 'sh',
    dockerfile: 'Dockerfile', txt: 'txt',
  }
  return map[lang] || lang
}

// Gera um arquivo ZIP simples em base64 (sem dependência externa).
// Usa o formato ZIP sem compressão (stored).
function buildZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder()
  const centralDirectory: Uint8Array[] = []
  const localFiles: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const dataBytes = encoder.encode(file.content)
    const crc = crc32(dataBytes)
    const size = dataBytes.length

    // Local file header
    const local = new Uint8Array(30 + nameBytes.length + size)
    const dv = new DataView(local.buffer)
    dv.setUint32(0, 0x04034b50, true)  // signature
    dv.setUint16(4, 20, true)           // version needed
    dv.setUint16(6, 0, true)            // flags
    dv.setUint16(8, 0, true)            // compression (stored)
    dv.setUint16(10, 0, true)           // mod time
    dv.setUint16(12, 0, true)           // mod date
    dv.setUint32(14, crc, true)         // crc32
    dv.setUint32(18, size, true)        // compressed size
    dv.setUint32(22, size, true)        // uncompressed size
    dv.setUint16(26, nameBytes.length, true)
    dv.setUint16(28, 0, true)           // extra field length
    local.set(nameBytes, 30)
    local.set(dataBytes, 30 + nameBytes.length)
    localFiles.push(local)

    // Central directory entry
    const central = new Uint8Array(46 + nameBytes.length)
    const cdv = new DataView(central.buffer)
    cdv.setUint32(0, 0x02014b50, true)
    cdv.setUint16(4, 20, true)
    cdv.setUint16(6, 20, true)
    cdv.setUint16(8, 0, true)
    cdv.setUint16(10, 0, true)
    cdv.setUint16(12, 0, true)
    cdv.setUint16(14, 0, true)
    cdv.setUint32(16, crc, true)
    cdv.setUint32(20, size, true)
    cdv.setUint32(24, size, true)
    cdv.setUint16(28, nameBytes.length, true)
    cdv.setUint16(30, 0, true)
    cdv.setUint16(32, 0, true)
    cdv.setUint16(34, 0, true)
    cdv.setUint16(36, 0, true)
    cdv.setUint32(38, 0, true)
    cdv.setUint32(42, offset, true)
    central.set(nameBytes, 46)
    centralDirectory.push(central)

    offset += local.length
  }

  const cdSize = centralDirectory.reduce((s, b) => s + b.length, 0)
  const eocd = new Uint8Array(22)
  const edv = new DataView(eocd.buffer)
  edv.setUint32(0, 0x06054b50, true)
  edv.setUint16(4, 0, true)
  edv.setUint16(6, 0, true)
  edv.setUint16(8, files.length, true)
  edv.setUint16(10, files.length, true)
  edv.setUint32(12, cdSize, true)
  edv.setUint32(16, offset, true)
  edv.setUint16(20, 0, true)

  const total = offset + cdSize + eocd.length
  const zip = new Uint8Array(total)
  let pos = 0
  for (const b of localFiles) { zip.set(b, pos); pos += b.length }
  for (const b of centralDirectory) { zip.set(b, pos); pos += b.length }
  zip.set(eocd, pos)
  return zip
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const url = new URL(req.url)
  const projectId = Number(url.searchParams.get('projectId'))
  if (!projectId) return new Response('Missing projectId', { status: 400 })

  const projectRows = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1)
  if (!projectRows[0]) return new Response('Not found', { status: 404 })

  const msgs = await db
    .select()
    .from(messages)
    .where(and(eq(messages.projectId, projectId), eq(messages.userId, session.user.id)))
    .orderBy(asc(messages.createdAt))

  const assistantContent = msgs
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n\n')

  // Extrai todos os blocos de código gerados
  const blocks = extractCodeBlocks(assistantContent)

  const files: Array<{ name: string; content: string }> = []

  // Conta por extensão para nomear arquivos únicos
  const extCount: Record<string, number> = {}
  for (const block of blocks) {
    const ext = langToExt(block.lang)
    extCount[ext] = (extCount[ext] || 0) + 1
    const idx = extCount[ext]
    const name = ext === 'Dockerfile' ? 'Dockerfile' : `arquivo_${idx}.${ext}`
    files.push({ name, content: block.code })
  }

  // Adiciona o histórico completo como markdown
  const history = msgs
    .map((m) => `## ${m.role === 'user' ? 'Usuário' : 'AI'}\n\n${m.content}`)
    .join('\n\n---\n\n')
  files.push({ name: 'historico.md', content: history })

  if (files.length === 0) {
    return new Response('Nenhum arquivo gerado ainda', { status: 400 })
  }

  const zip = buildZip(files)
  const projectName = projectRows[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  return new Response(zip, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${projectName}.zip"`,
    },
  })
}
