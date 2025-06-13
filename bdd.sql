-- Script SQL pour Supabase - Voisin Solidaire
-- Base de données complète pour la plateforme de micro-bénévolat
-- Version 1.1 - Ajout de la gestion des langues parlées par les bénévoles

-- =============================================
-- CONFIGURATION INITIALE
-- =============================================

-- Extension pour la gestion des UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension pour la recherche full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extension pour la gestion géographique
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- SCHÉMA PRINCIPAL
-- =============================================

-- Table des profils utilisateurs (bénévoles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    latitude FLOAT,
    longitude FLOAT,
    max_distance INTEGER DEFAULT 15,
    availability JSON,
    interests TEXT[],
    skills TEXT[],
    languages TEXT[], -- Ajout du champ pour les langues parlées
    impact_score INTEGER DEFAULT 0,
    total_missions_completed INTEGER DEFAULT 0,
    total_hours_volunteered INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    role TEXT DEFAULT 'benevole'
);

-- Table des niveaux de langue (pour une gestion plus fine des compétences linguistiques)
CREATE TABLE public.language_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    level TEXT NOT NULL, -- 'débutant', 'intermédiaire', 'avancé', 'natif'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, language)
);

-- Table des associations
CREATE TABLE public.associations (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    siret TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    website TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    categories TEXT[] NOT NULL,
    verified BOOLEAN DEFAULT false,
    impact_score INTEGER DEFAULT 0,
    total_missions_created INTEGER DEFAULT 0,
    total_volunteers_engaged INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    notification_preferences JSONB DEFAULT '{"new_volunteer": true, "mission_reminder": true, "mission_completed": true, "platform_updates": false}'
);

-- Table des contacts d'association
CREATE TABLE public.association_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des membres d'équipe d'association
CREATE TABLE public.association_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'invited', -- invited, active, inactive
    invitation_token TEXT,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(association_id, email)
);

-- Table des missions
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- en minutes
    spots_available INTEGER NOT NULL,
    spots_taken INTEGER DEFAULT 0,
    min_age INTEGER DEFAULT 18,
    requirements TEXT[],
    skills_needed TEXT[],
    languages_needed TEXT[], -- Ajout du champ pour les langues requises
    materials_provided TEXT[],
    materials_to_bring TEXT[],
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published, completed, cancelled
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern JSONB,
    impact_description TEXT,
    impact_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des inscriptions aux missions
CREATE TABLE public.mission_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    confirmation_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    cancellation_date TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    feedback TEXT,
    rating INTEGER,
    hours_logged INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(mission_id, user_id)
);

-- Table des badges
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    category TEXT NOT NULL,
    requirements JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des badges obtenus par les utilisateurs
CREATE TABLE public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Table des notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des messages
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des conversations
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(participant1_id, participant2_id)
);

-- Table des rapports d'impact
CREATE TABLE public.impact_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_missions INTEGER NOT NULL,
    completed_missions INTEGER NOT NULL,
    total_volunteers INTEGER NOT NULL,
    total_hours INTEGER NOT NULL,
    impact_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- INDEX
-- =============================================

-- Index pour la recherche géographique
CREATE INDEX missions_location_idx ON public.missions USING gist (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE INDEX profiles_location_idx ON public.profiles USING gist (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE INDEX associations_location_idx ON public.associations USING gist (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Index pour la recherche textuelle
CREATE INDEX missions_title_idx ON public.missions USING gin (title gin_trgm_ops);
CREATE INDEX missions_description_idx ON public.missions USING gin (description gin_trgm_ops);
CREATE INDEX missions_category_idx ON public.missions(category);
CREATE INDEX missions_city_idx ON public.missions(city);
CREATE INDEX missions_status_idx ON public.missions(status);
CREATE INDEX missions_date_idx ON public.missions(date);

-- Index pour les relations
CREATE INDEX mission_registrations_mission_idx ON public.mission_registrations(mission_id);
CREATE INDEX mission_registrations_user_idx ON public.mission_registrations(user_id);
CREATE INDEX mission_registrations_status_idx ON public.mission_registrations(status);

-- Index pour les langues
CREATE INDEX profiles_languages_idx ON public.profiles USING gin (languages);
CREATE INDEX missions_languages_needed_idx ON public.missions USING gin (languages_needed);
CREATE INDEX language_levels_user_idx ON public.language_levels(user_id);
CREATE INDEX language_levels_language_idx ON public.language_levels(language);

-- =============================================
-- FONCTIONS ET TRIGGERS
-- =============================================

-- Fonction pour mettre à jour le timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les langues entre language_levels et profiles
CREATE OR REPLACE FUNCTION sync_languages_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le tableau de langues dans le profil
    UPDATE public.profiles
    SET languages = (
        SELECT array_agg(language)
        FROM public.language_levels
        WHERE user_id = NEW.user_id
    )
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter le nombre de places prises
CREATE OR REPLACE FUNCTION increment_spots_taken()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.missions
    SET spots_taken = spots_taken + 1
    WHERE id = NEW.mission_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour décrémenter le nombre de places prises
CREATE OR REPLACE FUNCTION decrement_spots_taken()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.missions
    SET spots_taken = spots_taken - 1
    WHERE id = OLD.mission_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour décrémenter les places prises (utilisée lors des annulations)
CREATE OR REPLACE FUNCTION decrement_spots_taken(mission_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.missions
    SET spots_taken = GREATEST(spots_taken - 1, 0)
    WHERE id = mission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour les statistiques utilisateur après une mission
CREATE OR REPLACE FUNCTION update_user_stats_after_mission()
RETURNS TRIGGER AS $$
DECLARE
    mission_duration INTEGER;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Récupérer la durée de la mission
        SELECT duration INTO mission_duration FROM public.missions WHERE id = NEW.mission_id;
        
        -- Mettre à jour les statistiques de l'utilisateur
        UPDATE public.profiles
        SET 
            total_missions_completed = total_missions_completed + 1,
            total_hours_volunteered = total_hours_volunteered + (mission_duration / 60),
            impact_score = impact_score + 10
        WHERE id = NEW.user_id;
        
        -- Mettre à jour les statistiques de l'association
        UPDATE public.associations
        SET 
            total_volunteers_engaged = total_volunteers_engaged + 1,
            impact_score = impact_score + 10
        FROM public.missions
        WHERE public.missions.id = NEW.mission_id AND public.associations.id = public.missions.association_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_related_entity_type TEXT DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_entity_type,
        related_entity_id
    ) VALUES (
        p_user_id,
        p_title,
        p_message,
        p_type,
        p_related_entity_type,
        p_related_entity_id
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour notifier l'association d'une nouvelle inscription
CREATE OR REPLACE FUNCTION notify_association_of_registration()
RETURNS TRIGGER AS $$
DECLARE
    mission_title TEXT;
    association_id UUID;
    volunteer_name TEXT;
BEGIN
    -- Récupérer les informations nécessaires
    SELECT m.title, m.association_id INTO mission_title, association_id
    FROM public.missions m
    WHERE m.id = NEW.mission_id;
    
    SELECT CONCAT(p.first_name, ' ', p.last_name) INTO volunteer_name
    FROM public.profiles p
    WHERE p.id = NEW.user_id;
    
    -- Vérifier les préférences de notification de l'association
    IF EXISTS (
        SELECT 1 FROM public.associations a
        WHERE a.id = association_id
        AND (a.notification_preferences->>'new_volunteer')::boolean = true
    ) THEN
        -- Créer la notification
        PERFORM create_notification(
            association_id,
            'Nouvelle inscription',
            CONCAT('', volunteer_name, ' s''est inscrit(e) à votre mission "', mission_title, '".'),
            'registration',
            'mission',
            NEW.mission_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des langues à un profil utilisateur
CREATE OR REPLACE FUNCTION add_languages_to_user_profile(
    user_id UUID,
    languages_str TEXT
)
RETURNS void AS $$
DECLARE
    lang_array TEXT[];
    lang TEXT;
BEGIN
    -- Convertir la chaîne de langues en tableau
    lang_array := string_to_array(languages_str, ',');
    
    -- Parcourir le tableau et ajouter chaque langue
    FOREACH lang IN ARRAY lang_array
    LOOP
        INSERT INTO public.language_levels (
            user_id,
            language,
            level,
            is_primary
        ) VALUES (
            user_id,
            lang,
            'intermédiaire',
            lang = lang_array[1]
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp 'updated_at' sur les tables principales
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_associations_updated_at
BEFORE UPDATE ON public.associations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_registrations_updated_at
BEFORE UPDATE ON public.mission_registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_levels_updated_at
BEFORE UPDATE ON public.language_levels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour synchroniser les langues après ajout/modification/suppression
CREATE TRIGGER sync_languages_after_insert
AFTER INSERT ON public.language_levels
FOR EACH ROW EXECUTE FUNCTION sync_languages_to_profile();

CREATE TRIGGER sync_languages_after_update
AFTER UPDATE ON public.language_levels
FOR EACH ROW EXECUTE FUNCTION sync_languages_to_profile();

CREATE TRIGGER sync_languages_after_delete
AFTER DELETE ON public.language_levels
FOR EACH ROW EXECUTE FUNCTION sync_languages_to_profile();

-- Trigger pour incrémenter le nombre de places prises lors d'une inscription
CREATE TRIGGER increment_mission_spots_taken
AFTER INSERT ON public.mission_registrations
FOR EACH ROW EXECUTE FUNCTION increment_spots_taken();

-- Trigger pour décrémenter le nombre de places prises lors d'une annulation
CREATE TRIGGER decrement_mission_spots_taken
AFTER DELETE ON public.mission_registrations
FOR EACH ROW EXECUTE FUNCTION decrement_spots_taken();

-- Trigger pour mettre à jour les statistiques utilisateur après une mission
CREATE TRIGGER update_stats_after_mission_completion
AFTER UPDATE ON public.mission_registrations
FOR EACH ROW EXECUTE FUNCTION update_user_stats_after_mission();

-- Trigger pour notifier l'association d'une nouvelle inscription
CREATE TRIGGER notify_association_of_new_registration
AFTER INSERT ON public.mission_registrations
FOR EACH ROW EXECUTE FUNCTION notify_association_of_registration();

-- =============================================
-- VUES
-- =============================================

-- Vue des missions disponibles
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

-- Vue des missions à venir pour un utilisateur
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

-- Vue des missions passées pour un utilisateur
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

-- Vue des bénévoles avec leurs langues
CREATE OR REPLACE VIEW public.volunteers_with_languages AS
SELECT 
    p.*,
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

-- Vue des missions avec correspondance linguistique
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

-- =============================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_levels ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Les utilisateurs peuvent voir tous les profils" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent supprimer leur propre profil" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);

-- Politiques pour language_levels
CREATE POLICY "Les utilisateurs peuvent voir toutes les compétences linguistiques" 
ON public.language_levels FOR SELECT 
USING (true);

CREATE POLICY "Les utilisateurs peuvent ajouter des compétences linguistiques à leur profil" 
ON public.language_levels FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent modifier leurs compétences linguistiques" 
ON public.language_levels FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs compétences linguistiques" 
ON public.language_levels FOR DELETE 
USING (user_id = auth.uid());

-- Politiques pour associations
CREATE POLICY "Tout le monde peut voir les associations" 
ON public.associations FOR SELECT 
USING (true);

CREATE POLICY "Les associations peuvent modifier leur propre profil" 
ON public.associations FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Les associations peuvent supprimer leur propre profil" 
ON public.associations FOR DELETE 
USING (auth.uid() = id);

-- Politiques pour association_contacts
CREATE POLICY "Les associations peuvent voir leurs contacts" 
ON public.association_contacts FOR SELECT 
USING (association_id = auth.uid());

CREATE POLICY "Les associations peuvent ajouter des contacts" 
ON public.association_contacts FOR INSERT 
WITH CHECK (association_id = auth.uid());

CREATE POLICY "Les associations peuvent modifier leurs contacts" 
ON public.association_contacts FOR UPDATE 
USING (association_id = auth.uid());

CREATE POLICY "Les associations peuvent supprimer leurs contacts" 
ON public.association_contacts FOR DELETE 
USING (association_id = auth.uid());

-- Politiques pour association_members
CREATE POLICY "Les associations peuvent voir leurs membres" 
ON public.association_members FOR SELECT 
USING (association_id = auth.uid());

CREATE POLICY "Les associations peuvent ajouter des membres" 
ON public.association_members FOR INSERT 
WITH CHECK (association_id = auth.uid());

CREATE POLICY "Les associations peuvent modifier leurs membres" 
ON public.association_members FOR UPDATE 
USING (association_id = auth.uid());

CREATE POLICY "Les associations peuvent supprimer leurs membres" 
ON public.association_members FOR DELETE 
USING (association_id = auth.uid());

-- Politiques pour missions
CREATE POLICY "Tout le monde peut voir les missions publiées" 
ON public.missions FOR SELECT 
USING (status = 'published' OR association_id = auth.uid());

CREATE POLICY "Les associations peuvent ajouter des missions" 
ON public.missions FOR INSERT 
WITH CHECK (association_id = auth.uid());

CREATE POLICY "Les associations peuvent modifier leurs missions" 
ON public.missions FOR UPDATE 
USING (association_id = auth.uid());

CREATE POLICY "Les associations peuvent supprimer leurs missions" 
ON public.missions FOR DELETE 
USING (association_id = auth.uid());

-- Politiques pour mission_registrations
CREATE POLICY "Les utilisateurs peuvent voir leurs inscriptions" 
ON public.mission_registrations FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.missions m
    WHERE m.id = mission_id AND m.association_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent s'inscrire aux missions" 
ON public.mission_registrations FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent modifier leurs inscriptions" 
ON public.mission_registrations FOR UPDATE 
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.missions m
    WHERE m.id = mission_id AND m.association_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent annuler leurs inscriptions" 
ON public.mission_registrations FOR DELETE 
USING (user_id = auth.uid());

-- Politiques pour badges
CREATE POLICY "Tout le monde peut voir les badges" 
ON public.badges FOR SELECT 
USING (true);

-- Politiques pour user_badges
CREATE POLICY "Les utilisateurs peuvent voir leurs badges" 
ON public.user_badges FOR SELECT 
USING (user_id = auth.uid() OR true);

-- Politiques pour notifications
CREATE POLICY "Les utilisateurs peuvent voir leurs notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent modifier leurs notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent supprimer leurs notifications" 
ON public.notifications FOR DELETE 
USING (user_id = auth.uid());

-- Politiques pour messages
CREATE POLICY "Les utilisateurs peuvent voir leurs messages" 
ON public.messages FOR SELECT 
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Les utilisateurs peuvent envoyer des messages" 
ON public.messages FOR INSERT 
WITH CHECK (sender_id = auth.uid());

-- Politiques pour conversations
CREATE POLICY "Les utilisateurs peuvent voir leurs conversations" 
ON public.conversations FOR SELECT 
USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

-- Politiques pour impact_reports
CREATE POLICY "Les associations peuvent voir leurs rapports d'impact" 
ON public.impact_reports FOR SELECT 
USING (association_id = auth.uid());

-- =============================================
-- DONNÉES INITIALES (BADGES)
-- =============================================

-- Insertion des badges de base
INSERT INTO public.badges (name, description, icon_url, category, requirements) VALUES
('Premier pas', 'Participez à votre première mission', '/badges/first_mission.svg', 'engagement', '{"missions_completed": 1}'),
('Bénévole régulier', 'Participez à 5 missions', '/badges/regular.svg', 'engagement', '{"missions_completed": 5}'),
('Super bénévole', 'Participez à 10 missions', '/badges/super.svg', 'engagement', '{"missions_completed": 10}'),
('Héros local', 'Participez à 25 missions', '/badges/hero.svg', 'engagement', '{"missions_completed": 25}'),
('Explorateur', 'Participez à des missions dans 3 catégories différentes', '/badges/explorer.svg', 'diversité', '{"categories": 3}'),
('Polyvalent', 'Participez à des missions dans 5 catégories différentes', '/badges/versatile.svg', 'diversité', '{"categories": 5}'),
('Fidèle', 'Participez à 3 missions avec la même association', '/badges/loyal.svg', 'fidélité', '{"same_association": 3}'),
('Ambassadeur', 'Invitez 3 amis qui participent à une mission', '/badges/ambassador.svg', 'communauté', '{"referrals": 3}'),
('Polyglotte', 'Parlez au moins 3 langues différentes', '/badges/polyglot.svg', 'compétences', '{"languages": 3}');

-- Insertion des badges de langue
INSERT INTO public.badges (name, description, icon_url, category, requirements) VALUES
('Francophone', 'Parlez français couramment', '/badges/french.svg', 'langues', '{"language": "français"}'),
('Anglophone', 'Parlez anglais couramment', '/badges/english.svg', 'langues', '{"language": "anglais"}'),
('Hispanophone', 'Parlez espagnol couramment', '/badges/spanish.svg', 'langues', '{"language": "espagnol"}');

-- =============================================
-- FONCTIONS RPC PUBLIQUES
-- =============================================

-- Fonction pour rechercher des missions à proximité
CREATE OR REPLACE FUNCTION search_nearby_missions(
    p_latitude FLOAT,
    p_longitude FLOAT,
    p_distance INTEGER DEFAULT 15,
    p_category TEXT DEFAULT NULL,
    p_date_start DATE DEFAULT CURRENT_DATE,
    p_date_end DATE DEFAULT NULL,
    p_duration_max INTEGER DEFAULT NULL,
    p_language TEXT DEFAULT NULL
)
RETURNS SETOF public.missions AS $$
BEGIN
    RETURN QUERY
    SELECT m.*
    FROM public.missions m
    WHERE m.status = 'published'
      AND m.date >= p_date_start
      AND (p_date_end IS NULL OR m.date <= p_date_end)
      AND (p_category IS NULL OR m.category = p_category)
      AND (p_duration_max IS NULL OR m.duration <= p_duration_max)
      AND (p_language IS NULL OR p_language = ANY(m.languages_needed) OR m.languages_needed IS NULL OR m.languages_needed = '{}'::text[])
      AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326),
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
          p_distance * 1000  -- Conversion en mètres
      )
      AND m.spots_taken < m.spots_available
    ORDER BY 
      ST_Distance(
          ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326),
          ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
      ),
      m.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour s'inscrire à une mission
CREATE OR REPLACE FUNCTION register_for_mission(
    p_mission_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_spots_available INTEGER;
    v_spots_taken INTEGER;
BEGIN
    -- Vérifier si l'utilisateur est déjà inscrit
    IF EXISTS (
        SELECT 1 FROM public.mission_registrations
        WHERE mission_id = p_mission_id AND user_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Vérifier s'il reste des places disponibles
    SELECT spots_available, spots_taken INTO v_spots_available, v_spots_taken
    FROM public.missions
    WHERE id = p_mission_id;
    
    IF v_spots_taken >= v_spots_available THEN
        RETURN false;
    END IF;
    
    -- Créer l'inscription
    INSERT INTO public.mission_registrations (
        mission_id,
        user_id,
        status
    ) VALUES (
        p_mission_id,
        auth.uid(),
        'pending'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour annuler une inscription
CREATE OR REPLACE FUNCTION cancel_mission_registration(
    p_mission_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'utilisateur est inscrit
    IF NOT EXISTS (
        SELECT 1 FROM public.mission_registrations
        WHERE mission_id = p_mission_id AND user_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Mettre à jour l'inscription
    UPDATE public.mission_registrations
    SET 
        status = 'cancelled',
        cancellation_date = now(),
        cancellation_reason = p_reason
    WHERE 
        mission_id = p_mission_id 
        AND user_id = auth.uid();
    
    -- Décrémenter le nombre de places prises
    PERFORM decrement_spots_taken(p_mission_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour confirmer un bénévole
CREATE OR REPLACE FUNCTION confirm_volunteer(
    p_mission_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'association est propriétaire de la mission
    IF NOT EXISTS (
        SELECT 1 FROM public.missions
        WHERE id = p_mission_id AND association_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Vérifier si le bénévole est inscrit
    IF NOT EXISTS (
        SELECT 1 FROM public.mission_registrations
        WHERE mission_id = p_mission_id AND user_id = p_user_id
    ) THEN
        RETURN false;
    END IF;
    
    -- Mettre à jour l'inscription
    UPDATE public.mission_registrations
    SET 
        status = 'confirmed',
        confirmation_date = now()
    WHERE 
        mission_id = p_mission_id 
        AND user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer une mission comme terminée
CREATE OR REPLACE FUNCTION complete_mission(
    p_mission_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'association est propriétaire de la mission
    IF NOT EXISTS (
        SELECT 1 FROM public.missions
        WHERE id = p_mission_id AND association_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Mettre à jour la mission
    UPDATE public.missions
    SET status = 'completed'
    WHERE id = p_mission_id;
    
    -- Mettre à jour les inscriptions
    UPDATE public.mission_registrations
    SET 
        status = 'completed',
        completion_date = now()
    WHERE 
        mission_id = p_mission_id 
        AND status = 'confirmed';
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour laisser un feedback sur une mission
CREATE OR REPLACE FUNCTION leave_mission_feedback(
    p_mission_id UUID,
    p_feedback TEXT,
    p_rating INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si l'utilisateur a participé à la mission
    IF NOT EXISTS (
        SELECT 1 FROM public.mission_registrations
        WHERE mission_id = p_mission_id AND user_id = auth.uid()
    ) THEN
        RETURN false;
    END IF;
    
    -- Mettre à jour le feedback
    UPDATE public.mission_registrations
    SET 
        feedback = p_feedback,
        rating = p_rating
    WHERE 
        mission_id = p_mission_id 
        AND user_id = auth.uid();
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter une langue au profil
CREATE OR REPLACE FUNCTION add_language_to_profile(
    p_language TEXT,
    p_level TEXT,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si la langue existe déjà
    IF EXISTS (
        SELECT 1 FROM public.language_levels
        WHERE user_id = auth.uid() AND language = p_language
    ) THEN
        -- Mettre à jour le niveau
        UPDATE public.language_levels
        SET 
            level = p_level,
            is_primary = p_is_primary,
            updated_at = now()
        WHERE 
            user_id = auth.uid() 
            AND language = p_language;
    ELSE
        -- Ajouter la nouvelle langue
        INSERT INTO public.language_levels (
            user_id,
            language,
            level,
            is_primary
        ) VALUES (
            auth.uid(),
            p_language,
            p_level,
            p_is_primary
        );
        
        -- Si c'est la langue principale, mettre à jour les autres
        IF p_is_primary THEN
            UPDATE public.language_levels
            SET is_primary = false
            WHERE 
                user_id = auth.uid() 
                AND language != p_language;
        END IF;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer une langue du profil
CREATE OR REPLACE FUNCTION remove_language_from_profile(
    p_language TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Supprimer la langue
    DELETE FROM public.language_levels
    WHERE 
        user_id = auth.uid() 
        AND language = p_language;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour rechercher des bénévoles par langue
CREATE OR REPLACE FUNCTION search_volunteers_by_language(
    p_language TEXT
)
RETURNS SETOF public.profiles AS $$
BEGIN
    RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    WHERE p.role = 'benevole'
      AND p_language = ANY(p.languages);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS POUR SUPABASE AUTH
-- =============================================

-- Fonction pour créer un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_metadata JSONB;
    languages_str TEXT;
BEGIN
    user_metadata := NEW.raw_user_meta_data;
    
    -- Déterminer le rôle de l'utilisateur
    IF user_metadata->>'role' = 'association' THEN
        user_role := 'association';
        
        -- Créer un profil d'association
        INSERT INTO public.associations (
            id,
            name,
            siret,
            description,
            address,
            city,
            postal_code,
            phone,
            email,
            categories
        ) VALUES (
            NEW.id,
            user_metadata->>'associationName',
            user_metadata->>'siret',
            user_metadata->>'description',
            user_metadata->>'address',
            user_metadata->>'city',
            user_metadata->>'postalCode',
            user_metadata->>'phone',
            NEW.email,
            ARRAY[user_metadata->>'category']
        );
        
        -- Créer un contact principal
        INSERT INTO public.association_contacts (
            association_id,
            name,
            role,
            email,
            phone,
            is_primary
        ) VALUES (
            NEW.id,
            user_metadata->>'contactName',
            user_metadata->>'contactRole',
            user_metadata->>'contactEmail' || NEW.email,
            user_metadata->>'phone',
            true
        );
    ELSE
        user_role := 'benevole';
        languages_str := user_metadata->>'languages';
        
        -- Créer un profil de bénévole
        INSERT INTO public.profiles (
            id,
            first_name,
            last_name,
            email,
            role,
            languages
        ) VALUES (
            NEW.id,
            user_metadata->>'firstName',
            user_metadata->>'lastName',
            NEW.email,
            user_role,
            CASE 
                WHEN languages_str IS NOT NULL 
                THEN string_to_array(languages_str, ',')
                ELSE NULL
            END
        );
        
        -- Ajouter les langues si spécifiées
        IF languages_str IS NOT NULL THEN
            PERFORM add_languages_to_user_profile(NEW.id, languages_str);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer un profil après inscription
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- COMMENTAIRES FINAUX
-- =============================================

COMMENT ON DATABASE postgres IS 'Base de données Voisin Solidaire - Plateforme de micro-bénévolat';

COMMENT ON TABLE public.profiles IS 'Profils des bénévoles';
COMMENT ON TABLE public.associations IS 'Profils des associations';
COMMENT ON TABLE public.missions IS 'Missions de bénévolat proposées par les associations';
COMMENT ON TABLE public.mission_registrations IS 'Inscriptions des bénévoles aux missions';
COMMENT ON TABLE public.badges IS 'Badges que les bénévoles peuvent obtenir';
COMMENT ON TABLE public.user_badges IS 'Badges obtenus par les bénévoles';
COMMENT ON TABLE public.notifications IS 'Notifications envoyées aux utilisateurs';
COMMENT ON TABLE public.messages IS 'Messages échangés entre utilisateurs';
COMMENT ON TABLE public.conversations IS 'Conversations entre utilisateurs';
COMMENT ON TABLE public.impact_reports IS 'Rapports d''impact des associations';
COMMENT ON TABLE public.language_levels IS 'Niveaux de langue des bénévoles';

-- =============================================
-- SCRIPT DE MIGRATION (POUR MISE À JOUR)
-- =============================================

-- Fonction pour vérifier et ajouter la colonne languages à la table profiles
CREATE OR REPLACE FUNCTION add_languages_column_to_profiles()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'languages'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN languages TEXT[];
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et ajouter la colonne languages_needed à la table missions
CREATE OR REPLACE FUNCTION add_languages_needed_column_to_missions()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'missions'
        AND column_name = 'languages_needed'
    ) THEN
        ALTER TABLE public.missions ADD COLUMN languages_needed TEXT[];
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer la table language_levels si elle n'existe pas
CREATE OR REPLACE FUNCTION create_language_levels_table()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'language_levels'
    ) THEN
        -- Créer la table language_levels
        CREATE TABLE public.language_levels (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            language TEXT NOT NULL,
            level TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, language)
        );
        
        -- Créer les index
        CREATE INDEX language_levels_user_idx ON public.language_levels(user_id);
        CREATE INDEX language_levels_language_idx ON public.language_levels(language);
        
        -- Activer RLS
        ALTER TABLE public.language_levels ENABLE ROW LEVEL SECURITY;
        
        -- Ajouter les politiques RLS
        CREATE POLICY "Les utilisateurs peuvent voir toutes les compétences linguistiques" 
        ON public.language_levels FOR SELECT 
        USING (true);

        CREATE POLICY "Les utilisateurs peuvent ajouter des compétences linguistiques à leur profil" 
        ON public.language_levels FOR INSERT 
        WITH CHECK (user_id = auth.uid());

        CREATE POLICY "Les utilisateurs peuvent modifier leurs compétences linguistiques" 
        ON public.language_levels FOR UPDATE 
        USING (user_id = auth.uid());

        CREATE POLICY "Les utilisateurs peuvent supprimer leurs compétences linguistiques" 
        ON public.language_levels FOR DELETE 
        USING (user_id = auth.uid());
        
        -- Créer le trigger pour mettre à jour le timestamp
        CREATE TRIGGER update_language_levels_updated_at
        BEFORE UPDATE ON public.language_levels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter les badges de langue s'ils n'existent pas
CREATE OR REPLACE FUNCTION add_language_badges()
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.badges WHERE name = 'Polyglotte'
    ) THEN
        INSERT INTO public.badges (name, description, icon_url, category, requirements) VALUES
        ('Polyglotte', 'Parlez au moins 3 langues différentes', '/badges/polyglot.svg', 'compétences', '{"languages": 3}');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM public.badges WHERE name = 'Francophone'
    ) THEN
        INSERT INTO public.badges (name, description, icon_url, category, requirements) VALUES
        ('Francophone', 'Parlez français couramment', '/badges/french.svg', 'langues', '{"language": "français"}'),
        ('Anglophone', 'Parlez anglais couramment', '/badges/english.svg', 'langues', '{"language": "anglais"}'),
        ('Hispanophone', 'Parlez espagnol couramment', '/badges/spanish.svg', 'langues', '{"language": "espagnol"}');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter les fonctions de migration
SELECT add_languages_column_to_profiles();
SELECT add_languages_needed_column_to_missions();
SELECT create_language_levels_table();
SELECT add_language_badges();

-- Supprimer les fonctions de migration après utilisation
DROP FUNCTION IF EXISTS add_languages_column_to_profiles();
DROP FUNCTION IF EXISTS add_languages_needed_column_to_missions();
DROP FUNCTION IF EXISTS create_language_levels_table();
DROP FUNCTION IF EXISTS add_language_badges();



-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories if they don't exist
INSERT INTO categories (name, icon, color, description) VALUES
  ('Alimentaire', '🍽️', 'bg-orange-100 text-orange-700', 'Missions liées à la distribution alimentaire et aux repas'),
  ('Social', '😊', 'bg-green-100 text-green-700', 'Missions d''accompagnement et de soutien social'),
  ('Environnement', '🌱', 'bg-emerald-100 text-emerald-700', 'Missions de protection de l''environnement et de développement durable'),
  ('Éducation', '📚', 'bg-purple-100 text-purple-700', 'Missions de soutien scolaire et d''éducation'),
  ('Santé', '🏥', 'bg-red-100 text-red-700', 'Missions liées à la santé et au bien-être'),
  ('Culture', '🎨', 'bg-blue-100 text-blue-700', 'Missions culturelles et artistiques'),
  ('Sport', '⚽', 'bg-yellow-100 text-yellow-700', 'Missions sportives et activités physiques')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are insertable by authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');
