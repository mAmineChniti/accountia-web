import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Désactiver la validation des variables d'environnement pour les tests
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.NEXT_PUBLIC_BACKEND = 'http://localhost:3000';

// Mock global pour ResizeObserver (souvent nécessaire pour les composants UI)
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
