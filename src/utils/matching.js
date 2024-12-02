// Export as a named function
export function generateMatches(users) {
  // Helper function to shuffle array
  function shuffle(array) {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  console.log('🎯 Starting match generation...')
  const allUsers = [...users]
  const participants = allUsers.filter(user => !user.isAdmin && user.ready)

  if (participants.length < 2) {
    throw new Error('Need at least 2 participants')
  }

  const shuffledUsers = shuffle([...participants])
  const matches = []

  for (let i = 0; i < shuffledUsers.length; i++) {
    const giver = shuffledUsers[i]
    const receiver = shuffledUsers[(i + 1) % shuffledUsers.length]
    
    if (giver.id === receiver.id) {
      return generateMatches(allUsers)
    }
    
    matches.push({
      giverId: giver.id,
      receiverId: receiver.id
    })
  }

  const updatedUsers = allUsers.map(user => {
    const match = matches.find(m => m.giverId === user.id)
    if (match) {
      return {
        ...user,
        matchedWith: match.receiverId
      }
    }
    return user
  })
  
  return { matches, updatedUsers }
} 