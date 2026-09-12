-- Optional fake walkthrough data. No real credentials or customer data.
insert into public.businesses (id, name, phone_number_id, owner_whatsapp_number, instagram_user_id)
values ('00000000-0000-4000-8000-000000000001', 'Demo Kingston Kitchen', null, '+18760000000', null)
on conflict (id) do nothing;

insert into public.faqs (business_id, question, answer, triggers)
values
  ('00000000-0000-4000-8000-000000000001', 'What are your opening hours?', 'We are open Monday to Saturday, 9:00 am to 6:00 pm.', array['hours', 'opening time', 'when are you open']),
  ('00000000-0000-4000-8000-000000000001', 'Do you deliver?', 'Yes, we deliver across Kingston and St. Andrew. Ask us for an estimate.', array['delivery', 'deliver', 'delivery areas'])
on conflict do nothing;

insert into public.media_items (business_id, label, filename, content_type, size_bytes, triggers)
values ('00000000-0000-4000-8000-000000000001', 'Demo menu', 'demo-menu.pdf', 'application/pdf', 0, array['menu', 'prices', 'price list'])
on conflict do nothing;