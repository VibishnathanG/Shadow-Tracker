const fs = require('fs');
const https = require('https');
const path = require('path');

const keywords = [
  "lion,majestic",
  "tiger,powerful",
  "eagle,soaring",
  "gym,athlete",
  "stocks,finance",
  "programmer,coding",
  "owl,library",
  "sprint,runner",
  "wolf,howling",
  "gold,coins",
  "skyscraper,ambition",
  "robot,futuristic",
  "boxer,punching",
  "eagle,hunting",
  "healthy,meal",
  "handshake,business",
  "tiger,resting",
  "marathon,finish",
  "server,data",
  "lion,roaring",
  "climber,mountain",
  "meditation,waterfall"
];

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
            redirectUrl = 'https://loremflickr.com' + redirectUrl;
        }
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Status: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

async function main() {
  for (let i = 0; i < keywords.length; i++) {
    // Add random number to avoid cache
    const url = `https://loremflickr.com/800/600/${keywords[i]}?lock=${Math.floor(Math.random() * 10000)}`;
    const filepath = path.join(__dirname, 'public', 'motivational', `slide_${i + 1}.jpg`);
    console.log(`Downloading slide_${i + 1}.jpg...`);
    try {
      await downloadImage(url, filepath);
      console.log(`Success: slide_${i + 1}.jpg`);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`Error:`, e.message);
    }
  }
}

main();
