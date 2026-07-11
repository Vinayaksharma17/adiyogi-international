import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
})

let clerkToken = null
let clerkGetToken = null
const listeners = new Set()

export const setClerkToken = (token) => {
  clerkToken = token
  listeners.forEach((fn) => fn(token))
}

export const getClerkToken = () => clerkToken

export const setClerkGetToken = (fn) => {
  clerkGetToken = fn
}

export const onTokenChange = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

async function refreshAndGetToken() {
  if (!clerkGetToken) return null
  try {
    const token = await clerkGetToken()
    setClerkToken(token)
    return token
  } catch {
    setClerkToken(null)
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = getClerkToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const freshToken = await refreshAndGetToken()
      if (freshToken) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`
        return api(originalRequest)
      }
      setClerkToken(null)
    }

    return Promise.reject(err)
  },
)

export default api
