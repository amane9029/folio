import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_INSFORGE_URL}/storage/v1/bucket/covers`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.INSFORGE_SERVICE_KEY}`
    },
    body: JSON.stringify({ public: true })
  });
  
  if (res.ok) {
    console.log('Bucket "covers" is now public!');
  } else {
    const text = await res.text();
    console.error('Error updating bucket:', res.status, text);
  }
}

main().catch(console.error);
