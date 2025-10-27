import express from 'express';
import { readFileSync } from 'fs';

const app = express();

app.use(express.json());

// Load database from JSON file
const database = JSON.parse(readFileSync('./data-base.json', 'utf8'));

// Route 1: Serve front-end page
app.use('/', express.static('../frontend'));

// Route 2: Return random artifact JSON
app.get('/api/random-artifact', (req, res) => {
  const objects = database.objects;
  const objectKeys = Object.keys(objects);
  
  // Get spawn rates
  const spawnRates = objectKeys.map(key => objects[key].spawnRate);
  const totalRate = spawnRates.reduce((sum, rate) => sum + rate, 0);
  
  // Pick random based on spawn rate
  let random = Math.random() * totalRate;
  let selectedKey;
  
  for (let i = 0; i < objectKeys.length; i++) {
    random -= spawnRates[i];
    if (random <= 0) {
      selectedKey = objectKeys[i];
      break;
    }
  }
  
  const artifact = objects[selectedKey];
  
  // Return name, fragmentPoints, description
  res.json({
    name: artifact.name,
    fragmentPoints: artifact.fragmentPoints,
    description: artifact.description
  });
});

app.listen(5000, () => {
  console.log('listening at localhost:5000');
});