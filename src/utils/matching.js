// Export as a named function
export function generateMatches(users, maxRetries = 50) {
  // Helper function to shuffle array
  function shuffle(array) {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Helper function to check if a match is valid
  function isValidMatch(giver, receiver) {
    // Can't match with self
    if (giver.id === receiver.id) return false;
    
    // Can't match within same family group
    if (giver.familyGroup === receiver.familyGroup) {
      console.log(`Invalid match: ${giver.username}(Family ${giver.familyGroup}) -> ${receiver.username}(Family ${receiver.familyGroup})`);
      return false;
    }
    
    console.log(`Valid match: ${giver.username}(Family ${giver.familyGroup}) -> ${receiver.username}(Family ${receiver.familyGroup})`);
    return true;
  }

  // Helper function to check if matching is possible
  function isMatchingPossible(participants) {
    // Count participants in each family group
    const familyGroups = participants.reduce((acc, p) => {
      acc[p.familyGroup] = (acc[p.familyGroup] || 0) + 1;
      return acc;
    }, {});

    // Get the total number of participants
    const totalParticipants = participants.length;

    // Check each family group
    for (const [group, count] of Object.entries(familyGroups)) {
      const othersCount = totalParticipants - count;
      if (count > othersCount) {
        return {
          possible: false,
          reason: `Family group ${group} has ${count} members but there are only ${othersCount} people in other groups. Each person in family ${group} needs someone from a different family to match with.`
        };
      }
    }

    return { possible: true };
  }

  // Helper function to attempt one complete matching
  function attemptMatching(participants) {
    const matches = [];
    const availableReceivers = [...participants];
    const givers = [...participants];

    console.log('\nAttempting new matching round:');
    console.log('Participants:', participants.map(p => `${p.username}(Family ${p.familyGroup})`).join(', '));

    for (const giver of givers) {
      console.log(`\nFinding match for ${giver.username}(Family ${giver.familyGroup})`);
      
      // Get all valid receivers for this giver
      const validReceivers = availableReceivers.filter(receiver => {
        const isValid = isValidMatch(giver, receiver);
        const isLastGiver = givers.indexOf(giver) === givers.length - 1;
        const canCompleteCircle = !isLastGiver || isValidMatch(giver, givers[0]);
        return isValid && canCompleteCircle;
      });

      console.log(`Valid receivers for ${giver.username}:`, validReceivers.map(r => r.username).join(', '));

      if (validReceivers.length === 0) {
        console.log(`❌ No valid receivers found for ${giver.username}`);
        return null; // No valid match found, matching attempt failed
      }

      // Randomly select one of the valid receivers
      const receiver = validReceivers[Math.floor(Math.random() * validReceivers.length)];
      console.log(`Selected receiver for ${giver.username}: ${receiver.username}`);
      
      // Remove the selected receiver from available pool
      const receiverIndex = availableReceivers.findIndex(r => r.id === receiver.id);
      availableReceivers.splice(receiverIndex, 1);

      matches.push({
        giverId: giver.id,
        receiverId: receiver.id
      });
    }

    console.log('\nMatching round complete!');
    return matches;
  }

  console.log('🎯 Starting match generation...')
  const allUsers = [...users]
  const participants = allUsers.filter(user => !user.isAdmin && user.ready)

  if (participants.length < 2) {
    throw new Error('Need at least 2 participants')
  }

  // Check if matching is possible with current family group distribution
  const possibilityCheck = isMatchingPossible(participants);
  if (!possibilityCheck.possible) {
    throw new Error(possibilityCheck.reason);
  }

  // Log initial participant information
  console.log('\nParticipants and their family groups:');
  participants.forEach(p => {
    console.log(`${p.username}: Family ${p.familyGroup}`);
  });

  // Try to generate matches with limited retries
  let retryCount = 0;
  let matches = null;
  let shuffledParticipants = [...participants];

  while (retryCount < maxRetries && matches === null) {
    console.log(`\n🔄 Attempt ${retryCount + 1} of ${maxRetries}...`);
    shuffledParticipants = shuffle(shuffledParticipants);
    matches = attemptMatching(shuffledParticipants);
    retryCount++;
  }

  if (matches === null) {
    console.log('\n❌ Failed to generate matches. Family group distribution:');
    const groupCounts = participants.reduce((acc, p) => {
      acc[p.familyGroup] = (acc[p.familyGroup] || 0) + 1;
      return acc;
    }, {});
    console.log(groupCounts);
    
    throw new Error(`Failed to generate valid matches after ${maxRetries} attempts. Please ensure there are enough participants in different family groups.`);
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
  
  console.log(`\n✅ Successfully generated matches after ${retryCount} attempts`);
  // Log final matches
  matches.forEach(match => {
    const giver = allUsers.find(u => u.id === match.giverId);
    const receiver = allUsers.find(u => u.id === match.receiverId);
    console.log(`${giver.username}(Family ${giver.familyGroup}) -> ${receiver.username}(Family ${receiver.familyGroup})`);
  });
  
  return { matches, updatedUsers }
} 