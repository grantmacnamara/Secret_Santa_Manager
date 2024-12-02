import { renderWelcomeSteps } from '../components/welcomeSteps.js'
import { renderGiftPreferences } from '../components/giftPreferences.js'

export function renderDashboard(user, config, message = null) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Secret Santa Dashboard</title>
        <link rel="stylesheet" href="/public/css/global.css">
        <link rel="stylesheet" href="/public/css/dashboard.css">
        <link rel="stylesheet" href="/public/css/notifications.css">
        <link href="https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@700&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
        ${message ? `
          <div class="notification notification-${message.type}">
            ${message.text}
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
          </div>
        ` : ''}
        
        <div class="dashboard-container">
          <div class="card">
            <div class="dashboard-header">
              <h1 class="dashboard-title">Welcome, ${user.username}! 🎄</h1>
              ${user.ready ? 
                '<span class="status-badge ready">Ready for Matching</span>' : 
                '<span class="status-badge pending">Not Ready</span>'
              }
            </div>

            ${renderWelcomeSteps()}

            <div class="preferences-section">
              ${renderGiftPreferences(user.giftPreferences, config, user)}
            </div>

            <form method="POST" action="/logout" class="logout-form">
              <button type="submit" class="btn btn-secondary">Logout</button>
            </form>
          </div>
        </div>
        <script src="/public/js/snowflakes.js"></script>
      </body>
    </html>
  `
} 