const MAX_REQUEST_BYTES = 64 * 1024
export const MAX_AI_PROMPT_CHARS = 12_000

export type PromptRequestResult =
  | { prompt: string }
  | { response: Response }

/** Read a small JSON prompt body without accepting an unbounded request payload. */
export async function readPromptRequest(request: Request): Promise<PromptRequestResult> {
  if (request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return { response: Response.json({ error: 'Content-Type must be application/json.' }, { status: 415 }) }
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return { response: Response.json({ error: 'Request is too large.' }, { status: 413 }) }
  }

  if (!request.body) {
    return { response: Response.json({ error: 'A JSON request body is required.' }, { status: 400 }) }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      totalBytes += value.byteLength

      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined)
        return { response: Response.json({ error: 'Request is too large.' }, { status: 413 }) }
      }

      chunks.push(value)
    }
  } catch {
    return { response: Response.json({ error: 'Could not read the request body.' }, { status: 400 }) }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  let payload: unknown
  try {
    payload = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return { response: Response.json({ error: 'Request body must contain valid JSON.' }, { status: 400 }) }
  }

  if (!payload || typeof payload !== 'object' || !('prompt' in payload)) {
    return { response: Response.json({ error: 'A prompt is required.' }, { status: 400 }) }
  }

  const prompt = (payload as { prompt?: unknown }).prompt
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return { response: Response.json({ error: 'Prompt must be a non-empty string.' }, { status: 400 }) }
  }

  if (prompt.length > MAX_AI_PROMPT_CHARS) {
    return {
      response: Response.json(
        { error: `Prompt must be ${MAX_AI_PROMPT_CHARS.toLocaleString()} characters or fewer.` },
        { status: 413 },
      ),
    }
  }

  return { prompt: prompt.trim() }
}

/** Convert a provider's SSE stream into a small, provider-neutral text stream. */
export function proxyTextStream(
  upstream: Response,
  extractText: (payload: unknown) => string | null,
): Response {
  if (!upstream.body) {
    return Response.json({ error: 'The AI provider returned an empty response.' }, { status: 502 })
  }

  const reader = upstream.body.getReader()
  const encoder = new TextEncoder()
  let cancelled = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const decoder = new TextDecoder()
      let buffer = ''

      const processLine = (line: string) => {
        const normalized = line.trim()
        if (!normalized.startsWith('data:')) return

        const data = normalized.slice(5).trim()
        if (!data || data === '[DONE]') return

        try {
          const text = extractText(JSON.parse(data))
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        } catch {
          // Ignore provider keep-alive events and malformed partial messages.
        }
      }

      try {
        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          let lineBreak = buffer.indexOf('\n')
          while (lineBreak !== -1) {
            processLine(buffer.slice(0, lineBreak).replace(/\r$/, ''))
            buffer = buffer.slice(lineBreak + 1)
            lineBreak = buffer.indexOf('\n')
          }
        }

        buffer += decoder.decode()
        if (buffer.trim()) processLine(buffer)

        if (!cancelled) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } catch (error) {
        if (!cancelled) controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
    async cancel(reason) {
      cancelled = true
      await reader.cancel(reason).catch(() => undefined)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
