-- Add scheduled_time to content_calendar table for finer-grained publishing control.
-- Time is stored as HH:mm format in America/Chicago timezone.

begin;

alter table public.content_calendar
  add column scheduled_time text;

comment on column public.content_calendar.scheduled_time is 'Time of day to publish (HH:mm format, America/Chicago timezone). Null if no specific time set.';

commit;
