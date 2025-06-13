// Script de récupération pour écrans de chargement bloqués
// Ajouter ce script à index.html

(function() {
  // Configurer un délai d'expiration pour les chargements bloqués
  const LOADING_TIMEOUT = 15000; // 15 secondes
  
  window.addEventListener('DOMContentLoaded', function() {
    // Démarrer le chronomètre de récupération
    setTimeout(function() {
      // Rechercher des indicateurs de chargement bloqué
      const spinners = document.querySelectorAll('.animate-spin');
      const loadingTexts = Array.from(document.querySelectorAll('p, div'))
        .filter(el => el.textContent.toLowerCase().includes('chargement'));
      
      // Si on trouve des indicateurs de chargement et que le contenu principal n'est pas chargé
      if ((spinners.length > 0 || loadingTexts.length > 0) && 
          !document.querySelector('main, #root > div:not(.flex)')) {
        
        console.warn('Chargement bloqué détecté - tentative de récupération');
        
        // Créer et afficher une interface de récupération
        const recoveryUI = document.createElement('div');
        recoveryUI.style.position = 'fixed';
        recoveryUI.style.top = '0';
        recoveryUI.style.left = '0';
        recoveryUI.style.width = '100%';
        recoveryUI.style.height = '100%';
        recoveryUI.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        recoveryUI.style.display = 'flex';
        recoveryUI.style.flexDirection = 'column';
        recoveryUI.style.alignItems = 'center';
        recoveryUI.style.justifyContent = 'center';
        recoveryUI.style.zIndex = '9999';
        recoveryUI.style.fontFamily = 'sans-serif';
        recoveryUI.style.padding = '20px';
        recoveryUI.style.textAlign = 'center';
        
        recoveryUI.innerHTML = `
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" style="margin-bottom: 16px;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h2 style="color: #333; margin-bottom: 16px; font-size: 20px;">Problème de chargement détecté</h2>
          <p style="color: #555; margin-bottom: 24px; max-width: 500px;">
            Le chargement de la page semble bloqué. Cela peut être causé par une extension de navigateur 
            ou un problème de connexion.
          </p>
          <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 300px;">
            <button id="recovery-reload" style="background-color: #3498db; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold;">
              Actualiser la page
            </button>
            <button id="recovery-home" style="background-color: #f1f1f1; color: #333; border: 1px solid #ddd; padding: 12px; border-radius: 6px; cursor: pointer;">
              Retour à l'accueil
            </button>
          </div>
          <div style="margin-top: 24px; background-color: #f9f9f9; padding: 16px; border-radius: 6px; width: 100%; max-width: 500px;">
            <p style="color: #555; font-weight: bold; margin-bottom: 8px; font-size: 14px;">Conseils :</p>
            <ul style="color: #555; text-align: left; padding-left: 20px; font-size: 14px;">
              <li>Désactivez temporairement vos extensions de navigateur</li>
              <li>Essayez d'utiliser le mode navigation privée</li>
              <li>Videz le cache de votre navigateur</li>
            </ul>
          </div>
        `;
        
        document.body.appendChild(recoveryUI);
        
        // Ajouter des gestionnaires d'événements aux boutons
        document.getElementById('recovery-reload').addEventListener('click', function() {
          window.location.reload();
        });
        
        document.getElementById('recovery-home').addEventListener('click', function() {
          window.location.href = '/home';
        });
      }
    }, LOADING_TIMEOUT);
  });
})();
