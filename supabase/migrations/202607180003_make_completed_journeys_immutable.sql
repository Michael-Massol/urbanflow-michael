revoke update on public.completed_journeys from authenticated;

drop policy if exists "Users can update their own completed journeys"
on public.completed_journeys;

notify pgrst, 'reload schema';
