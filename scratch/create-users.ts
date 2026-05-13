import { createClient } from '@insforge/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const insforgeAdmin = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  edgeFunctionToken: process.env.INSFORGE_SERVICE_KEY!,
  isServerMode: true,
});

async function main() {
  console.log("Creating admin...");
  const { data: adminData, error: adminError } = await insforgeAdmin.auth.admin.createUser({
    email: 'admin@folio.com',
    email_confirm: true,
  });
  
  if (adminError) {
    console.error('Admin creation error:', adminError);
  } else {
    console.log('Created admin user:', adminData.user.id);
    const { error: profileError } = await insforgeAdmin.database.from('profiles').insert([{ id: adminData.user.id, role: 'admin' }]);
    if (profileError) console.error("Admin profile error:", profileError);
  }

  console.log("Creating user...");
  const { data: userData, error: userError } = await insforgeAdmin.auth.admin.createUser({
    email: 'user@folio.com',
    email_confirm: true,
  });
  
  if (userError) {
    console.error('User creation error:', userError);
  } else {
    console.log('Created normal user:', userData.user.id);
    const { error: profileError } = await insforgeAdmin.database.from('profiles').insert([{ id: userData.user.id, role: 'user' }]);
    if (profileError) console.error("User profile error:", profileError);
  }
}

main().catch(console.error);
