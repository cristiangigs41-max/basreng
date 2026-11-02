// Vercel Serverless Function: POST /ai-chat (lewat rewrite di vercel.json)
import { handleChat } from '../server/chat.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { status, json } = await handleChat(body, process.env)
  res.status(status).json(json)
}
