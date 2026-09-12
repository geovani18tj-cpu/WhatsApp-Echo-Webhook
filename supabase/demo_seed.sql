-- Optional fictional walkthrough data. No credential below is real.
-- Safe to rerun after supabase/schema.sql.

delete from public.businesses where is_demo = true;

insert into public.businesses (
  id,
  name,
  phone_number_id,
  whatsapp_access_token,
  owner_whatsapp_number,
  instagram_user_id,
  instagram_page_token,
  is_demo
) values (
  'd3a00000-0000-4000-8000-000000000001',
  'Likkle Table Demo',
  'demo-wa-phone-number-id',
  'DEMO_NOT_A_REAL_WHATSAPP_TOKEN',
  '+18760000000',
  'demo-instagram-user-id',
  'DEMO_NOT_A_REAL_INSTAGRAM_TOKEN',
  true
);

insert into public.faqs (id, business_id, question, answer, triggers, active)
values
  (
    'd3a00000-0000-4000-8000-000000000101',
    'd3a00000-0000-4000-8000-000000000001',
    'What are your opening hours?',
    'We are open Monday to Saturday, 9:00 am to 6:00 pm.',
    array['hours', 'opening time', 'when are you open', 'wah time unnu open'],
    true
  ),
  (
    'd3a00000-0000-4000-8000-000000000102',
    'd3a00000-0000-4000-8000-000000000001',
    'Do you deliver?',
    'Yes, we deliver across Kingston and St. Andrew. Send your location for an estimate.',
    array['delivery', 'deliver', 'delivery areas'],
    true
  );

insert into public.media_items (
  id,
  business_id,
  label,
  filename,
  content_type,
  size_bytes,
  triggers
) values (
  'd3a00000-0000-4000-8000-000000000201',
  'd3a00000-0000-4000-8000-000000000001',
  'Weekend catering price list',
  'likkle-table-demo-price-list.pdf',
  'application/pdf',
  248000,
  array['price list', 'prices', 'menu prices']
);

insert into public.inbound_message_events (
  id, business_id, channel, external_message_id, sender_id, recipient_id,
  message_type, message_text, payload, outcome, matched_faq_id, created_at
) values
  (
    'd3a00000-0000-4000-8000-000000000301',
    'd3a00000-0000-4000-8000-000000000001',
    'whatsapp',
    'demo-wa-price-request',
    'demo-wa-customer',
    'demo-wa-phone-number-id',
    'text',
    'Hi, can I get the price list?',
    '{"demo":true,"match":"media"}',
    'media_reply',
    null,
    now() - interval '18 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000302',
    'd3a00000-0000-4000-8000-000000000001',
    'whatsapp',
    'demo-wa-hours-question',
    'demo-wa-customer',
    'demo-wa-phone-number-id',
    'text',
    'Wah time unnu open tomorrow?',
    '{"demo":true,"match":"faq"}',
    'faq_reply',
    'd3a00000-0000-4000-8000-000000000101',
    now() - interval '14 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000303',
    'd3a00000-0000-4000-8000-000000000001',
    'instagram',
    'demo-ig-price-request',
    'demo-ig-customer',
    'demo-instagram-user-id',
    'text',
    'Could you send me the price list?',
    '{"demo":true,"match":"media"}',
    'media_reply',
    null,
    now() - interval '10 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000304',
    'd3a00000-0000-4000-8000-000000000001',
    'instagram',
    'demo-ig-delivery-question',
    'demo-ig-customer',
    'demo-instagram-user-id',
    'text',
    'Do you deliver to St. Andrew?',
    '{"demo":true,"match":"faq"}',
    'faq_reply',
    'd3a00000-0000-4000-8000-000000000102',
    now() - interval '6 minutes'
  );

insert into public.outbound_message_events (
  id, business_id, channel, recipient_id, message_type, message_text,
  external_message_id, status, metadata, created_at
) values
  (
    'd3a00000-0000-4000-8000-000000000401',
    'd3a00000-0000-4000-8000-000000000001',
    'whatsapp',
    'demo-wa-customer',
    'document',
    'Weekend catering price list sent.',
    'demo-wa-price-response',
    'sent',
    '{"demo":true,"match":"media","media_id":"d3a00000-0000-4000-8000-000000000201"}',
    now() - interval '17 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000402',
    'd3a00000-0000-4000-8000-000000000001',
    'whatsapp',
    'demo-wa-customer',
    'text',
    'We are open Monday to Saturday, 9:00 am to 6:00 pm.',
    'demo-wa-hours-response',
    'sent',
    '{"demo":true,"match":"faq","faq_id":"d3a00000-0000-4000-8000-000000000101"}',
    now() - interval '13 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000403',
    'd3a00000-0000-4000-8000-000000000001',
    'instagram',
    'demo-ig-customer',
    'document',
    'Weekend catering price list shared.',
    'demo-ig-price-response',
    'sent',
    '{"demo":true,"match":"media","media_id":"d3a00000-0000-4000-8000-000000000201"}',
    now() - interval '9 minutes'
  ),
  (
    'd3a00000-0000-4000-8000-000000000404',
    'd3a00000-0000-4000-8000-000000000001',
    'instagram',
    'demo-ig-customer',
    'text',
    'Yes, we deliver across Kingston and St. Andrew. Send your location for an estimate.',
    'demo-ig-delivery-response',
    'sent',
    '{"demo":true,"match":"faq","faq_id":"d3a00000-0000-4000-8000-000000000102"}',
    now() - interval '5 minutes'
  );