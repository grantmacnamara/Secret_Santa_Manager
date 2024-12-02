export function createNotification(type, message) {
  // Debug
  console.log('Creating notification:', { type, message })
  
  // Don't render if missing data
  if (!type || !message) {
    console.warn('Missing notification data:', { type, message })
    return ''
  }

  return `
    <div class="notification notification-${type}">
      ${message}
      <button onclick="this.parentElement.remove()" class="notification-close">&times;</button>
    </div>
  `
} 