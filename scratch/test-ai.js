const { createClient } = require('@insforge/sdk');
require('dotenv').config({ path: '.env.local' });

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY
});

async function run() {
  console.log('Sending test prompt to inclusionai/ring-2.6-1t:free via OpenRouter...');
  try {
    const res = await insforge.ai.chat.completions.create({
      model: 'inclusionai/ring-2.6-1t:free',
      messages: [{ role: 'user', content: 'Reply with the word OK' }]
    });
    console.log('Success!', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error from InsForge AI:', err.message);
    if (err.response) {
      console.error(await err.response.text());
    }
  }
}
run();
