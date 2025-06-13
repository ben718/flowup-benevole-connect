# Politiques RLS pour Supabase - Voisin Solidaire

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLITIQUES POUR LA TABLE PROFILES
-- =============================================

-- Lecture : utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Mise à jour : utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Insertion : création automatique lors de l'inscription
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- POLITIQUES POUR LA TABLE ASSOCIATIONS
-- =============================================

-- Lecture : toutes les associations vérifiées sont visibles
CREATE POLICY "Anyone can view verified associations" ON associations
FOR SELECT USING (verified = true);

-- Lecture : associations peuvent voir leur propre profil
CREATE POLICY "Associations can view own profile" ON associations
FOR SELECT USING (auth.uid() = id);

-- Mise à jour : associations peuvent modifier leur propre profil
CREATE POLICY "Associations can update own profile" ON associations
FOR UPDATE USING (auth.uid() = id);

-- Insertion : création automatique lors de l'inscription
CREATE POLICY "Associations can insert own profile" ON associations
FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- POLITIQUES POUR LA TABLE MISSIONS
-- =============================================

-- Lecture : toutes les missions publiées sont visibles
CREATE POLICY "Anyone can view published missions" ON missions
FOR SELECT USING (status = 'published');

-- Insertion : seules les associations peuvent créer des missions
CREATE POLICY "Associations can create missions" ON missions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM associations 
    WHERE id = auth.uid()
  )
);

-- Mise à jour : associations peuvent modifier leurs propres missions
CREATE POLICY "Associations can update own missions" ON missions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM associations 
    WHERE id = auth.uid() AND id = association_id
  )
);

-- Suppression : associations peuvent supprimer leurs propres missions
CREATE POLICY "Associations can delete own missions" ON missions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM associations 
    WHERE id = auth.uid() AND id = association_id
  )
);

-- =============================================
-- POLITIQUES POUR LA TABLE MISSION_REGISTRATIONS
-- =============================================

-- Lecture : utilisateurs voient leurs propres inscriptions
CREATE POLICY "Users can view own registrations" ON mission_registrations
FOR SELECT USING (auth.uid() = user_id);

-- Lecture : associations voient les inscriptions à leurs missions
CREATE POLICY "Associations can view registrations to their missions" ON mission_registrations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM missions 
    WHERE id = mission_id AND association_id = auth.uid()
  )
);

-- Insertion : utilisateurs peuvent s'inscrire aux missions
CREATE POLICY "Users can register for missions" ON mission_registrations
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'benevole'
  )
);

-- Mise à jour : utilisateurs peuvent modifier leurs inscriptions
CREATE POLICY "Users can update own registrations" ON mission_registrations
FOR UPDATE USING (auth.uid() = user_id);

-- Mise à jour : associations peuvent modifier les inscriptions à leurs missions
CREATE POLICY "Associations can update registrations to their missions" ON mission_registrations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM missions 
    WHERE id = mission_id AND association_id = auth.uid()
  )
);

-- Suppression : utilisateurs peuvent annuler leurs inscriptions
CREATE POLICY "Users can cancel own registrations" ON mission_registrations
FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- POLITIQUES POUR LA TABLE NOTIFICATIONS
-- =============================================

-- Lecture : utilisateurs voient leurs propres notifications
CREATE POLICY "Users can view own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- Insertion : système peut créer des notifications
CREATE POLICY "System can create notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- Mise à jour : utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Suppression : utilisateurs peuvent supprimer leurs notifications
CREATE POLICY "Users can delete own notifications" ON notifications
FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- POLITIQUES POUR LA TABLE MESSAGES
-- =============================================

-- Lecture : utilisateurs voient les messages qu'ils ont envoyés ou reçus
CREATE POLICY "Users can view own messages" ON messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Insertion : utilisateurs peuvent envoyer des messages
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Mise à jour : destinataires peuvent marquer les messages comme lus
CREATE POLICY "Recipients can update message status" ON messages
FOR UPDATE USING (auth.uid() = recipient_id);

-- =============================================
-- POLITIQUES POUR LA TABLE USER_BADGES
-- =============================================

-- Lecture : utilisateurs voient leurs propres badges
CREATE POLICY "Users can view own badges" ON user_badges
FOR SELECT USING (auth.uid() = user_id);

-- Insertion : système peut attribuer des badges
CREATE POLICY "System can award badges" ON user_badges
FOR INSERT WITH CHECK (true);

-- =============================================
-- FONCTIONS RPC PUBLIQUES
-- =============================================

-- Fonction pour incrémenter les places prises
CREATE OR REPLACE FUNCTION increment_spots_taken(mission_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE missions
  SET spots_taken = spots_taken + 1
  WHERE id = mission_id;
END;
$$;

-- Fonction pour décrémenter les places prises
CREATE OR REPLACE FUNCTION decrement_spots_taken(mission_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE missions
  SET spots_taken = GREATEST(0, spots_taken - 1)
  WHERE id = mission_id;
END;
$$;

-- Fonction pour créer des notifications
CREATE OR REPLACE FUNCTION create_notification(
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  related_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (user_id, type, title, message, related_id);
END;
$$;

-- Attribution des permissions
GRANT EXECUTE ON FUNCTION increment_spots_taken(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_spots_taken(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;

