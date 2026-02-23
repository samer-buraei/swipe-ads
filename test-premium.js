const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.*?)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*?)"/)[1];

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function run() {
    const { data, error } = await supabase.from('listings').select('id').limit(1);
    if (error) console.error(error);
    if (data && data.length) {
        const { error: updErr } = await supabase.from('listings').update({ is_premium: true }).eq('id', data[0].id);
        if (updErr) console.error(updErr);
        else console.log('Marked premium:', data[0].id);
    }
}

run();
