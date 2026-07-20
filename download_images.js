const fs = require('fs');
const https = require('https');
const path = require('path');

const prompts = [
  "high quality anime style, majestic male lion standing on a rocky mountain peak at sunrise, powerful, dominating, productivity, success, no gaming",
  "high quality anime style, powerful muscular male tiger walking through a dense forest, focused intense eyes, predatory drive, success",
  "high quality anime style, bald eagle soaring high above the clouds, clear sky, freedom, sharp vision, business success",
  "high quality anime style, determined young male athlete in a hardcore gym lifting heavy weights, intense workout, sweat, physical strength",
  "high quality anime style, sharply dressed male businessman analyzing glowing financial stock market charts, futuristic technology, wealth generation",
  "high quality anime style, focused male software engineer typing late at night in a sleek high tech office, glowing screens, deep work, productivity",
  "high quality anime style, wise old owl perched on a stack of ancient books in a grand library, glowing knowledge, wisdom",
  "high quality anime style, athletic man sprinting up a steep hill at dawn, endurance, cardiovascular fitness, health",
  "high quality anime style, majestic alpha wolf howling at a massive full moon, leadership, strength, resilience",
  "high quality anime style, close up of a glowing gold coin held by a male hand in a futuristic bank, wealth building, investment",
  "high quality anime style, ambitious man in a tailored suit standing on a skyscraper edge looking over a vast metropolis, ambition, success",
  "high quality anime style, sleek futuristic AI robot meditating, artificial intelligence, technology, deep focus, mental clarity",
  "high quality anime style, intense muscular male boxer striking a heavy punching bag, sweat flying, dedication, combat",
  "high quality anime style, golden eagle swooping down to catch its prey, sharp focus, precision, strategic business execution",
  "high quality anime style, fit male athlete preparing a healthy nutritious meal with fresh greens, glowing vitality, longevity",
  "high quality anime style, male tech entrepreneur shaking hands with a glowing holographic AI figure, networking, future technology, business",
  "high quality anime style, powerful tiger resting peacefully on a massive pile of glowing gold coins, financial security, wealth",
  "high quality anime style, exhausted but victorious male marathon runner breaking the finish line ribbon, victory, perseverance",
  "high quality anime style, massive futuristic quantum server room, glowing blue data streams, deep technology, computing power",
  "high quality anime style, fierce male lion roaring aggressively with a dark stormy sky and lightning in the background, conquering fear",
  "high quality anime style, determined male mountain climber reaching the snowy summit, ice axe in hand, extreme effort, achievement",
  "high quality anime style, male martial artist meditating under a powerful waterfall, mental toughness, inner peace, discipline"
];

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
};

async function main() {
  for (let i = 0; i < prompts.length; i++) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompts[i])}?width=800&height=600&nologo=true&seed=42`;
    const filepath = path.join(__dirname, 'public', 'motivational', `slide_${i + 1}.jpg`);
    console.log(`Downloading slide_${i + 1}.jpg...`);
    try {
      await downloadImage(url, filepath);
      console.log(`Successfully downloaded slide_${i + 1}.jpg`);
      await new Promise(r => setTimeout(r, 1000)); // Rate limiting
    } catch (e) {
      console.error(`Failed to download slide_${i + 1}.jpg:`, e.message);
    }
  }
}

main();
