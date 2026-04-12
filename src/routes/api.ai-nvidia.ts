import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai-nvidia')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt, model } = await request.json() as { prompt: string; model?: string }

          if (!prompt || typeof prompt !== 'string') {
            return Response.json({ error: 'Missing or invalid prompt' }, { status: 400 })
          }

          const apiKey = process.env.NVIDIA_API_KEY
          if (!apiKey) {
            return Response.json({ error: 'NVIDIA API key not configured' }, { status: 500 })
          }

          const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model || 'meta/llama-3.1-8b-instruct',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 2048,
              stream: true,
            }),
          })

          if (!nvidiaRes.ok) {
            const errText = await nvidiaRes.text()
            console.error('NVIDIA API error:', errText)
            return Response.json({ error: `NVIDIA API error: ${nvidiaRes.status}` }, { status: nvidiaRes.status })
          }

          // Stream back to client as SSE
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            async start(controller) {
              const reader = nvidiaRes.body!.getReader()
              const decoder = new TextDecoder()

              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  const chunk = decoder.decode(value, { stream: true })
                  for (const line of chunk.split('\n')) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6).trim()
                      if (!data || data === '[DONE]') {
                        continue
                      }
                      try {
                        const parsed = JSON.parse(data)
                        const text = parsed?.choices?.[0]?.delta?.content
                        if (text) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                        }
                      } catch {
                        // skip malformed lines
                      }
                    }
                  }
                }
              } finally {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              }
            },
          })

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } catch (err: any) {
          console.error('NVIDIA AI route error:', err)
          return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
