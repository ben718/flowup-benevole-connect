import { 
  safePromise, 
  createSafeAsyncHandler, 
  safeSupabaseCall, 
  setupGlobalErrorHandlers,
  markErrorAsHandled
} from '../../lib/errorHandling.js';
import { vi } from 'vitest';

// Mock pour console.error
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('safePromise', () => {
  test('renvoie [null, data] quand la promesse est résolue', async () => {
    const mockData = { success: true };
    const mockPromise = Promise.resolve(mockData);
    
    const [error, data] = await safePromise(mockPromise, 'test');
    
    expect(error).toBeNull();
    expect(data).toEqual(mockData);
    expect(console.error).not.toHaveBeenCalled();
  });
  
  test('renvoie [error, null] quand la promesse est rejetée', async () => {
    const mockError = new Error('Test error');
    const mockPromise = Promise.reject(mockError);
    
    const [error, data] = await safePromise(mockPromise, 'test');
    
    expect(error).toEqual(mockError);
    expect(data).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Erreur lors de test:', mockError);
  });
});

describe('createSafeAsyncHandler', () => {
  test('exécute la fonction correctement et retourne le résultat', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const handler = createSafeAsyncHandler(mockFn, 'test');
    
    const result = await handler('arg1', 'arg2');
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(console.error).not.toHaveBeenCalled();
  });
  
  test('gère l\'erreur, la logge et la relance', async () => {
    const mockError = new Error('Test error');
    const mockFn = vi.fn().mockRejectedValue(mockError);
    const handler = createSafeAsyncHandler(mockFn, 'test');
    
    await expect(handler('arg1')).rejects.toThrow(mockError);
    expect(console.error).toHaveBeenCalledWith('Erreur dans test:', mockError);
  });
});

describe('safeSupabaseCall', () => {
  test('renvoie [null, data] quand la réponse Supabase est réussie', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockSupabaseResponse = { data: mockData, error: null };
    const mockPromise = Promise.resolve(mockSupabaseResponse);
    
    const [error, data] = await safeSupabaseCall(mockPromise, 'test');
    
    expect(error).toBeNull();
    expect(data).toEqual(mockData);
    expect(console.error).not.toHaveBeenCalled();
  });
  
  test('renvoie [error, null] quand il y a une erreur Supabase', async () => {
    const mockSupabaseError = { message: 'Supabase error' };
    const mockSupabaseResponse = { data: null, error: mockSupabaseError };
    const mockPromise = Promise.resolve(mockSupabaseResponse);
    
    const [error, data] = await safeSupabaseCall(mockPromise, 'test');
    
    expect(error).toEqual(mockSupabaseError);
    expect(data).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Erreur Supabase (test):', mockSupabaseError);
  });
  
  test('renvoie [error, null] quand une exception est levée', async () => {
    const mockError = new Error('Test error');
    const mockPromise = Promise.reject(mockError);
    
    const [error, data] = await safeSupabaseCall(mockPromise, 'test');
    
    expect(error).toEqual(mockError);
    expect(data).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Exception non gérée dans test:', mockError);
  });
});

describe('setupGlobalErrorHandlers', () => {
  let addEventListenerSpy;
  
  beforeEach(() => {    // Mock pour window.addEventListener
    addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {});
  });
  
  test('attache les gestionnaires d\'événements pour les erreurs non gérées', () => {
    setupGlobalErrorHandlers();
    
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
  });
    test('les gestionnaires d\'événements préviennent la propagation et logent les erreurs', () => {
    // Configuration pour capturer les gestionnaires d'événements
    let unhandledRejectionHandler;
    let errorHandler;
    
    // Mock pour capturer les fonctions de callback
    addEventListenerSpy.mockImplementation((event, handler) => {
      if (event === 'unhandledrejection') {
        unhandledRejectionHandler = handler;
      } else if (event === 'error') {
        errorHandler = handler;
      }
    });
    
    setupGlobalErrorHandlers();
    
    // Test pour le cas unhandledrejection
    const rejectionError = new Error('Unhandled rejection');
    const unhandledEvent = {
      reason: rejectionError,
      preventDefault: vi.fn()
    };
    
    if (unhandledRejectionHandler) {
      unhandledRejectionHandler(unhandledEvent);
    }
    
    expect(console.error).toHaveBeenCalledWith('Promesse non gérée:', rejectionError);
    
    // Test pour les erreurs globales avec ErrorEvent
    // Au lieu de créer un ErrorEvent réel, on crée un mock d'événement pour éviter l'erreur non gérée
    const globalError = new Error('Test global error');
    const mockErrorEvent = {
      error: globalError,
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
      message: 'Test global error',
      filename: 'test.js'
    };
    
    // Appel directement le gestionnaire au lieu de dispatcher l'événement
    if (errorHandler) {
      errorHandler(mockErrorEvent);
    }    expect(console.error).toHaveBeenCalledWith('Erreur globale:', globalError);
    expect(mockErrorEvent.preventDefault).toHaveBeenCalled();
    
    // Test avec une erreur marquée comme traitée
    const handledError = new Error('Handled error');
    handledError._handled = true;
    
    const mockHandledEvent = {
      error: handledError,
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn(),
      message: 'Handled error',
      filename: 'test.js'
    };
    
    if (errorHandler) {
      errorHandler(mockHandledEvent);
    }
    
    expect(console.error).toHaveBeenCalledWith('Erreur globale:', handledError);
    
    // Test pour les erreurs ignorées (whitelist)
    window.__ignoreErrors = ['ignored-error'];
    const ignoredError = new Error('This is an ignored-error that should be skipped');
    const ignoredEvent = {
      error: ignoredError,
      message: 'This is an ignored-error that should be skipped',
      filename: '',
      preventDefault: vi.fn(),
      stopImmediatePropagation: vi.fn()
    };
    
    if (errorHandler) {
      errorHandler(ignoredEvent);
    }
    
    expect(ignoredEvent.preventDefault).toHaveBeenCalled();
    // Nettoyage
    delete window.__ignoreErrors;
  });
});

describe('markErrorAsHandled', () => {
  test('marque une erreur comme traitée', () => {
    const error = new Error('Test error');
    const result = markErrorAsHandled(error);
    
    expect(result).toBe(error);
    expect(error._handled).toBe(true);
  });
  
  test('gère le cas où error est null ou undefined', () => {
    expect(markErrorAsHandled(null)).toBeNull();
    expect(markErrorAsHandled(undefined)).toBeUndefined();
  });
});
