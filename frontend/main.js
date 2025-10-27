const spawnBtn = document.getElementById('spawn-btn');
const artifactDisplay = document.getElementById('artifact-display');

spawnBtn.addEventListener('click', async () => {
  const response = await fetch('/api/random-artifact');
  const artifact = await response.json();
  
  artifactDisplay.innerHTML = `
    <h2>${artifact.name}</h2>
    <p>Points: ${artifact.fragmentPoints}</p>
    <p>${artifact.description}</p>
  `;
});