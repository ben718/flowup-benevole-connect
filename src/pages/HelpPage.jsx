import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';

const HelpPage = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState('volunteer');

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const FAQItem = ({ question, answer, isOpen, onToggle }) => {
    return (
      <div className="border-b border-vs-gray-200 py-4">
        <button
          className="flex justify-between items-center w-full text-left font-medium text-vs-gray-800"
          onClick={onToggle}
        >
          <span>{question}</span>
          {isOpen ? (
            <ChevronUp className="text-vs-gray-500" size={20} />
          ) : (
            <ChevronDown className="text-vs-gray-500" size={20} />
          )}
        </button>
        {isOpen && (
          <div className="mt-2 text-vs-gray-600">{answer}</div>
        )}
      </div>
    );
  };

  const volunteerFAQs = [
    {
      question: "Comment devenir bénévole ?",
      answer: "Pour devenir bénévole, il vous suffit de créer un compte sur notre plateforme, puis de rechercher des missions qui vous intéressent dans votre région. Une fois que vous avez trouvé une mission qui vous convient, vous pouvez vous y inscrire directement depuis la page de détails de la mission."
    },
    {
      question: "Combien de temps durent les missions ?",
      answer: "Les missions sur Voisin Solidaire sont des micro-missions, généralement d'une durée de 15 minutes à 2 heures. L'objectif est de permettre à chacun de s'engager selon sa disponibilité, même pour un temps court."
    },
    {
      question: "Puis-je annuler ma participation à une mission ?",
      answer: "Oui, vous pouvez annuler votre participation à une mission depuis votre page de profil ou depuis la page de détails de la mission. Cependant, nous vous encourageons à ne pas annuler à la dernière minute afin de ne pas mettre en difficulté l'association."
    },
    {
      question: "Comment sont sélectionnées les missions qui me sont proposées ?",
      answer: "Les missions vous sont proposées en fonction de votre localisation. Vous pouvez modifier le rayon de recherche dans vos paramètres pour voir plus ou moins de missions à proximité."
    },
    {
      question: "Est-ce que je peux choisir mes domaines d'intervention préférés ?",
      answer: "Oui, vous pouvez filtrer les missions par catégorie (environnement, social, éducation, etc.) pour trouver celles qui correspondent le mieux à vos centres d'intérêt."
    }
  ];

  const associationFAQs = [
    {
      question: "Comment créer un compte association ?",
      answer: "Pour créer un compte association, rendez-vous sur la page d'inscription et sélectionnez 'Association'. Vous devrez fournir des informations sur votre structure, notamment son nom et son numéro SIRET."
    },
    {
      question: "Comment créer une mission ?",
      answer: "Une fois connecté à votre compte association, rendez-vous sur votre tableau de bord et cliquez sur 'Créer une mission'. Remplissez tous les champs du formulaire en décrivant précisément la mission, sa durée, sa localisation et le nombre de bénévoles nécessaires."
    },
    {
      question: "Comment gérer les inscriptions des bénévoles ?",
      answer: "Depuis votre tableau de bord, vous pouvez voir toutes les missions que vous avez créées et le nombre de bénévoles inscrits. Vous recevez également des notifications lorsqu'un bénévole s'inscrit à l'une de vos missions."
    },
    {
      question: "Puis-je modifier une mission après sa création ?",
      answer: "Oui, vous pouvez modifier tous les détails d'une mission tant qu'aucun bénévole ne s'y est encore inscrit. Si des bénévoles sont déjà inscrits, vous pouvez toujours modifier certaines informations, mais pas la date, l'heure ou le lieu."
    },
    {
      question: "Comment contacter les bénévoles inscrits à ma mission ?",
      answer: "Vous pouvez voir la liste des bénévoles inscrits à votre mission depuis votre tableau de bord. Pour l'instant, vous ne pouvez pas les contacter directement via la plateforme, mais cette fonctionnalité sera bientôt disponible."
    }
  ];

  const platformFAQs = [
    {
      question: "Voisin Solidaire est-il gratuit ?",
      answer: "Oui, Voisin Solidaire est une plateforme entièrement gratuite, tant pour les bénévoles que pour les associations."
    },
    {
      question: "Comment sont utilisées mes données personnelles ?",
      answer: "Vos données personnelles sont utilisées uniquement dans le cadre de la plateforme Voisin Solidaire. Nous ne les partageons jamais avec des tiers. Pour en savoir plus, consultez notre politique de confidentialité."
    },
    {
      question: "Comment contacter l'équipe de Voisin Solidaire ?",
      answer: "Vous pouvez nous contacter à l'adresse email suivante : contact@voisin-solidaire.fr"
    },
    {
      question: "Comment supprimer mon compte ?",
      answer: "Pour supprimer votre compte, rendez-vous dans vos paramètres et cliquez sur 'Supprimer mon compte'. Attention, cette action est irréversible et toutes vos données seront définitivement supprimées."
    },
    {
      question: "L'application est-elle disponible sur mobile ?",
      answer: "Pour l'instant, Voisin Solidaire est disponible uniquement en version web, mais le site est parfaitement adapté aux appareils mobiles. Une application native est en cours de développement."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pb-16">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-vs-gray-100 mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-vs-gray-800">Aide & FAQ</h1>
        </div>
      </header>

      <div className="flex-1 p-4">
        {/* Category tabs */}
        <div className="flex border-b border-vs-gray-200 mb-6">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              openSection === 'volunteer'
                ? 'text-vs-blue-primary border-b-2 border-vs-blue-primary'
                : 'text-vs-gray-500 hover:text-vs-blue-primary'
            } focus:outline-none`}
            onClick={() => setOpenSection('volunteer')}
          >
            Bénévoles
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              openSection === 'association'
                ? 'text-vs-blue-primary border-b-2 border-vs-blue-primary'
                : 'text-vs-gray-500 hover:text-vs-blue-primary'
            } focus:outline-none`}
            onClick={() => setOpenSection('association')}
          >
            Associations
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              openSection === 'platform'
                ? 'text-vs-blue-primary border-b-2 border-vs-blue-primary'
                : 'text-vs-gray-500 hover:text-vs-blue-primary'
            } focus:outline-none`}
            onClick={() => setOpenSection('platform')}
          >
            Plateforme
          </button>
        </div>

        {/* FAQ items */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          {openSection === 'volunteer' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Questions fréquentes - Bénévoles</h2>
              {volunteerFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={index === 0} // First item open by default
                  onToggle={() => toggleSection(`volunteer-${index}`)}
                />
              ))}
            </>
          )}

          {openSection === 'association' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Questions fréquentes - Associations</h2>
              {associationFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={index === 0} // First item open by default
                  onToggle={() => toggleSection(`association-${index}`)}
                />
              ))}
            </>
          )}

          {openSection === 'platform' && (
            <>
              <h2 className="text-lg font-semibold mb-4">Questions fréquentes - Plateforme</h2>
              {platformFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={index === 0} // First item open by default
                  onToggle={() => toggleSection(`platform-${index}`)}
                />
              ))}
            </>
          )}
        </div>

        {/* Contact info */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3">Besoin d'aide supplémentaire ?</h2>
          <p className="text-vs-gray-600 mb-4">
            Si vous ne trouvez pas la réponse à votre question, n'hésitez pas à nous contacter :
          </p>
          <div className="bg-vs-blue-50 p-4 rounded-lg">
            <p className="font-medium text-vs-blue-dark">Email : contact@voisin-solidaire.fr</p>
            <p className="mt-1 text-vs-gray-600">Nous vous répondrons dans les plus brefs délais.</p>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default HelpPage;
