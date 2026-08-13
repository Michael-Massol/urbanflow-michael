alter table public.completed_journeys
  add column if not exists geometry_snapshot jsonb null;

alter table public.completed_journeys
  drop constraint if exists completed_journeys_geometry_snapshot_shape;

alter table public.completed_journeys
  add constraint completed_journeys_geometry_snapshot_shape check (
    geometry_snapshot is null
    or (
      jsonb_typeof(geometry_snapshot) = 'object'
      and geometry_snapshot ->> 'type' = 'LineString'
      and jsonb_typeof(geometry_snapshot -> 'coordinates') = 'array'
      and jsonb_array_length(geometry_snapshot -> 'coordinates') >= 2
    )
  );

comment on column public.completed_journeys.geometry_snapshot is
  'Géométrie UrbanFlow normalisée du seul trajet explicitement confirmé; nullable pour les trajets historiques.';

notify pgrst, 'reload schema';
