import { createFileRoute } from '@tanstack/react-router'
import { proxyTextStream, readPromptRequest } from '../server/aiRequest'

export const Route = createFileRoute('/api/ai-gemini')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await readPromptRequest(request)
        if ('response' in body) return body.response

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
          return Response.json({ error: 'Gemini is not configured on the server.' }, { status: 503 })
        }

        try {
          const providerUrl = new URL('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent')
          providerUrl.searchParams.set('key', apiKey)
          providerUrl.searchParams.set('alt', 'sse')

          const providerResponse = await fetch(providerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: request.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: body.prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
          })

          if (!providerResponse.ok) {
            console.error('Gemini AI provider returned status:', providerResponse.status)
            return Response.json({ error: 'The AI provider could not complete this request. Please try again.' }, { status: 502 })
          }

          return proxyTextStream(providerResponse, (payload) => {
            if (!payload || typeof payload !== 'object') return null
            const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> }).candidates
            const text = candidates?.[0]?.content?.parts?.[0]?.text
            return typeof text === 'string' ? text : null
          })
        } catch (error) {
          if (request.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          console.error('Gemini AI request failed:', error instanceof Error ? error.message : 'Unknown error')
          return Response.json({ error: 'Unable to reach the AI provider. Please try again.' }, { status: 502 })
        }
      },
    },
  },
})
