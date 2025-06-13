import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-vs-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="mb-6">
          <svg 
            className="w-20 h-20 mx-auto text-vs-blue-primary" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-vs-gray-800 mb-2">Page non trouvée</h1>
        <p className="text-vs-gray-600 mb-6">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center px-4 py-2 border border-vs-blue-primary text-vs-blue-primary rounded-lg hover:bg-vs-blue-50 transition duration-200"
          >
            <ArrowLeft size={18} className="mr-2" />
            Retour à la page précédente
          </button>
          
          <Link
            to="/explore"
            className="flex items-center justify-center px-4 py-2 bg-vs-blue-primary text-white rounded-lg hover:bg-vs-blue-dark transition duration-200"
          >
            <Home size={18} className="mr-2" />
            Explorer les missions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
