// Server kecil untuk produksi (setelah `npm run build`): menyajikan folder dist + endpoint /ai-chat.
//   node --env-file=.env server/chat-server.js     (default port 3000)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chatMiddleware } from './chat.js'

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json' }
const chat = chatMiddleware(process.env)
http.createServer((req, res) => chat(req, res, () => {
  let f = path.join(dist, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(dist)) { res.statusCode = 403; return res.end() }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dist, 'index.html')
  res.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream')
  fs.createReadStream(f).pipe(res)
})).listen(process.env.PORT || 3000, () => console.log('Basreng Ibu A3 berjalan di http://localhost:' + (process.env.PORT || 3000)))
