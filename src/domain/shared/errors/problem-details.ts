/**
 * Cuerpo de error HTTP según RFC 9457 (Problem Details for HTTP APIs).
 *
 * @remarks
 * Único formato de error del contrato. Se sirve con content-type
 * `application/problem+json` y admite extensiones (`errors[]`, `current`…).
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
}

/**
 * Construye un ProblemDetails normalizado.
 *
 * @remarks
 * Los campos opcionales solo se incluyen si tienen valor, para cumplir
 * `exactOptionalPropertyTypes` y no serializar nulls espurios.
 */
export function problem(input: {
  status: number;
  title: string;
  detail?: string;
  instance?: string;
  extensions?: Record<string, unknown>;
}): ProblemDetails {
  return {
    type: 'about:blank',
    title: input.title,
    status: input.status,
    ...(input.detail !== undefined && { detail: input.detail }),
    ...(input.instance !== undefined && { instance: input.instance }),
    ...(input.extensions ?? {}),
  };
}
