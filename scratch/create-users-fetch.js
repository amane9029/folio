require('dotenv').config({ path: '.env.local' });

const URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY;

async function createUser(email, role) {
  console.log(`Creating ${role} (${email})...`);
  
  // 1. Create user in auth
  const authRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      email_confirm: true
    })
  });
  
  const authData = await authRes.json();
  if (!authRes.ok) {
    console.error(`Failed to create auth user for ${email}:`, authData);
    return;
  }
  
  const userId = authData.id;
  console.log(`Auth user created: ${userId}`);
  
  // 2. Insert into profiles
  const profileRes = await fetch(`${URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: userId,
      role: role
    })
  });
  
  const profileData = await profileRes.json();
  if (!profileRes.ok) {
    console.error(`Failed to create profile for ${email}:`, profileData);
  } else {
    console.log(`Profile created for ${email}.`);
  }
}

async function main() {
  await createUser('admin@folio.com', 'admin');
  await createUser('user@folio.com', 'user');
}

main().catch(console.error);
