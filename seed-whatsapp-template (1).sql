-- Seed: WhatsApp agent notification template
-- Matches actual whatsapp_templates schema (migration 003/005)
-- Columns: code (UNIQUE), name, description, message_bm, message_en, category, is_active

INSERT INTO whatsapp_templates (
  code,
  name,
  description,
  message_bm,
  message_en,
  category,
  is_active
) VALUES (
  'agent_case_alert',
  'Notifikasi Kes Baru',
  'Maklumkan ejen apabila kes baru diterima dalam sistem',
  '🏠 *Kes Baru Diterima*

Rujukan: {{case_ref}}
Pembeli: {{buyer_name}}
Hartanah: {{property_name}}
Status: {{status}}

Sila semak kes ini di panel ejen:
https://snang.my/agent

— Snang.my | AI bantu prepare, MANUSIA submit',
  '🏠 *New Case Received*

Reference: {{case_ref}}
Buyer: {{buyer_name}}
Property: {{property_name}}
Status: {{status}}

Please review this case in the agent panel:
https://snang.my/agent

— Snang.my | AI helps prepare, HUMANS submit',
  'utility',
  true
) ON CONFLICT (code) DO UPDATE SET
  message_bm = EXCLUDED.message_bm,
  message_en = EXCLUDED.message_en,
  is_active = EXCLUDED.is_active;
