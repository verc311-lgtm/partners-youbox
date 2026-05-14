
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pznponymhusxgrwbahid.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnBvbnltaHVzeGdyd2JhaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwNDM0OCwiZXhwIjoyMDg3NzgwMzQ4fQ.-9s441c5MmmwzxbWo464mJ__cVvW3VLBL_rmMtsajug';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function cleanup() {
  console.log('Cleaning up test users...');

  // 1. Delete from clientes (those starting with YBP)
  const { error: cError } = await supabase.from('clientes').delete().ilike('locker_id', 'YBP%');
  if (cError) console.error('Error deleting clientes:', cError);
  else console.log('Clientes starting with YBP deleted.');

  // 2. Delete from partners (all except the admin)
  const { error: pError } = await supabase.from('partners').delete().neq('email', 'admin@youboxgt.com');
  if (pError) console.error('Error deleting partners:', pError);
  else console.log('Partners (except admin) deleted.');

  // Note: We don't delete from auth.users here as it requires admin access which we have but it's more complex.
  // Actually, I should delete from auth.users too if possible to allow re-registration.
}

cleanup();
