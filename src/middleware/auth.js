import { getCookie } from 'hono/cookie'

export const authMiddleware = async (c, next) => {
  const userId = getCookie(c, 'userId')
  if (!userId) {
    return c.redirect('/login')
  }
  
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const user = users.find(u => u.id === parseInt(userId))
  if (!user) {
    return c.redirect('/login')
  }
  
  c.set('user', user)
  await next()
}

export const adminMiddleware = async (c, next) => {
  const user = c.get('user')
  if (!user?.isAdmin) {
    return c.text('Unauthorized', 401)
  }
  await next()
} 