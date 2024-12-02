import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Check for .env file before configuration
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

dotenv.config()

export default defineConfig({
  plugins: [
    devServer({
      entry: './src/entry.js'
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['bcryptjs']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 