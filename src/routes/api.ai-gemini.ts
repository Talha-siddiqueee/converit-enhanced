import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/ai-gemini')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt } = await request.json() as { prompt: string }

          if (!prompt || typeof prompt !== 'string') {
            return Response.json({ error: 'Missing or invalid prompt' }, { status: 400 })
          }

          const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY
          if (!apiKey) {
            return Response.json({ error: 'Gemini API key not configured' }, { status: 500 })
          }

          // Call Gemini API with streaming
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 2048,
                },
              }),
            }
          )

          if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            console.error('Gemini API error:', errText)
            return Response.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: geminiRes.status })
          }

          // Stream back to the client as SSE
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            async start(controller) {
              const reader = geminiRes.body!.getReader()
              const decoder = new TextDecoder()

              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  const chunk = decoder.decode(value, { stream: true })
                  // Parse each SSE data line from Gemini
                  for (const line of chunk.split('\n')) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6).trim()
                      if (data === '[DONE]' || !data) continue
                      try {
                        const parsed = JSON.parse(data)
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                        if (text) {
                          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                        }
                      } catch {
                        // skip malformed JSON lines
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
          console.error('AI route error:', err)
          return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
        }
      },
    },
  },
})
