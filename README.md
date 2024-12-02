# 🎅 Secret Santa Gift Exchange

A web application for managing Secret Santa gift exchanges. Features include user management, gift preferences, automatic matching, and email notifications.

## 🎄 Features

- **User Management**: Create and manage participants
- **Gift Preferences**: Users can specify likes and dislikes
- **Automatic Matching**: Random assignment of gift givers and receivers
- **Email Notifications**: Automatic emails when matches are made
- **Admin Dashboard**: Manage users, track readiness, and initiate matching
- **Secure Authentication**: Password hashing and cookie-based sessions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SMTP server access for sending emails

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/secret-santa.git
cd secret-santa
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Create environment file**

Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Session Security
SESSION_SECRET=your-secret-key-change-this-in-production

# Email Configuration (Gmail)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-digit-app-password
SMTP_FROM=Secret Santa <your-gmail@gmail.com>

# Optional
DEBUG=false
```

4. **Initialize configuration files**

Create a `config.json` file in the root directory:
```json
{
  "priceRange": {
    "min": 20,
    "max": 50,
    "currency": "USD"
  },
  "matchingDeadline": "2024-12-15",
  "giftExchangeDate": "2024-12-25"
}
```

## 🎮 Usage

1. **Start the development server**
```bash
npm run dev
# or
yarn dev
```

2. **Build for production**
```bash
npm run build
# or
yarn build
```

3. **Start production server**
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000` (or your configured PORT)

## 👩‍💼 Admin Setup

1. On first run, an admin account will be automatically created using the credentials from your `.env` file
2. Login with your admin credentials at `/login`
3. Access the admin dashboard at `/admin`

## 👤 User Management

### Adding Users (Admin)
1. Navigate to the admin dashboard
2. Use the "Add New User" form
3. Provide username, email, and password

### User Actions
- Users can set gift preferences
- Mark themselves as ready for matching
- View their match once assigned

## 📧 Email Configuration

The application uses SMTP for sending emails. Make sure your SMTP settings in `.env` are correct.

Emails are sent for:
- Match notifications
- Password reset requests (if enabled)
- System notifications

## 🔒 Security Considerations

1. Always use HTTPS in production
2. Regularly update dependencies
3. Use strong passwords
4. Keep your `.env` file secure
5. Never commit sensitive files to version control

## 📁 Project Structure

```
secret-santa/
├── src/
│   ├── server/
│   │   └── index.js
│   ├── utils/
│   │   ├── userManager.js
│   │   ├── matching.js
│   │   └── emailService.js
│   ├── middleware/
│   │   └── auth.js
│   └── components/
│       └── giftPreferences.js
├── public/
│   └── css/
│       └── global.css
├── config.json
├── .env
└── package.json
```

## 🔧 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Verify Gmail App Password is correct
   - Ensure 2-Step Verification is enabled
   - Check spam folders
   - Verify EMAIL_USER matches SMTP_FROM address

2. **Matching not working**
   - Ensure at least 2 ready participants
   - Check for circular matching issues
   - Verify user ready status

3. **Login issues**
   - Clear cookies
   - Reset browser cache
   - Verify user credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Email Setup Instructions
1. Use a Gmail account
2. Enable 2-Step Verification in your Google Account
3. Generate an App Password:
   - Go to Google Account → Security
   - Find "2-Step Verification" → App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-digit password to EMAIL_PASS in your .env file



