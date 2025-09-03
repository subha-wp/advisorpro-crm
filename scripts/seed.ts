import { neon } from "@neondatabase/serverless"

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("[seed] DATABASE_URL is missing. Add it in Project Settings > Environment Variables.")
    process.exit(1)
  }
  const sql = neon(url)

  console.log("[seed] Inserting sample user, workspace, membership...")
  const [{ id: user_id }] = await sql /* sql */`
    insert into users (name, email, phone, password_hash)
    values ('Owner One', 'owner@example.com', '+911234567890', '$2b$10$examplehashreplace')
    returning id
  `
  const [{ id: workspace_id }] = await sql /* sql */`
    insert into workspaces (name, owner_id, plan)
    values ('Owner One Workspace', ${user_id}, 'FREE') returning id
  `
  await sql /* sql */`
    insert into memberships (user_id, workspace_id, role)
    values (${user_id}, ${workspace_id}, 'OWNER')
    on conflict do nothing
  `

  console.log("[seed] Inserting clients and policies...")
  const clients = await sql /* sql */`
    insert into clients (workspace_id, name, mobile, email, tags)
    values
      (${workspace_id}, 'Alice Sharma', '+919999000001', 'alice@example.com', ARRAY['priority','delhi']),
      (${workspace_id}, 'Rahul Verma', '+919999000002', 'rahul@example.com', ARRAY['mumbai']),
      (${workspace_id}, 'Neha Gupta', '+919999000003', 'neha@example.com', ARRAY['priority'])
    returning id
  `
  for (const c of clients) {
    await sql /* sql */`
      insert into policies (client_id, insurer, plan_name, policy_number, sum_assured, premium_amount, premium_mode, next_due_date, status)
      values
        (${c.id}, 'LIC', 'Jeevan Anand', 'LIC-${c.id}-001', 1500000, 12000, 'YEARLY', now()::date + 15, 'ACTIVE'),
        (${c.id}, 'HDFC Life', 'Click 2 Protect', 'HDFC-${c.id}-002', 2500000, 2000, 'MONTHLY', now()::date + 45, 'ACTIVE')
      on conflict do nothing
    `
  }

  console.log("[seed] Inserting reminder templates...")
  await sql /* sql */`
    insert into reminder_templates (workspace_id, name, channel, subject, body, variables)
    values
      (${workspace_id}, 'Premium Due (Email)', 'email', 'Premium due reminder', 'Dear {{client_name}}, your policy {{policy_no}} premium of ₹{{premium_amount}} is due on {{due_date}}.', ARRAY['client_name','policy_no','premium_amount','due_date']),
      (${workspace_id}, 'Premium Due (WhatsApp)', 'whatsapp', null, 'Hi {{client_name}}, policy {{policy_no}} premium ₹{{premium_amount}} due {{due_date}}. Reply for help.', ARRAY['client_name','policy_no','premium_amount','due_date'])
    on conflict do nothing
  `

  console.log("[seed] Done")
}

run().catch((err) => {
  console.error("[seed] Error:", err)
  process.exit(1)
})
