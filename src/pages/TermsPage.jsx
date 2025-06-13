import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';

const TermsPage = () => {
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

        <h1 className="text-2xl font-bold mb-6">Conditions d'utilisation</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptation des conditions</h2>
            <p className="text-gray-700">
              En utilisant l'application Voisin Solidaire, vous acceptez d'être lié par les présentes conditions d'utilisation. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description du service</h2>
            <p className="text-gray-700">
              Voisin Solidaire est une plateforme de micro-bénévolat qui met en relation des associations et des bénévoles 
              pour des missions de courte durée. Notre objectif est de faciliter l'engagement citoyen et de soutenir les actions 
              solidaires de proximité.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. Inscription et comptes utilisateurs</h2>
            <p className="text-gray-700">
              Pour utiliser pleinement notre service, vous devez créer un compte. Vous êtes responsable de maintenir la 
              confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte.
            </p>
            <p className="text-gray-700 mt-2">
              Vous devez fournir des informations exactes, actuelles et complètes lors de votre inscription et mettre à jour 
              ces informations si nécessaire.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Responsabilités des bénévoles</h2>
            <p className="text-gray-700">
              En tant que bénévole, vous vous engagez à:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Respecter vos engagements pour les missions auxquelles vous vous inscrivez</li>
              <li>Informer l'association en cas d'empêchement dans un délai raisonnable</li>
              <li>Adopter un comportement respectueux envers les associations et les bénéficiaires</li>
              <li>Respecter la confidentialité des informations auxquelles vous pourriez avoir accès</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Responsabilités des associations</h2>
            <p className="text-gray-700">
              En tant qu'association, vous vous engagez à:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Fournir des descriptions précises et honnêtes des missions proposées</li>
              <li>Respecter les bénévoles et leur offrir un cadre sécurisé pour leur engagement</li>
              <li>Assurer la conformité de vos activités avec les lois en vigueur</li>
              <li>Vérifier que les bénévoles sont couverts par une assurance appropriée</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Limitation de responsabilité</h2>
            <p className="text-gray-700">
              Voisin Solidaire facilite la mise en relation entre associations et bénévoles mais ne peut être tenu responsable:
            </p>
            <ul className="list-disc pl-6 mt-2 text-gray-700">
              <li>Des comportements des utilisateurs sur la plateforme ou pendant les missions</li>
              <li>Des annulations ou modifications de missions par les associations</li>
              <li>Des dommages qui pourraient survenir pendant l'exécution des missions</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Modification des conditions</h2>
            <p className="text-gray-700">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications seront effectives 
              dès leur publication. Votre utilisation continue du service après toute modification constitue votre acceptation 
              des nouvelles conditions.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-gray-700">
              Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter à l'adresse: contact@voisin-solidaire.fr
            </p>
          </section>
        </div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default TermsPage;
