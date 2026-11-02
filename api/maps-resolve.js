// Vercel Serverless Function: POST /maps-resolve
import { resolveMap } from '../server/chat.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { status, json } = await resolveMap(body.url)
  res.status(status).json(json)
}
