-- =============================================================
-- Deduplicate tags across all tables
-- Maps similar tags to canonical versions
-- =============================================================

-- Tag mapping: canonical name → array of aliases to merge
do $$
declare
  tag_mappings record;
  old_tag text;
  new_tag text;
begin
  -- Define tag aliases to merge (old_tag → canonical new_tag)
  -- Format: old_tag | canonical_tag

  -- RSVP variations
  update public.signups
  set tags = array_replace(tags, 'rsvp-learn-apr-2025', 'rsvp')
  where tags @> array['rsvp-learn-apr-2025']::text[];

  update public.signups
  set tags = array_replace(tags, 'rsvp-2026-jun-12-networking-happy-hour', 'rsvp')
  where tags @> array['rsvp-2026-jun-12-networking-happy-hour']::text[];

  -- SXSW variations
  update public.signups
  set tags = array_replace(tags, 'SXSW', 'sxsw')
  where tags @> array['SXSW']::text[];

  -- Event tag consolidation
  update public.signups
  set tags = array_replace(tags, 'event-rsvp', 'rsvp')
  where tags @> array['event-rsvp']::text[];

  update public.signups
  set tags = array_replace(tags, 'event-attendee', 'attendee')
  where tags @> array['event-attendee']::text[];

  -- Learn event variations
  update public.signups
  set tags = array_replace(tags, 'learn-event', 'learn')
  where tags @> array['learn-event']::text[];

  update public.signups
  set tags = array_replace(tags, 'learn-1-attendee', 'learn')
  where tags @> array['learn-1-attendee']::text[];

  update public.signups
  set tags = array_replace(tags, 'learn-1-feedback', 'learn')
  where tags @> array['learn-1-feedback']::text[];

  -- Reflect event
  update public.signups
  set tags = array_replace(tags, 'reflect-event', 'reflect')
  where tags @> array['reflect-event']::text[];

  -- Feedback variations
  update public.signups
  set tags = array_replace(tags, 'feedback-respondent', 'feedback')
  where tags @> array['feedback-respondent']::text[];

  -- Learn feedback
  update public.signups
  set tags = array_replace(tags, 'Learn1feedback', 'learn')
  where tags @> array['Learn1feedback']::text[];

  -- Volunteer variations
  update public.signups
  set tags = array_replace(tags, 'volunteer-connector', 'volunteer')
  where tags @> array['volunteer-connector']::text[];

  update public.signups
  set tags = array_replace(tags, 'volunteer-mentor', 'volunteer')
  where tags @> array['volunteer-mentor']::text[];

  update public.signups
  set tags = array_replace(tags, 'volunteer-organizer', 'volunteer')
  where tags @> array['volunteer-organizer']::text[];

  -- Remove duplicates within tag arrays (in case same tag appears twice)
  update public.signups
  set tags = array(select distinct unnest(tags) order by 1)
  where tags is not null and array_length(tags, 1) > 0;

  -- Also dedupe in events table if it has tags
  update public.events
  set tags = array(select distinct unnest(tags) order by 1)
  where tags is not null and array_length(tags, 1) > 0;

end $$;

-- Create a view of tag frequency to help identify further duplicates
create or replace view public.tag_frequency as
  select
    unnest(tags) as tag,
    count(*) as frequency,
    'signups' as source
  from public.signups
  where tags is not null and array_length(tags, 1) > 0
  group by unnest(tags)
  union all
  select
    unnest(tags) as tag,
    count(*) as frequency,
    'events' as source
  from public.events
  where tags is not null and array_length(tags, 1) > 0
  group by unnest(tags)
  order by frequency desc, tag;
