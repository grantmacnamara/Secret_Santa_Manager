export function renderGiftPreferences(preferences = {}, config = {}, user = {}) {
  const prefs = {
    likes: [],
    dislikes: [],
    ...preferences
  }

  // If preferences are saved, show the confirmation view
  if (user.ready) {
    return `
      <div class="preferences-confirmation">
        <h3>🎄 Your Preferences are Saved!</h3>
        
        <div class="saved-preferences">
          <div class="preference-section">
            <h4>Things You Like:</h4>
            <ul>
              <li>${prefs.likes[0] || ''}</li>
              <li>${prefs.likes[1] || ''}</li>
            </ul>
          </div>
          
          <div class="preference-section">
            <h4>Things You Dislike:</h4>
            <ul>
              <li>${prefs.dislikes[0] || ''}</li>
              <li>${prefs.dislikes[1] || ''}</li>
            </ul>
          </div>

          <div class="price-section">
            <h4>Gift Price Limit:</h4>
            <p>£${config.priceRange || '0'}</p>
          </div>
        </div>

        <div class="next-steps">
          <p>✨ Thank you for submitting your preferences!</p>
          <p>📧 You'll receive an email when everyone has made their choices and matches have been made.</p>
          <p>🎁 Feel free to log out and check your email later.</p>
        </div>
      </div>
    `
  }

  // If preferences aren't saved yet, show the input form
  return `
    <form method="POST" action="/preferences" class="gift-preferences">
      <div class="price-range-info">
        <h3>Gift Price Limit</h3>
        <p class="price-range-display">£${config.priceRange || '0'}</p>
      </div>

      <div class="preference-group">
        <label>Two Things You Like</label>
        <div class="preference-inputs">
          <input type="text" 
                 name="likes[0]" 
                 value="${prefs.likes[0] || ''}" 
                 placeholder="First thing you like"
                 maxlength="50"
                 required>
          <input type="text" 
                 name="likes[1]" 
                 value="${prefs.likes[1] || ''}" 
                 placeholder="Second thing you like"
                 maxlength="50"
                 required>
        </div>
      </div>

      <div class="preference-group">
        <label>Two Things You Dislike</label>
        <div class="preference-inputs">
          <input type="text" 
                 name="dislikes[0]" 
                 value="${prefs.dislikes[0] || ''}" 
                 placeholder="First thing you dislike"
                 maxlength="50"
                 required>
          <input type="text" 
                 name="dislikes[1]" 
                 value="${prefs.dislikes[1] || ''}" 
                 placeholder="Second thing you dislike"
                 maxlength="50"
                 required>
        </div>
      </div>

      <div class="preference-actions">
        <button type="submit" class="btn btn-primary">Save Preferences</button>
      </div>
    </form>
  `
} 