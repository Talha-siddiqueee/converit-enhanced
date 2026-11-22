import { createFileRoute } from '@tanstack/react-router'
import { proxyTextStream, readPromptRequest } from '../server/aiRequest'

export const Route = createFileRoute('/api/ai-nvidia')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readPromptRequest(request)
        if ('response' in body) return body.response

        // Provider credentials must only exist in the server environment.
        // Never use a VITE_ variable for a secret because Vite exposes it to the browser.
        const apiKey = process.env.NVIDIA_API_KEY
        if (!apiKey) {
          return Response.json({ error: 'AI service is not configured on the server.' }, { status: 503 })
        }

        try {
          const providerResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            signal: request.signal,
            body: JSON.stringify({
              model: 'nvidia/nemotron-3.5-bolt-e4b',
              messages: [{ role: 'user', content: body.prompt }],
              temperature: 0.7,
              max_tokens: 2048,
              stream: true,
            }),
          })

          if (!providerResponse.ok) {
            console.error('NVIDIA AI provider returned status:', providerResponse.status)
            return Response.json({ error: 'The AI provider could not complete this request. Please try again.' }, { status: 502 })
          }

          return proxyTextStream(providerResponse, (payload) => {
            if (!payload || typeof payload !== 'object') return null
            const choices = (payload as { choices?: Array<{ delta?: { content?: unknown } }> }).choices
            const content = choices?.[0]?.delta?.content
            return typeof content === 'string' ? content : null
          })
        } catch (error) {
          if (request.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          console.error('NVIDIA AI request failed:', error instanceof Error ? error.message : 'Unknown error')
          return Response.json({ error: 'Unable to reach the AI provider. Please try again.' }, { status: 502 })
        }
      },
    },
  },
})
