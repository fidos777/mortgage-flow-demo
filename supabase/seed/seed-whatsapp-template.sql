-- Seed: WhatsApp agent case notification template
-- Run in Supabase SQL Editor after Session 3 code is deployed
--
-- Schema reference: migration 003_agent_contacts.sql
--   whatsapp_templates(code UNIQUE, name, description, message_en, message_bm, category, is_active)
--   category CHECK IN: first_contact, follow_up, document_request, status_update, appointment, completion

INSERT INTO whatsapp_templates (
  code,
  name,
  description,
  message_en,
  message_bm,
  category,
  is_active
) VALUES (
  'agent_case_alert',
  'Agent Case Alert',
  'Notification sent to agent when a new case is assigned or updated',
  E'🏠 *New Case Received*\n\nRef: {{case_ref}}\nBuyer: {{buyer_name}}\nProperty: {{property_name}}\nStatus: {{status}}\n\nPlease review this case at the agent panel:\nhttps://snang.my/agent\n\n— Snang.my | AI helps prepare, HUMANS submit',
  E'🏠 *Kes Baru Diterima*\n\nRujukan: {{case_ref}}\nPembeli: {{buyer_name}}\nHartanah: {{property_name}}\nStatus: {{status}}\n\nSila semak kes ini di panel ejen:\nhttps://snang.my/agent\n\n— Snang.my | AI bantu prepare, MANUSIA submit',
  'status_update',
  true
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  message_en = EXCLUDED.message_en,
  message_bm = EXCLUDED.message_bm,
  updated_at = NOW();
