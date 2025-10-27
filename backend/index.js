import express from 'express';
import { readFileSync, writeFileSync } from 'fs';

const app = express();

app.use(express.json());

// Load databases
const gameData = JSON.parse(readFileSync('./data-base.json', 'utf8'));
let userData = JSON.parse(readFileSync('./user-data.json', 'utf8'));

// Helper function to save user data
function saveUserData() {
  writeFileSync('./user-data.json', JSON.stringify(userData, null, 2));
}

// Route 1: Serve front-end page
app.use('/', express.static('../frontend'));

// Route 2: Return random artifact JSON
app.get('/api/random-artifact', (req, res) => {
  const objects = gameData.objects;
  const objectKeys = Object.keys(objects);
  const player = userData.players.player_local;
  
  // Filter objects that can still be completed
  const availableObjects = objectKeys.filter(key => {
    const completions = player.completedObjects[key] || 0;
    const maxCompletions = objects[key].maxCompletions;
    
    // Check if we can start a new set
    if (completions < maxCompletions) {
      const currentSetKey = `${key}_set_${completions}`;
      const collectedFragments = player.collectedFragments[currentSetKey] || [];
      
      // Only include if current set is not complete
      return collectedFragments.length < objects[key].fragmentsPerObject;
    }
    return false;
  });
  
  if (availableObjects.length === 0) {
    return res.json({ allCompleted: true });
  }
  
  // Get spawn rates only for available objects
  const spawnRates = availableObjects.map(key => objects[key].spawnRate);
  const totalRate = spawnRates.reduce((sum, rate) => sum + rate, 0);
  
  // Pick random based on spawn rate
  let random = Math.random() * totalRate;
  let selectedKey;
  
  for (let i = 0; i < availableObjects.length; i++) {
    random -= spawnRates[i];
    if (random <= 0) {
      selectedKey = availableObjects[i];
      break;
    }
  }
  
  const artifact = objects[selectedKey];
  
  // Get current set key
  const completions = player.completedObjects[selectedKey] || 0;
  const currentSetKey = `${selectedKey}_set_${completions}`;
  
  // Get available fragments for current set
  if (!player.collectedFragments[currentSetKey]) {
    player.collectedFragments[currentSetKey] = [];
  }
  
  const collectedFragments = player.collectedFragments[currentSetKey];
  const availableFragments = [];
  
  for (let i = 1; i <= artifact.fragmentsPerObject; i++) {
    if (!collectedFragments.includes(i)) {
      availableFragments.push(i);
    }
  }
  
  // Pick random available fragment
  const fragmentNum = availableFragments[Math.floor(Math.random() * availableFragments.length)];
  
  // Return artifact info
  res.json({
    objectId: selectedKey,
    setKey: currentSetKey,
    fragmentNum: fragmentNum,
    fragmentsTotal: artifact.fragmentsPerObject,
    fragmentsCollected: collectedFragments.length,
    name: artifact.name,
    fragmentPoints: artifact.fragmentPoints,
    completionBonus: artifact.completionBonus,
    description: artifact.description,
    currentCompletion: completions + 1,
    maxCompletions: artifact.maxCompletions
  });
});

// Route 3: Get player score
app.get('/api/player-score', (req, res) => {
  const player = userData.players.player_local;
  
  // Count total completions
  const totalCompleted = Object.values(player.completedObjects).reduce((sum, count) => sum + count, 0);
  
  res.json({
    totalPoints: player.totalPoints,
    completedObjects: totalCompleted
  });
});

// Route 4: Collect fragment
app.post('/api/collect-fragment', (req, res) => {
  const { objectId, setKey, fragmentNum, fragmentPoints, completionBonus } = req.body;
  const player = userData.players.player_local;
  const artifact = gameData.objects[objectId];
  
  // Initialize
  if (!player.collectedFragments[setKey]) {
    player.collectedFragments[setKey] = [];
  }
  if (!player.completedObjects[objectId]) {
    player.completedObjects[objectId] = 0;
  }
  
  // Check if fragment already collected (safety check)
  if (player.collectedFragments[setKey].includes(fragmentNum)) {
    return res.json({
      success: false,
      error: 'Fragment already collected',
      totalPoints: player.totalPoints,
      totalCompleted: Object.values(player.completedObjects).reduce((sum, count) => sum + count, 0)
    });
  }
  
  // Add fragment
  player.collectedFragments[setKey].push(fragmentNum);
  
  // Add fragment points
  player.totalPoints += fragmentPoints;
  
  let completed = false;
  let bonusAwarded = 0;
  
  // Check if this set is completed (AFTER adding the fragment)
  if (player.collectedFragments[setKey].length === artifact.fragmentsPerObject) {
    // Award completion bonus
    player.totalPoints += completionBonus;
    player.completedObjects[objectId]++;
    completed = true;
    bonusAwarded = completionBonus;
  }
  
  // Save to file
  saveUserData();
  
  // Count total completions
  const totalCompleted = Object.values(player.completedObjects).reduce((sum, count) => sum + count, 0);
  
  res.json({
    success: true,
    completed: completed,
    bonusAwarded: bonusAwarded,
    totalPoints: player.totalPoints,
    totalCompleted: totalCompleted,
    fragmentsCollected: player.collectedFragments[setKey].length,
    fragmentsTotal: artifact.fragmentsPerObject
  });
});

app.listen(5000, () => {
  console.log('listening at localhost:5000');
});