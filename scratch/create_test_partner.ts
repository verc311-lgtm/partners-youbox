
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pznponymhusxgrwbahid.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnBvbnltaHVzeGdyd2JhaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwNDM0OCwiZXhwIjoyMDg3NzgwMzQ4fQ.-9s441c5MmmwzxbWo464mJ__cVvW3VLBL_rmMtsajug';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createTestPartner() {
  const email = 'test_sync@youboxgt.com';
  const password = 'Password123';
  const name = 'Prueba Sincronización';
  const phone = '+502 9999 8888';

  console.log(`Creando socio de prueba: ${email}...`);

  // 1. Create Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (authError) {
    console.error('Error al crear auth user:', authError);
    return;
  }

  const userId = authUser.user.id;

  // 2. Generate partner code
  const { count } = await supabase.from('partners').select('*', { count: 'exact', head: true });
  const partnerCode = `YBP${(count || 0) + 1}`;
  
  // 3. Insert into partners
  const { error: partnerError } = await supabase.from('partners').insert([{
    id: userId,
    name,
    email,
    phone,
    partner_code: partnerCode,
    referral_code: `${partnerCode}-REF`,
    status: 'pending',
    is_active: false,
    level: 'Master Box'
  }]);

  if (partnerError) {
    console.error('Error al insertar partner:', partnerError);
  } else {
    console.log(`¡Socio ${partnerCode} creado con éxito en estado PENDIENTE!`);
    console.log(`ID: ${userId}`);
  }
}

createTestPartner();
