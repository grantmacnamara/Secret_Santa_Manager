import { serve } from '@hono/node-server'
import { app } from './server/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Check for .env file existence
const envPath = path.join(process.cwd(), '.env')
if (!fs.existsSync(envPath)) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: .env file not found!')
  console.log('\n📝 Please create a .env file with the following template:\n')
  console.log(`PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
SESSION_SECRET=your-secret-key-change-this-in-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
SMTP_FROM=Secret Santa <your-email@gmail.com>
DEBUG=false`)
  
  process.exit(1)
}

const port = process.env.PORT || 3000

export default {
  port,
  fetch: app.fetch
}

if (process.env.NODE_ENV !== 'development') {
  serve({
    fetch: app.fetch,
    port
  }, () => {
    console.log(`✨ Server is running on ${process.env.APP_URL}`)
  })
} 