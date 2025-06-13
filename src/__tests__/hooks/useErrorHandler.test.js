import { renderHook } from '@testing-library/react';
import { useErrorHandler } from '../../hooks/useErrorHandler.js';
import { markErrorAsHandled } from '../../lib/errorHandling.js';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock pour useToast hook
vi.mock('../../hooks/useToast.jsx', () => ({
  __esModule: true,
  useToast: () => ({
    showToast: vi.fn()
  })
}));

// Mock pour markErrorAsHandled et handleAuthSessionExpired
vi.mock('../../lib/errorHandling.js', () => ({
  __esModule: true,
  markErrorAsHandled: vi.fn(error => error),
  handleAuthSessionExpired: vi.fn(), // Ajout du mock manquant
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderUseErrorHandler() {
    // Permet d'utiliser useNavigate dans le hook
    return renderHook(() => useErrorHandler(), { wrapper: MemoryRouter });
  }

  test("handleAPIError marque l'erreur comme traitée", () => {
    const { result } = renderUseErrorHandler();
    const mockError = new Error('Test error');
    result.current.handleAPIError(mockError);
    expect(markErrorAsHandled).toHaveBeenCalledWith(mockError);
  });

  test("handleAPIError renvoie un message d'erreur par défaut quand aucun message spécifique n'est disponible", () => {
    const { result } = renderUseErrorHandler();
    const mockError = new Error();
    const response = result.current.handleAPIError(mockError);
    expect(response).toEqual({
      error: true,
      message: "Une erreur s'est produite. Veuillez réessayer plus tard.",
      code: null
    });
  });

  test('handleAPIError utilise le message personnalisé si fourni', () => {
    const { result } = renderUseErrorHandler();
    const mockError = new Error();
    const customMessage = "Message d'erreur personnalisé";
    const response = result.current.handleAPIError(mockError, customMessage);
    
    expect(response).toEqual({
      error: true,
      message: customMessage,
      code: null
    });
  });
  test('handleAPIError gère correctement l\'erreur 401', () => {
    const { result } = renderUseErrorHandler();
    const mockError = { status: 401 };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      code: "AUTH_SESSION_EXPIRED"
    });
  });
  test('handleAPIError gère correctement l\'erreur PGRST301', () => {
    const { result } = renderUseErrorHandler();
    const mockError = { code: 'PGRST301' };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      code: "AUTH_SESSION_EXPIRED"
    });
  });
  test('handleAPIError gère correctement l\'erreur 403', () => {
    const { result } = renderUseErrorHandler();
    const mockError = { status: 403 };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
      code: "AUTH_FORBIDDEN"
    });
  });
  test('handleAPIError gère correctement l\'erreur 404', () => {
    const { result } = renderUseErrorHandler();
    const mockError = { status: 404 };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: "La ressource demandée n'a pas été trouvée.",
      code: "RESOURCE_NOT_FOUND"
    });
  });
  test('handleAPIError gère correctement l\'erreur PGRST401', () => {
    const { result } = renderUseErrorHandler();
    const mockError = { code: 'PGRST401' };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: "Erreur d'authentification. Veuillez vous reconnecter.",
      code: "AUTH_ERROR"
    });
  });
  test('handleAPIError utilise le message d\'erreur de l\'API si disponible', () => {
    const { result } = renderUseErrorHandler();
    const errorMessage = "Message d'erreur de l'API";
    const mockError = { message: errorMessage };
    
    const response = result.current.handleAPIError(mockError);
    
    expect(response).toEqual({
      error: true,
      message: errorMessage,
      code: "UNKNOWN_ERROR"  // Puisque errorCode est défini comme error.code || 'UNKNOWN_ERROR'
    });
  });
});
