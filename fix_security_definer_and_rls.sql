-- Supprime toutes les vues dépendantes dans le bon ordre
DROP VIEW IF EXISTS public.missions_language_match CASCADE;
DROP VIEW IF EXISTS public.user_past_missions CASCADE;
DROP VIEW IF EXISTS public.user_upcoming_missions CASCADE;
DROP VIEW IF EXISTS public.available_missions CASCADE;
DROP VIEW IF EXISTS public.volunteers_with_languages CASCADE;
-- Ajoute ici DROP VIEW IF EXISTS public.missions_enriched CASCADE; si besoin

-- volunteers_with_languages
CREATE OR REPLACE VIEW public.volunteers_with_languages AS
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.avatar_url,
    p.bio,
    p.address,
    p.city,
    p.postal_code,
    p.latitude,
    p.longitude,
    p.max_distance,
    p.availability,
    p.interests,
    p.skills,
    p.languages,
    p.impact_score,
    p.total_missions_completed,
    p.total_hours_volunteered,
    p.created_at,
    p.updated_at,
    p.role,
    COALESCE(
        json_agg(
            json_build_object(
                'language', ll.language,
                'level', ll.level,
                'is_primary', ll.is_primary
            )
        ) FILTER (WHERE ll.id IS NOT NULL),
        '[]'::json
    ) AS language_details
FROM 
    public.profiles p
LEFT JOIN 
    public.language_levels ll ON p.id = ll.user_id
WHERE 
    p.role = 'benevole'
GROUP BY 
    p.id;

-- missions_language_match
CREATE OR REPLACE VIEW public.missions_language_match AS
SELECT 
    m.*,
    a.name AS association_name,
    a.logo_url AS association_logo,
    (
        SELECT array_agg(DISTINCT p.id)
        FROM public.profiles p
        WHERE 
            p.role = 'benevole'
            AND (
                m.languages_needed IS NULL 
                OR m.languages_needed = '{}'::text[] 
                OR EXISTS (
                    SELECT 1
                    FROM unnest(p.languages) AS user_lang
                    JOIN unnest(m.languages_needed) AS mission_lang ON user_lang = mission_lang
                )
            )
    ) AS matching_volunteers
FROM 
    public.missions m
JOIN 
    public.associations a ON m.association_id = a.id
WHERE 
    m.status = 'published'
    AND m.date >= CURRENT_DATE
    AND m.spots_taken < m.spots_available;

-- user_past_missions
CREATE OR REPLACE VIEW public.user_past_missions AS
SELECT 
    m.*,
    a.name AS association_name,
    a.logo_url AS association_logo,
    mr.status AS registration_status,
    mr.feedback,
    mr.rating
FROM 
    public.mission_registrations mr
JOIN 
    public.missions m ON mr.mission_id = m.id
JOIN 
    public.associations a ON m.association_id = a.id
WHERE 
    m.date < CURRENT_DATE
    OR mr.status IN ('completed', 'cancelled');

-- missions_enriched
-- (Définition manquante dans bdd.sql, à compléter si besoin)

-- user_upcoming_missions
CREATE OR REPLACE VIEW public.user_upcoming_missions AS
SELECT 
    m.*,
    a.name AS association_name,
    a.logo_url AS association_logo,
    mr.status AS registration_status
FROM 
    public.mission_registrations mr
JOIN 
    public.missions m ON mr.mission_id = m.id
JOIN 
    public.associations a ON m.association_id = a.id
WHERE 
    m.date >= CURRENT_DATE
    AND mr.status IN ('pending', 'confirmed');

-- available_missions
CREATE OR REPLACE VIEW public.available_missions AS
SELECT 
    m.*,
    a.name AS association_name,
    a.logo_url AS association_logo
FROM 
    public.missions m
JOIN 
    public.associations a ON m.association_id = a.id
WHERE 
    m.status = 'published'
    AND m.date >= CURRENT_DATE
    AND m.spots_taken < m.spots_available;

-- Active RLS sur la table spatial_ref_sys
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Remarque :
-- Remplacez chaque SELECT * FROM ... par la définition exacte de la vue (sans SECURITY DEFINER).
-- Si vous avez besoin de retrouver la définition exacte, faites un \d+ nom_de_la_vue dans psql ou consultez vos scripts de migration.
