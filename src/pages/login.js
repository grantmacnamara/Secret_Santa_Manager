export function renderLoginPage(message = null, username = '') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Macnamara's Secret Santa</title>
        <link rel="stylesheet" href="/public/css/global.css">
        <link rel="stylesheet" href="/public/css/login.css">
        <link rel="stylesheet" href="/public/css/notifications.css">
        <link href="https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@700&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 0.8rem;
            padding-top: 10vh;
          }
          
          .login-card {
            width: 100%;
            max-width: 350px;
            padding: 1.2rem;
          }

          .login-title {
            text-align: center;
            margin-bottom: 1.5rem;
            font-family: 'Mountains of Christmas', cursive;
            color: var(--christmas-red);
            font-size: 2rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            line-height: 1.2;
          }

          .login-title span {
            display: block;
            font-size: 0.8em;
            color: var(--christmas-green);
            margin-top: 0.3rem;
          }

          .login-form {
            display: flex;
            flex-direction: column;
            gap: 1.2rem;
          }

          .form-group {
            width: 100%;
          }

          .form-group label {
            font-size: 1.1rem;
            margin-bottom: 0.4rem;
            display: block;
          }

          .form-group input {
            width: 100%;
            box-sizing: border-box;
            font-size: 1.1rem;
            padding: 0.7rem;
            border-radius: 6px;
            height: 2.6rem;
            margin: 0;
          }

          .login-btn {
            width: 100%;
            margin-top: 1.2rem;
            padding: 0.8rem;
            font-size: 1.1rem;
            height: 3rem;
            border-radius: 6px;
            box-sizing: border-box;
          }

          @media (max-width: 480px) {
            .login-card {
              padding: 1.2rem;
              margin: 0.8rem;
              width: calc(100% - 1.6rem);
            }

            .login-title {
              font-size: 1.8rem;
            }

            .form-group {
              margin-bottom: 1rem;
            }

            .notification {
              font-size: 1rem;
              padding: 0.8rem;
              margin: 0.8rem;
            }
          }

          @media (min-width: 481px) {
            .login-card {
              padding: 1.5rem;
            }

            .login-title {
              font-size: 2rem;
            }
          }
        </style>
      </head>
      <body>
        ${message ? `
          <div class="notification notification-${message.type}">
            ${message.text}
            <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
          </div>
        ` : ''}
        
        <div class="login-container">
          <div class="card login-card">
            <h1 class="login-title">
              🎄 Macnamara's
              <span>Secret Santa!</span>
            </h1>
            <form action="/login" method="POST" class="login-form">
              <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" 
                       id="username" 
                       name="username" 
                       value="${username}"
                       required 
                       autocomplete="username"
                       autocapitalize="none">
              </div>
              <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" 
                       id="password" 
                       name="password" 
                       required
                       autocomplete="current-password">
              </div>
              <button type="submit" class="btn login-btn">Login</button>
            </form>
          </div>
        </div>
        <script src="/public/js/snowflakes.js"></script>
      </body>
    </html>
  `
} 
