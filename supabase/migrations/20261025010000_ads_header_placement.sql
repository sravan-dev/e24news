-- "header" ads fill the 728 × 90 slot at the top right, next to the logo.
alter table public.ads drop constraint ads_placement_check;
alter table public.ads add constraint ads_placement_check
  check (placement in ('sidebar', 'inline', 'header'));
