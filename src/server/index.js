import 'dotenv/config'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { getCookie, setCookie } from 'hono/cookie'
import { userManager } from '../utils/userManager.js'
import { generateMatches } from '../utils/matching.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { renderGiftPreferences } from '../components/giftPreferences.js'
import { flash } from '../utils/flash.js'
import { sendMatchNotification, sendInviteEmail } from '../utils/emailService.js'
import { renderWelcomeSteps } from '../components/welcomeSteps.js'
import { createNotification } from '../utils/notifications.js'
import { renderLoginPage } from '../pages/login.js'
import { renderDashboard } from '../pages/dashboard.js'

export const app = new Hono()

// Initialize user manager
app.use('*', async (c, next) => {
  await userManager.initialize()
  c.set('userManager', userManager)
  await next()
})

// Serve static files
app.use('/public/*', serveStatic({ root: './' }))

// Public routes
app.get('/login', async (c) => {
  const message = flash.get(c)
  const username = c.req.query('username') || ''
  return c.html(renderLoginPage(message, username))
})

app.post('/login', async (c) => {
  const { username, password } = await c.req.parseBody()
  const userManager = c.get('userManager')
  
  try {
    const user = await userManager.validateUser(username, password)
    if (!user) {
      flash.set(c, { type: 'error', text: 'Invalid username or password' })
      return c.html(renderLoginPage({ type: 'error', text: 'Invalid username or password' }))
    }

    setCookie(c, 'userId', user.id.toString(), {
      path: '/',
      httpOnly: true
    })

    return c.redirect(user.isAdmin ? '/admin' : '/')
  } catch (error) {
    console.error('Login error:', error)
    flash.set(c, { type: 'error', text: 'An error occurred during login' })
    return c.html(renderLoginPage({ type: 'error', text: 'An error occurred during login' }))
  }
})

// Add auto-login route here, before the auth middleware
app.get('/auto-login', async (c) => {
  console.log('Auto-login route hit!');
  const token = c.req.query('token');
  console.log('Token received:', token);

  if (!token) {
    console.log('No token provided');
    flash.set(c, { type: 'error', text: 'Login link is invalid' });
    return c.redirect('/login');
  }

  const userManager = c.get('userManager');
  console.log('UserManager:', userManager ? 'Available' : 'Not available');

  try {
    const user = await userManager.validateAutoLoginToken(token);
    console.log('User found:', user);

    if (!user) {
      flash.set(c, { type: 'error', text: 'Invalid or expired login link' });
      return c.redirect('/login');
    }

    setCookie(c, 'userId', user.id.toString(), {
      path: '/',
      httpOnly: true
    });

    return c.redirect('/');
  } catch (error) {
    console.error('Auto-login error:', error);
    flash.set(c, { type: 'error', text: 'An error occurred during auto-login' });
    return c.redirect('/login');
  }
});

// Protected routes
app.use('/admin/*', authMiddleware, adminMiddleware)
app.use('/*', authMiddleware)

// Admin routes
app.get('/admin', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const allUsers = await userManager.getUsers()
  const users = allUsers?.filter(user => !user.isAdmin) || []
  const message = flash.get(c)

  const stats = {
    total: users.length || 0,
    ready: users.filter(user => user.ready).length || 0,
    notReady: users.filter(user => !user.ready).length || 0
  }

  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secret Santa Admin</title>
        <link rel="stylesheet" href="/public/css/global.css">
        <link rel="stylesheet" href="/public/css/notifications.css">
        <style>
          .user-row {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 0.8rem;
            background: #fff;
            padding: 1.2rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          .user-row:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .user-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .user-name {
            font-weight: 600;
            font-size: 1.1rem;
            min-width: 140px;
            position: relative;
            cursor: help;
            color: #2c3e50;
          }
          .user-name:hover::after {
            content: attr(data-email);
            position: absolute;
            top: 100%;
            left: 0;
            background: #2c3e50;
            color: white;
            padding: 0.6rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            white-space: nowrap;
            z-index: 1000;
            font-weight: normal;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .user-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
          }
          .ready-toggle {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
            min-width: 100px;
            text-align: center;
          }
          .ready-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .ready-toggle.ready {
            background-color: #2ecc71;
            color: white;
          }
          .ready-toggle.not-ready {
            background-color: #e74c3c;
            color: white;
          }
          .family-group-select {
            padding: 0.5rem 1rem;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            min-width: 130px;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 0.7rem center;
            background-size: 1em;
            padding-right: 2.5rem;
            transition: all 0.2s ease;
          }
          .family-group-select:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52,152,219,0.2);
          }
          .delete-btn {
            background-color: #fff;
            color: #e74c3c;
            border: 2px solid #e74c3c;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            font-size: 0.9rem;
          }
          .delete-btn:hover {
            background-color: #e74c3c;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(231,76,60,0.2);
          }
          .match-info {
            font-size: 0.95rem;
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 200px;
          }
          .match-info.matched {
            color: #27ae60;
            font-weight: 500;
          }
          .match-info.not-matched {
            color: #7f8c8d;
          }
          .match-arrow {
            color: #3498db;
            font-weight: bold;
            font-size: 1.2rem;
          }
          .family-1 {
            background: linear-gradient(45deg, #ff6b6b10, #ffffff);
            border-left: 4px solid #ff6b6b;
          }
          .family-2 {
            background: linear-gradient(45deg, #4ecdc410, #ffffff);
            border-left: 4px solid #4ecdc4;
          }
          .stats {
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
          .stat-item {
            text-align: center;
          }
          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 0.3rem;
          }
          .stat-label {
            color: #7f8c8d;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${message ? `
            <div class="notification notification-${message.type}">
              ${message.text}
              <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
            </div>
          ` : ''}
          
          <div class="card">
            <h1>Admin Dashboard 🎅</h1>
            
            <section>
              <h2>Add New User</h2>
              <form method="POST" action="/admin/users" class="form">
                <div class="form-group">
                  <label for="username">Username:</label>
                  <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                  <label for="email">Email:</label>
                  <input type="email" id="email" name="email" required>
                </div>
                <button type="submit" class="btn">Add User</button>
              </form>
            </section>

            <section>
              <h2>Participants</h2>
              <div class="stats">
                <div class="stat-item">
                  <div class="stat-value">${stats.total}</div>
                  <div class="stat-label">Total Participants</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${stats.ready}</div>
                  <div class="stat-label">Ready</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">${stats.notReady}</div>
                  <div class="stat-label">Not Ready</div>
                </div>
              </div>
              <form method="POST" action="/admin/send-invites" style="margin-bottom: 1rem;">
                <button type="submit" class="btn btn-primary">
                  📧 Send Invites to Users
                </button>
              </form>
              ${users.map(user => `
                <div class="user-row family-${user.familyGroup || '0'}">
                  <div class="user-info">
                    <span class="user-name" data-email="${user.email}">${user.username}</span>
                  </div>
                  <div class="user-actions">
                    <form method="POST" action="/admin/toggle-ready/${user.id}" style="margin: 0;">
                      <button type="submit" 
                              class="ready-toggle ${user.ready ? 'ready' : 'not-ready'}"
                              title="${user.ready ? 'Click to unready' : 'Click to ready'}">
                        ${user.ready ? '✓ Ready' : '✗ Not Ready'}
                      </button>
                    </form>
                    <form method="POST" action="/admin/users/${user.id}/family-group" style="margin: 0;">
                      <select name="familyGroup" 
                              onchange="this.form.submit()" 
                              class="family-group-select"
                              style="background-color: ${user.familyGroup ? `var(--christmas-${user.familyGroup === 1 ? 'red' : 'green'})` : '#f8f9fa'}; 
                                     color: ${user.familyGroup ? 'white' : '#333'};">
                        <option value="0">No Family</option>
                        <option value="1" ${user.familyGroup === 1 ? 'selected' : ''}>Family 1</option>
                        <option value="2" ${user.familyGroup === 2 ? 'selected' : ''}>Family 2</option>
                        <option value="3" ${user.familyGroup === 3 ? 'selected' : ''}>Family 3</option>
                        <option value="4" ${user.familyGroup === 4 ? 'selected' : ''}>Family 4</option>
                        <option value="5" ${user.familyGroup === 5 ? 'selected' : ''}>Family 5</option>
                      </select>
                    </form>
                    <form method="POST" action="/admin/users/${user.id}/delete" style="margin: 0;">
                      <button type="submit" class="delete-btn" 
                              onclick="return confirm('Are you sure you want to delete this user?')">
                        Delete
                      </button>
                    </form>
                  </div>
                  <div class="match-info ${user.matchedWith ? 'matched' : 'not-matched'}">
                    ${user.matchedWith ? 
                      `<span class="match-arrow">→</span> Matched with: ${allUsers.find(u => u.id === user.matchedWith)?.username || 'Unknown'}` 
                      : 'Not matched'}
                  </div>
                </div>
              `).join('')}

              <div class="admin-match-controls" style="margin-top: 2rem;">
                ${stats.total > 0 ? `
                  <div class="match-status-indicator ${stats.ready === stats.total ? 'ready' : 'not-ready'}">
                    ${stats.ready === stats.total 
                      ? '✅ All participants are ready!' 
                      : `⚠️ Waiting for ${stats.notReady} participant${stats.notReady !== 1 ? 's' : ''} to be ready`
                    }
                  </div>
                  
                  <form method="POST" action="/admin/match" style="display: inline-block; margin-right: 1rem;">
                    <button type="submit" 
                            class="btn btn-primary"
                            ${stats.ready !== stats.total ? 'disabled' : ''}
                            onclick="return confirm('Are you sure you want to generate matches?')">
                      Generate Matches 🎯
                    </button>
                  </form>

                  <form method="POST" action="/admin/rematch" style="display: inline-block; margin-right: 1rem;">
                    <button type="submit" 
                            class="btn btn-warning"
                            ${stats.ready !== stats.total ? 'disabled' : ''}
                            onclick="return confirm('Are you sure you want to clear and regenerate all matches?')">
                      Clear & Rematch 🔄
                    </button>
                  </form>

                  ${users.some(u => u.matchedWith) ? `
                    <form method="POST" action="/admin/send-emails" style="display: inline-block;">
                      <button type="submit" 
                              class="btn btn-success"
                              onclick="return confirm('This will send emails to all matched participants. Continue?')">
                        Send Match Emails 📧
                      </button>
                    </form>
                  ` : ''}
                ` : '<p>No participants added yet.</p>'}
              </div>
            </section>

            <div class="admin-actions" style="margin-top: 2rem; text-align: right;">
              <form method="POST" action="/logout" style="margin: 0;">
                <button type="submit" class="btn btn-secondary">Logout</button>
              </form>
            </div>
          </div>
        </div>
        <script src="/public/js/snowflakes.js"></script>
      </body>
    </html>
  `)
})

app.post('/admin/add-user', async (c) => {
  const { username, password } = await c.req.parseBody()
  try {
    const user = await userManager.addUser(username, password)
    return c.html(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=/admin">
        </head>
        <body>
          User added successfully!
        </body>
      </html>
    `)
  } catch (error) {
    return c.html(`
      <html>
        <head>
          <meta http-equiv="refresh" content="3;url=/admin">
        </head>
        <body>
          Error adding user: ${error.message}
        </body>
      </html>
    `)
  }
})

app.post('/admin/logout', (c) => {
  setCookie(c, 'userId', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  })
  return c.redirect('/login')
})

// Home route
app.get('/', async (c) => {
  const user = c.get('user')
  const message = flash.get(c)
  const config = await userManager.getConfig()

  // Ensure user has giftPreferences
  if (!user.giftPreferences) {
    user.giftPreferences = {
      likes: [],
      dislikes: []
    }
  }

  return c.html(renderDashboard(user, config, message))
})

// Admin API routes
app.post('/admin/users', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const { username, email } = await c.req.parseBody()
  
  console.log('Creating user with data:', { username, email })
  
  try {
    const user = await userManager.addUser(username, email)
    flash.set(c, { type: 'success', text: `User ${username} created successfully! Password: ${user.clearPassword}` })
    return c.redirect('/admin')
  } catch (error) {
    console.error('User creation error:', error)
    flash.set(c, { type: 'error', text: 'Error creating user' })
    return c.redirect('/admin')
  }
})

app.post('/admin/users/:id/delete', async (c) => {
  const id = parseInt(c.req.param('id'))
  await userManager.deleteUser(id)
  return c.redirect('/admin')
})

app.post('/admin/generate-matches', adminMiddleware, async (c) => {
  try {
    const userManager = c.get('userManager')
    const users = await userManager.getUsers()
    
    if (!users || users.length < 2) {
      throw new Error('Not enough users to generate matches')
    }

    console.log('🎯 Starting match generation with', users.length, 'users')
    const { matches, updatedUsers } = await generateMatches(users)
    
    // Verify we have users before saving
    if (!updatedUsers || updatedUsers.length === 0) {
      throw new Error('Match generation produced no valid user data')
    }

    // Log before saving
    console.log('🎯 Saving updated users:', updatedUsers.length, 'users')
    await userManager.saveUsers(updatedUsers)
    
    flash.set(c, {
      type: 'success',
      text: `Successfully generated ${matches.length} matches!`
    })
  } catch (error) {
    console.error('Match generation error:', error)
    flash.set(c, {
      type: 'error',
      text: error.message || 'Failed to generate matches'
    })
  }
  
  return c.redirect('/admin')
})

app.post('/admin/reset-matches', async (c) => {
  try {
    const users = await userManager.getUsers()
    for (const user of users) {
      if (!user.isAdmin) {
        await userManager.updateUser(user.id, {
          matchedWith: null,
          ready: false
        })
      }
    }
    
    flash.set(c, {
      type: 'success',
      text: 'Matches have been reset!'
    })
    
    return c.redirect('/admin')
  } catch (error) {
    flash.set(c, {
      type: 'error',
      text: 'Failed to reset matches'
    })
    return c.redirect('/admin')
  }
})

// User API routes
app.post('/preferences', async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.parseBody()
    
    // Update preferences and set ready status
    user.giftPreferences = {
      likes: [body['likes[0]'], body['likes[1]']],
      dislikes: [body['dislikes[0]'], body['dislikes[1]']],
    }
    user.ready = true
    
    await userManager.updateUser(user.id, user)
    
    // Set flash message with correct structure
    flash.set(c, {
      type: 'success',
      text: 'Preferences saved! You\'ll receive an email when matches are made.'
    })
    
    return c.redirect('/')
  } catch (error) {
    console.error('Preference save error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Error saving preferences. Please try again.'
    })
    return c.redirect('/')
  }
})

app.post('/ready', async (c) => {
  const user = c.get('user')
  await userManager.updateUser(user.id, {
    ready: !user.ready
  })
  return c.redirect('/')
})

app.post('/logout', (c) => {
  setCookie(c, 'userId', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  })
  return c.redirect('/login')
})

// Add this route for debugging
app.get('/debug/users', async (c) => {
  const users = await userManager.getUsers()
  return c.json({
    userCount: users.length,
    hasAdmin: users.some(u => u.username === 'admin'),
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      isAdmin: u.isAdmin
    }))
  })
})

// Add route to handle config updates
app.post('/admin/config', async (c) => {
  const { priceRange } = await c.req.parseBody()
  await userManager.updateConfig({ priceRange })
  flash.set(c, {
    type: 'success',
    text: 'Exchange settings updated successfully!'
  })
  return c.redirect('/admin')
})

app.post('/admin/reset', adminMiddleware, async (c) => {
  try {
    console.log('🔄 Reset matches requested')
    const userManager = c.get('userManager')
    await userManager.resetMatches()
    
    flash.set(c, {
      type: 'success',
      text: 'Matches have been reset. User preferences and ready status preserved.'
    })
  } catch (error) {
    console.error('Reset error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Failed to reset matches'
    })
  }
  
  return c.redirect('/admin')
})

// Add this new route for toggling ready status
app.post('/admin/toggle-ready/:userId', adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const userManager = c.get('userManager')
    const users = await userManager.getUsers()
    
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          ready: !user.ready  // Toggle the ready status
        }
      }
      return user
    })
    
    await userManager.saveUsers(updatedUsers)
    
    flash.set(c, {
      type: 'success',
      text: `Successfully updated ready status`
    })
  } catch (error) {
    console.error('Toggle ready error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Failed to update ready status'
    })
  }
  
  return c.redirect('/admin')
})

// Generate matches
app.post('/admin/match', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const participants = users.filter(user => !user.isAdmin)

  if (!participants.every(user => user.ready)) {
    flash.set(c, { type: 'error', text: 'All participants must be ready before generating matches.' })
    return c.redirect('/admin')
  }

  try {
    const { updatedUsers } = await generateMatches(users)
    await userManager.saveUsers(updatedUsers)
    flash.set(c, { type: 'success', text: 'Matches generated successfully!' })
  } catch (error) {
    console.error('Matching error:', error)
    flash.set(c, { type: 'error', text: 'Error generating matches: ' + error.message })
  }

  return c.redirect('/admin')
})

// Clear and regenerate matches
app.post('/admin/rematch', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const participants = users.filter(user => !user.isAdmin)

  if (!participants.every(user => user.ready)) {
    flash.set(c, { type: 'error', text: 'All participants must be ready before regenerating matches.' })
    return c.redirect('/admin')
  }

  try {
    // Clear existing matches
    const clearedUsers = users.map(user => ({
      ...user,
      matchedWith: null
    }))

    // Generate new matches
    const { updatedUsers } = await generateMatches(clearedUsers)
    await userManager.saveUsers(updatedUsers)
    flash.set(c, { type: 'success', text: 'Matches cleared and regenerated successfully!' })
  } catch (error) {
    console.error('Rematching error:', error)
    flash.set(c, { type: 'error', text: 'Error regenerating matches: ' + error.message })
  }

  return c.redirect('/admin')
})

app.post('/admin/send-emails', adminMiddleware, async (c) => {
  const userManager = c.get('userManager')
  const users = await userManager.getUsers()
  const matchedUsers = users.filter(user => user.matchedWith && !user.isAdmin)

  if (matchedUsers.length === 0) {
    flash.set(c, { type: 'error', text: 'No matches found to send emails for.' })
    return c.redirect('/admin')
  }

  try {
    let emailsSent = 0
    let emailErrors = 0
    
    for (const giver of matchedUsers) {
      try {
        const receiver = users.find(u => u.id === giver.matchedWith)
        if (giver.email && receiver) {
          await sendMatchNotification(giver, receiver)
          emailsSent++
        }
      } catch (err) {
        console.error(`Failed to send email to ${giver.email}:`, err)
        emailErrors++
      }
    }

    if (emailErrors > 0) {
      flash.set(c, { 
        type: 'warning', 
        text: `Sent ${emailsSent} emails, but ${emailErrors} failed. Check console for details.` 
      })
    } else {
      flash.set(c, { 
        type: 'success', 
        text: `Successfully sent ${emailsSent} match notification email${emailsSent !== 1 ? 's' : ''}!` 
      })
    }
  } catch (error) {
    console.error('Email error:', error)
    flash.set(c, { type: 'error', text: 'Error sending emails: ' + error.message })
  }

  return c.redirect('/admin')
})

app.post('/admin/send-invites', adminMiddleware, async (c) => {
  const userManager = c.get('userManager');
  const users = await userManager.getUsers();
  const nonAdminUsers = users.filter(user => !user.isAdmin);
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of nonAdminUsers) {
    try {
      await sendInviteEmail(user, appUrl, userManager);
      successCount++;
    } catch (error) {
      console.error(`Failed to send invite to ${user.email}:`, error);
      errorCount++;
    }
  }
  
  flash.set(c, { 
    type: errorCount === 0 ? 'success' : 'error',
    text: `Sent ${successCount} invites${errorCount > 0 ? `, ${errorCount} failed` : ''}`
  });
  
  return c.redirect('/admin');
});

// Add this new route for updating family group
app.post('/admin/users/:id/family-group', adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param('id'))
    const { familyGroup } = await c.req.parseBody()
    const userManager = c.get('userManager')
    
    await userManager.updateUser(userId, {
      familyGroup: parseInt(familyGroup)
    })
    
    flash.set(c, {
      type: 'success',
      text: 'Family group updated successfully'
    })
  } catch (error) {
    console.error('Family group update error:', error)
    flash.set(c, {
      type: 'error',
      text: 'Failed to update family group'
    })
  }
  
  return c.redirect('/admin')
})