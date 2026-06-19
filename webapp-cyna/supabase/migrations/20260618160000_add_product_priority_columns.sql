-- Add mis_avant_ordre and is_priorite columns to produit
-- mis_avant_ordre: display order among featured products (homepage)
-- is_priorite: flag for priority products (top of category)
-- ordre_priorite already exists for ordering priority products

ALTER TABLE public.produit
  ADD COLUMN mis_avant_ordre INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN is_priorite BOOLEAN DEFAULT false NOT NULL;
