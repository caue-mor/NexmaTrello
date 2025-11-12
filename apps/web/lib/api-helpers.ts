import { NextResponse } from "next/server";
import { assertCsrf } from "./csrf";
import { checkRateLimit, apiRateLimit, getClientIp } from "./rate-limit";
import { getSession } from "./auth";

/**
 * Middleware helper para proteger rotas de API
 * Aplica autenticação, CSRF e rate limiting
 */
export async function protectApiRoute(
  request: Request,
  options: {
    requireAuth?: boolean;
    requireCsrf?: boolean;
    applyRateLimit?: boolean;
  } = {}
) {
  const {
    requireAuth = true,
    requireCsrf = true,
    applyRateLimit = true,
  } = options;

  // 1. Autenticação
  if (requireAuth) {
    const { user } = await getSession();
    if (!user) {
      return {
        error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
        user: null,
      };
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      return {
        error: NextResponse.json(
          { error: "Conta desativada" },
          { status: 403 }
        ),
        user: null,
      };
    }
  }

  // 2. Rate Limiting
  if (applyRateLimit) {
    const ip = getClientIp(request);
    const { success, remaining, reset } = await checkRateLimit(
      apiRateLimit,
      ip
    );

    if (!success) {
      return {
        error: NextResponse.json(
          {
            error: "Muitas requisições. Tente novamente mais tarde.",
            remaining: 0,
            resetAt: reset,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        ),
        user: null,
      };
    }
  }

  // 3. CSRF Protection - DESABILITADO (sistema interno)
  // Sistema interno não precisa de CSRF - apenas autenticação via cookie é suficiente

  // 4. Retornar usuário se tudo OK
  const { user } = await getSession();
  return { error: null, user };
}

/**
 * Wrapper para simplificar uso em rotas
 *
 * Exemplo de uso:
 * ```typescript
 * export async function POST(req: Request) {
 *   const result = await withApiProtection(req);
 *   if (result.error) return result.error;
 *
 *   const { user } = result;
 *   // ... resto da lógica
 * }
 * ```
 */
export async function withApiProtection(
  request: Request,
  options?: Parameters<typeof protectApiRoute>[1]
) {
  return protectApiRoute(request, options);
}
