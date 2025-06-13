import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col pb-16">
      <div className="flex-1 p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-vs-blue-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <h1 className="text-2xl font-bold mb-6">Politique de confidentialité</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-gray-700">
              Chez Voisin Solidaire, nous accordons une grande importance à la protection de vos données personnelles.
              Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations
              lorsque vous utilisez notre plateforme.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Informations que nous collectons</h2>
            <p className="text-gray-700">
              Nous collectons les informations suivantes:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li><strong>Informations de profil</strong>: nom, prénom, adresse email, numéro de téléphone, adresse, photo de profil, biographie</li>
              <li><strong>Informations de localisation</strong>: adresse, code postal, coordonnées géographiques</li>
              <li><strong>Préférences</strong>: centres d'intérêt, compétences, disponibilités, langues parlées</li>
              <li><strong>Données d'utilisation</strong>: missions auxquelles vous participez, badges obtenus, messages échangés</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Utilisation des informations</h2>
            <p className="text-gray-700">
              Nous utilisons vos informations pour:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Vous permettre de créer et gérer votre compte</li>
              <li>Vous proposer des missions adaptées à votre profil et à votre localisation</li>
              <li>Faciliter la communication entre bénévoles et associations</li>
              <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
              <li>Assurer la sécurité et l'intégrité de notre plateforme</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Partage des informations</h2>
            <p className="text-gray-700">
              Nous pouvons partager certaines de vos informations avec:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Les associations proposant des missions auxquelles vous vous inscrivez</li>
              <li>Nos prestataires de services qui nous aident à exploiter notre plateforme</li>
              <li>Les autorités publiques si nous y sommes légalement obligés</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sécurité des données</h2>
            <p className="text-gray-700">
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre tout accès non autorisé,
              altération, divulgation ou destruction. Ces mesures incluent le chiffrement des données, l'accès restreint aux informations
              et des audits réguliers de nos pratiques de sécurité.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Vos droits</h2>
            <p className="text-gray-700">
              Conformément aux lois sur la protection des données, vous avez le droit:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>D'accéder à vos données personnelles</li>
              <li>De rectifier vos données si elles sont inexactes</li>
              <li>De supprimer vos données dans certaines circonstances</li>
              <li>De limiter ou de vous opposer au traitement de vos données</li>
              <li>À la portabilité de vos données</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Pour exercer ces droits, contactez-nous à l'adresse: privacy@voisin-solidaire.fr
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Conservation des données</h2>
            <p className="text-gray-700">
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités décrites dans cette politique,
              sauf si une période de conservation plus longue est requise ou permise par la loi.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Modifications de la politique</h2>
            <p className="text-gray-700">
              Nous pouvons modifier cette politique de confidentialité de temps à autre. La version la plus récente sera toujours
              disponible sur notre plateforme, avec la date de la dernière mise à jour.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
            <p className="text-gray-700">
              Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à:
              privacy@voisin-solidaire.fr
            </p>
          </section>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default PrivacyPage;
