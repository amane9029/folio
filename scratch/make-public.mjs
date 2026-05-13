import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
  edgeFunctionToken: process.env.INSFORGE_SERVICE_KEY,
  isServerMode: true
});

async function main() {
  const { error } = await client.storage.updateBucket('covers', {
    public: true
  });
  if (error) {
    console.error('Error updating bucket:', error);
  } else {
    console.log('Bucket "covers" is now public!');
  }
}

main().catch(console.error);
