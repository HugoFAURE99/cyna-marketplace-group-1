create table public.caracteristique_technique (
  id_caracteristique integer generated always as identity primary key,
  date_creation timestamptz default now() not null
);

create table public.caracteristique_technique_traduction (
  id_caracteristique integer not null
    references public.caracteristique_technique (id_caracteristique)
    on delete cascade,
  langue public.langue not null,
  nom_caracteristique text not null,
  primary key (id_caracteristique, langue),
  check (length(btrim(nom_caracteristique)) > 0)
);

create unique index caracteristique_technique_traduction_nom_unique
  on public.caracteristique_technique_traduction (
    langue,
    lower(btrim(nom_caracteristique))
  );

create table public.produit_caracteristique_technique (
  id_produit integer not null
    references public.produit (id_produit)
    on delete cascade,
  id_caracteristique integer not null
    references public.caracteristique_technique (id_caracteristique)
    on delete cascade,
  ordre_affichage integer default 0 not null,
  primary key (id_produit, id_caracteristique)
);

create index produit_caracteristique_technique_produit_order_idx
  on public.produit_caracteristique_technique (
    id_produit,
    ordre_affichage,
    id_caracteristique
  );

create index produit_caracteristique_technique_caracteristique_idx
  on public.produit_caracteristique_technique (id_caracteristique);

create or replace function public.est_admin()
returns boolean
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.utilisateur
    where id_compte = auth.uid()
      and role = 'admin'
      and is_actif = true
  );
end;
$$ language plpgsql;

alter table public.caracteristique_technique enable row level security;
alter table public.caracteristique_technique_traduction enable row level security;
alter table public.produit_caracteristique_technique enable row level security;

create policy "Public read active product characteristic links"
  on public.produit_caracteristique_technique
  for select
  using (
    exists (
      select 1
      from public.produit
      where produit.id_produit = produit_caracteristique_technique.id_produit
        and produit.statut_produit = true
    )
  );

create policy "Public read active product characteristics"
  on public.caracteristique_technique
  for select
  using (
    exists (
      select 1
      from public.produit_caracteristique_technique pct
      join public.produit p on p.id_produit = pct.id_produit
      where pct.id_caracteristique = caracteristique_technique.id_caracteristique
        and p.statut_produit = true
    )
  );

create policy "Public read active product characteristic translations"
  on public.caracteristique_technique_traduction
  for select
  using (
    exists (
      select 1
      from public.produit_caracteristique_technique pct
      join public.produit p on p.id_produit = pct.id_produit
      where pct.id_caracteristique =
        caracteristique_technique_traduction.id_caracteristique
        and p.statut_produit = true
    )
  );

create policy "Admin manage technical characteristics"
  on public.caracteristique_technique
  for all
  using (public.est_admin())
  with check (public.est_admin());

create policy "Admin manage technical characteristic translations"
  on public.caracteristique_technique_traduction
  for all
  using (public.est_admin())
  with check (public.est_admin());

create policy "Admin manage product technical characteristic links"
  on public.produit_caracteristique_technique
  for all
  using (public.est_admin())
  with check (public.est_admin());
