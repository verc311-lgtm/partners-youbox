
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pznponymhusxgrwbahid.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnBvbnltaHVzeGdyd2JhaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjIwNDM0OCwiZXhwIjoyMDg3NzgwMzQ4fQ.-9s441c5MmmwzxbWo464mJ__cVvW3VLBL_rmMtsajug';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSample() {
  const { data, error } = await supabase.from('clientes').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0], null, 2));
}

checkSample();
