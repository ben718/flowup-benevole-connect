import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useCategories from '../hooks/useCategories';

const LandingPage = () => {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading } = useCategories();
  const [stats, setStats] = useState({
    volunteers: 0,
    missions: 0,
    associations: 0
  });

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/home');
      }
    };
    
    console.time('checkSession');
    checkSession().catch(console.error).finally(() => console.timeEnd('checkSession'));
    console.time('fetchStats');
    fetchStats().catch(console.error).finally(() => console.timeEnd('fetchStats'));
  }, [navigate]);

  const fetchStats = async () => {
    try {
      // Récupérer le nombre de bénévoles
      const { count: volunteersCount, error: volunteersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'benevole');
      
      // Récupérer le nombre de missions
      const { count: missionsCount, error: missionsError } = await supabase
        .from('missions')
        .select('id', { count: 'exact', head: true });
      
      // Récupérer le nombre d'associations
      const { count: associationsCount, error: associationsError } = await supabase
        .from('associations')
        .select('id', { count: 'exact', head: true });
      
      if (!volunteersError && !missionsError && !associationsError) {
        setStats({
          volunteers: volunteersCount || 0,
          missions: missionsCount || 0,
          associations: associationsCount || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="bg-vs-gray-100 flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-vs-gray-800">Voisin Solidaire</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-vs-blue-primary font-medium">
              Connexion
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 pb-20">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-vs-gray-800 mb-3">
            Le bénévolat accessible à tous
          </h2>
          <p className="text-vs-gray-600 mb-6">
            Aidez près de chez vous, même pour seulement 15 minutes.
          </p>          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
            <Link
              to="/login"
              className="bg-vs-blue-primary text-white font-medium py-3 px-6 rounded-lg hover:bg-vs-blue-dark transition duration-200"
            >
              Je deviens bénévole
            </Link>
            <Link
              to="/login?type=association"
              className="bg-white border border-vs-blue-primary text-vs-blue-primary font-medium py-3 px-6 rounded-lg hover:bg-vs-blue-50 transition duration-200"
            >
              Je suis une association
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-vs-gray-800 mb-6 text-center">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="h-16 w-16 rounded-full bg-vs-blue-light flex items-center justify-center mx-auto mb-4">
                <span className="text-vs-blue-dark text-2xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-vs-gray-800 mb-2">Trouvez</h3>
              <p className="text-vs-gray-600">
                Découvrez des missions de bénévolat à moins de 15 minutes de chez vous.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="h-16 w-16 rounded-full bg-vs-green-light flex items-center justify-center mx-auto mb-4">
                <span className="text-vs-green-dark text-2xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-vs-gray-800 mb-2">Participez</h3>
              <p className="text-vs-gray-600">
                Inscrivez-vous en 2 clics et aidez pendant le temps que vous avez.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="h-16 w-16 rounded-full bg-vs-orange-light flex items-center justify-center mx-auto mb-4">
                <span className="text-vs-orange-dark text-2xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-vs-gray-800 mb-2">Impactez</h3>
              <p className="text-vs-gray-600">
                Voyez l'impact concret de votre engagement sur votre communauté.
              </p>
            </div>
          </div>
        </section>        {/* Mission Examples */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-vs-gray-800 mb-6 text-center">
            Exemples de missions
          </h2>
          <div className="space-y-4">
            {!categoriesLoading && categories.slice(0, 3).map((category, index) => (
              <div
                key={category.id}
                className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${category.color?.split(' ')[0] || 'border-vs-blue-primary'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-vs-gray-800">
                    {category.icon} {category.name}
                  </h3>
                  <span className={`${category.color || 'bg-vs-blue-100 text-vs-blue-700'} text-xs px-2 py-1 rounded-full font-medium`}>
                    {[15, 30, 45][index % 3]} min
                  </span>
                </div>
                <p className="text-sm text-vs-gray-600 mb-3">
                  {index === 0 && "Aider à distribuer des repas aux personnes sans-abri"}
                  {index === 1 && "Accompagner des personnes âgées pour une promenade"}
                  {index === 2 && "Participer à un atelier créatif avec des enfants"}
                </p>
              </div>
            ))}
            {categoriesLoading && (
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <p className="text-vs-gray-600">Chargement des exemples de missions...</p>
              </div>
            )}
          </div>
        </section>

        {/* Impact Stats */}
        <section className="mb-8 bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-vs-gray-800 mb-6 text-center">
            Notre impact collectif
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-vs-blue-primary">
                {stats.volunteers}+
              </p>
              <p className="text-sm text-vs-gray-600">Bénévoles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-vs-green-secondary">
                {stats.missions}+
              </p>
              <p className="text-sm text-vs-gray-600">Missions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-vs-orange-accent">
                {stats.associations}+
              </p>
              <p className="text-sm text-vs-gray-600">Associations</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-vs-blue-primary rounded-xl p-6 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Prêt à aider ?</h2>          <p className="text-white opacity-90 mb-6">
            Rejoignez notre communauté de bénévoles et commencez à aider près de
            chez vous dès aujourd'hui.
          </p>
          <Link
            to="/login"
            className="bg-white text-vs-blue-primary font-medium py-3 px-6 rounded-lg hover:bg-vs-gray-100 transition duration-200 inline-block"
          >
            Je m'inscris
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white p-6 border-t border-vs-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-bold text-vs-gray-800 mb-3">
                Voisin Solidaire
              </h3>
              <p className="text-sm text-vs-gray-600">
                Le bénévolat accessible à tous
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h4 className="text-sm font-semibold text-vs-gray-800 mb-3">
                  À propos
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Notre mission
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      L'équipe
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Nos partenaires
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-vs-gray-800 mb-3">
                  Ressources
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Guide du bénévole
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Blog
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-vs-gray-800 mb-3">
                  Contact
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Nous contacter
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-vs-gray-600 hover:text-vs-blue-primary">
                      Support
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-vs-gray-500">
            <p>&copy; {new Date().getFullYear()} Voisin Solidaire. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
