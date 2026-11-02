import { localApi } from './localApi'

// Alamat backend Laravel. Kosongkan VITE_API_URL untuk memakai penyimpanan lokal di browser.
export const API = import.meta.env.VITE_API_URL || ''
export const FILES = API.replace(/\/api\/?$/, '') + '/storage/'
export const mediaUrl = (img) => (img.startsWith('/media/') ? import.meta.env.BASE_URL + img.slice(1) : /^(data:|https?:|\/)/.test(img) ? img : FILES + img)

const KEY = 'a3_token'
export const getToken = () => { try { return localStorage.getItem(KEY) } catch { return null } }
export const setToken = (t) => { try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY) } catch { /* abaikan */ } }

let demo = !API
const goLocal = () => { if (!demo) { demo = true; setToken(null) } }

export async function api(path, opts = {}) {
  if (demo) return localApi(path, opts)
  let { method = 'GET', body } = opts
  if (body && !(body instanceof FormData) && Object.values(body).some((v) => v instanceof File)) { // ada unggahan file
    const fd = new FormData(); Object.entries(body).forEach(([k, v]) => v != null && fd.append(k, v)); body = fd
  }
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token && !token.startsWith('local:')) headers.Authorization = 'Bearer ' + token
  const isForm = body instanceof FormData
  if (body && !isForm) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(API + path, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined })
  } catch {
    goLocal() // backend tidak aktif -> pakai penyimpanan lokal
    return localApi(path, opts)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const first = data?.errors && Object.values(data.errors)[0]?.[0]
    throw Object.assign(new Error(first || data?.message || 'Terjadi kesalahan (' + res.status + ')'), { status: res.status })
  }
  return data
}
