document.addEventListener('DOMContentLoaded', function() {
  const snowflakeCount = 100; // Number of snowflakes
  const body = document.body;

  for (let i = 0; i < snowflakeCount; i++) {
    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    snowflake.style.left = Math.random() * 100 + 'vw';
    snowflake.style.animationDuration = Math.random() * 3 + 2 + 's'; // Random duration between 2s and 5s
    snowflake.style.animationDelay = Math.random() * 5 + 's'; // Random delay
    body.appendChild(snowflake);
  }
}); 