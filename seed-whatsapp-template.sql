-- Seed: WhatsApp agent notification template
-- Run in Supabase SQL Editor after Session 3 code is deployed

INSERT INTO whatsapp_templates (
  name,
  category,
  language,
  body_template,
  variables,
  status
) VALUES (
  'agent_case_alert',
  'UTILITY',
  'ms',
  '🏠 *Kes Baru Diterima*

Rujukan: {{case_ref}}
Pembeli: {{buyer_name}}
Hartanah: {{property_name}}
Status: {{status}}

Sila semak kes ini di panel ejen:
https://snang.my/agent

— Snang.my | AI bantu prepare, MANUSIA submit',
  '["case_ref", "buyer_name", "property_name", "status"]'::jsonb,
  'approved'
) ON CONFLICT (name) DO UPDATE SET
  body_template = EXCLUDED.body_template,
  variables = EXCLUDED.variables;
