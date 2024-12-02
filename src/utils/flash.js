import { getCookie, setCookie } from 'hono/cookie'

export const flash = {
  set: (c, message) => {
    setCookie(c, 'flash', JSON.stringify(message), {
      path: '/',
      httpOnly: true
    })
  },
  
  get: (c) => {
    try {
      const flash = getCookie(c, 'flash')
      if (flash) {
        setCookie(c, 'flash', '', { path: '/', maxAge: 0 }) // Clear the cookie
        return JSON.parse(flash)
      }
    } catch (e) {
      console.error('Flash parse error:', e)
    }
    return null
  }
} 