import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hzsepuezgkgssboiscvc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6c2VwdWV6Z2tnc3Nib2lzY3ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTIxMzk1MCwiZXhwIjoyMDc2Nzg5OTUwfQ.rNOD862vJ1CLWyWDRVfATsOQARfcFT7ZpUipcN96v38'
);

async function check() {
  // Ver el player_club
  const { data: pc } = await supabase
    .from('player_clubs')
    .select('*, player:players(*)')
    .eq('id', '49826028-75a7-4af8-ab4a-64479dab1b50')
    .single();

  console.log('Player Club:', pc);
  console.log('\nPlayer agent_commission_percentage:', pc?.player?.agent_commission_percentage);

  // Ver player_conditions
  const { data: conditions } = await supabase
    .from('player_conditions')
    .select('*')
    .eq('player_club_id', '49826028-75a7-4af8-ab4a-64479dab1b50');

  console.log('\nPlayer Conditions:', conditions);
}

check();
