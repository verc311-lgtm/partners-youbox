
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pznponymhusxgrwbahid.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnBvbnltaHVzeGdyd2JhaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwNDM0OCwiZXhwIjoyMDg3NzgwMzQ4fQ.-9s441c5MmmwzxbWo464mJ__cVvW3VLBL_rmMtsajug';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testActivate() {
  const partnerId = 'ee21e179-c096-45d6-97f1-854fbb6ec5c5'; // Prueba Cuatro
  
  // 1. Get partner data
  const { data: partner, error: pError } = await supabase.from('partners').select('*').eq('id', partnerId).single();
  if (pError) { console.error('PError:', pError); return; }

  console.log('Activating partner:', partner.name);

  // 2. Insert into clientes
  const { error: cError } = await supabase.from('clientes').insert([{
    id: partner.id,
    nombre: partner.name.split(' ')[0],
    apellido: partner.name.split(' ').slice(1).join(' ') || '.',
    email: partner.email,
    telefono: partner.phone,
    locker_id: partner.partner_code,
    sucursal_id: 'c3416dd1-810f-4929-a048-2d1015707cb0',
    activo: true,
    notas: `Socio activado desde Partners App. Código: ${partner.partner_code}`
  }]);

  if (cError) {
    console.error('CError (Sync):', cError);
  } else {
    console.log('Sync SUCCESS');
  }

  // 3. Update partner status
  const { error: upError } = await supabase.from('partners').update({ status: 'active', is_active: true }).eq('id', partnerId);
  if (upError) console.error('UPError:', upError);
  else console.log('Partner status updated SUCCESS');
}

testActivate();
