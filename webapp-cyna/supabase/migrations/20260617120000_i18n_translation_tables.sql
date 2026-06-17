-- =============================================================================
-- i18n: companion translation tables (fr / en)
-- -----------------------------------------------------------------------------
-- Base tables keep ONE row per entity holding all language-neutral data
-- (stripe ids, prices, inventory, FKs, flags, ordering, timestamps). All
-- translatable text moves into companion tables keyed by (parent_id, langue),
-- so Stripe mappings / inventory / FK integrity are preserved with no row
-- duplication. Existing French content is backfilled as the 'fr' rows; English
-- rows are added later from the admin UI (the read layer falls back to 'fr').
--
-- Reversible outline (manual rollback): re-add the dropped text columns, copy
-- the 'fr' rows back into them, drop the companion tables and the langue enum,
-- and restore texte_general's single-column primary key.
-- =============================================================================

-- 1. Supported languages -------------------------------------------------------
create type public.langue as enum ('fr', 'en');

-- 2. Companion tables ----------------------------------------------------------
-- NOTE: id_* columns are declared bigint to cover Supabase identity defaults;
-- Postgres allows the FK even if a base PK is integer (same operator family).

create table public.produit_traduction (
  id_produit bigint not null references public.produit (id_produit) on delete cascade,
  langue public.langue not null,
  nom_pro text not null,
  pro_description text,
  pro_carac_technique text,
  primary key (id_produit, langue)
);

create table public.categorie_traduction (
  id_categorie bigint not null references public.categorie (id_categorie) on delete cascade,
  langue public.langue not null,
  cat_nom text not null,
  cat_description text,
  primary key (id_categorie, langue)
);

create table public.prix_tarif_traduction (
  id_prix bigint not null references public.prix_tarif (id_prix) on delete cascade,
  langue public.langue not null,
  nom_prix_tarif text,
  unite text,
  primary key (id_prix, langue)
);

create table public.image_carrousel_traduction (
  id_image bigint not null references public.image_carrousel (id_image) on delete cascade,
  langue public.langue not null,
  titre_image text not null,
  description_image text,
  primary key (id_image, langue)
);

-- 3. Backfill existing French content -----------------------------------------
insert into public.produit_traduction (id_produit, langue, nom_pro, pro_description, pro_carac_technique)
select id_produit, 'fr', nom_pro, pro_description, pro_carac_technique
from public.produit;

insert into public.categorie_traduction (id_categorie, langue, cat_nom, cat_description)
select id_categorie, 'fr', cat_nom, cat_description
from public.categorie;

insert into public.prix_tarif_traduction (id_prix, langue, nom_prix_tarif, unite)
select id_prix, 'fr', nom_prix_tarif, unite
from public.prix_tarif;

insert into public.image_carrousel_traduction (id_image, langue, titre_image, description_image)
select id_image, 'fr', titre_image, description_image
from public.image_carrousel;

-- 4. texte_general: add langue and key the CMS content by (placement, langue) --
alter table public.texte_general
  add column langue public.langue not null default 'fr';

-- Drop whatever the current primary key is (name may vary), then re-key by
-- (emplacement_texte, langue) so each placement can hold one row per language.
do $$
declare
  pk_name text;
begin
  select conname into pk_name
  from pg_constraint
  where conrelid = 'public.texte_general'::regclass and contype = 'p';

  if pk_name is not null then
    execute format('alter table public.texte_general drop constraint %I', pk_name);
  end if;
end $$;

alter table public.texte_general add primary key (emplacement_texte, langue);

-- 5. Drop the now-relocated text columns from the base tables ------------------
alter table public.produit
  drop column nom_pro,
  drop column pro_description,
  drop column pro_carac_technique;

alter table public.categorie
  drop column cat_nom,
  drop column cat_description;

alter table public.prix_tarif
  drop column nom_prix_tarif,
  drop column unite;

alter table public.image_carrousel
  drop column titre_image,
  drop column description_image;

-- 6. Row level security: public (anon) read, writes via service role ----------
alter table public.produit_traduction enable row level security;
alter table public.categorie_traduction enable row level security;
alter table public.prix_tarif_traduction enable row level security;
alter table public.image_carrousel_traduction enable row level security;

create policy "Public read produit_traduction"
  on public.produit_traduction for select using (true);
create policy "Public read categorie_traduction"
  on public.categorie_traduction for select using (true);
create policy "Public read prix_tarif_traduction"
  on public.prix_tarif_traduction for select using (true);
create policy "Public read image_carrousel_traduction"
  on public.image_carrousel_traduction for select using (true);
