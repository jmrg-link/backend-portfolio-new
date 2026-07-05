import { ClerkAuthAdapter } from '@infrastructure/external-services/clerk';

/**
 * Instancia única del adapter de autenticación que comparten los guards:
 * una sola caché de emails y un solo cliente Clerk por proceso.
 */
export const authAdapter = new ClerkAuthAdapter();
