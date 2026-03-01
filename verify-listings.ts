import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    const { data, count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Full Error:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    console.log(`categories count: ${count}`);
}

verify().catch(console.error);
