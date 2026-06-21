-- Add ordre column to image_carrousel for drag-and-drop ordering
ALTER TABLE image_carrousel ADD COLUMN IF NOT EXISTS ordre INTEGER NOT NULL DEFAULT 0;

-- Initialize order based on current id_image
UPDATE image_carrousel SET ordre = id_image;
