const spawnBtn = document.getElementById('spawn-btn');
const artifactDisplay = document.getElementById('artifact-display');
const scoreDisplay = document.getElementById('score');
const completedDisplay = document.getElementById('completed');

// Load initial score
async function loadScore() {
  const response = await fetch('/api/player-score');
  const data = await response.json();
  scoreDisplay.textContent = `Score: ${data.totalPoints}`;
  completedDisplay.textContent = `Completed Objects: ${data.completedObjects}`;
}

// Collect fragment and update score
spawnBtn.addEventListener('click', async () => {
  // Get random artifact
  const response = await fetch('/api/random-artifact');
  const artifact = await response.json();
  
  if (artifact.allCompleted) {
    artifactDisplay.innerHTML = '<p>All objects completed!</p>';
    return;
  }
  
  // Send to server to update score
  const updateResponse = await fetch('/api/collect-fragment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      objectId: artifact.objectId,
      setKey: artifact.setKey,
      fragmentNum: artifact.fragmentNum,
      fragmentPoints: artifact.fragmentPoints,
      completionBonus: artifact.completionBonus
    })
  });
  
  const result = await updateResponse.json();
  
  if (!result.success) {
    console.error('Error collecting fragment:', result.error);
    return;
  }
  
  // Update displays
  scoreDisplay.textContent = `Score: ${result.totalPoints}`;
  completedDisplay.textContent = `Completed Objects: ${result.totalCompleted}`;
  
  // Build display message - use the result from server, not artifact
  let message = `
    <h2>${artifact.name}</h2>
    <p>Set ${artifact.currentCompletion}/${artifact.maxCompletions}</p>
    <p>Fragment ${result.fragmentsCollected}/${result.fragmentsTotal}</p>
    <p>Points: ${artifact.fragmentPoints}</p>
  `;
  
  // Only show bonus if actually completed
  if (result.completed) {
    message += `<p>completed object bonus: +${result.bonusAwarded}</p>`;
  }
  
  message += `<p>${artifact.description}</p>`;
  
  artifactDisplay.innerHTML = message;
});

// Load score on page load
loadScore();