// Creates the 10 demo logins (FR-001) with the shared DEMO_PASSWORD from .env.local.
// Run once, before supabase/seed.sql:  node supabase/seed-users.mjs
// The ids are fixed so seed.sql and the tests can refer to them.

import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_PASSWORD } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEMO_PASSWORD) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD in .env.local");
}

const users = [
  ["00000000-0000-4000-a000-000000000001", "admin@voluntree.test"],
  ["00000000-0000-4000-a000-000000000002", "organizer@voluntree.test"],
  ["00000000-0000-4000-a000-000000000011", "aisha@voluntree.test"],
  ["00000000-0000-4000-a000-000000000012", "daniel@voluntree.test"],
  ["00000000-0000-4000-a000-000000000013", "meilin@voluntree.test"],
  ["00000000-0000-4000-a000-000000000014", "farid@voluntree.test"],
  ["00000000-0000-4000-a000-000000000015", "priya@voluntree.test"],
  ["00000000-0000-4000-a000-000000000016", "omar@voluntree.test"],
  ["00000000-0000-4000-a000-000000000017", "sofia@voluntree.test"],
  ["00000000-0000-4000-a000-000000000018", "yusuf@voluntree.test"],
];

const admin = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

for (const [id, email] of users) {
  const { error } = await admin.auth.admin.createUser({
    id,
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error && !/already/i.test(error.message)) throw error;
  console.log(error ? `exists  ${email}` : `created ${email}`);
}
