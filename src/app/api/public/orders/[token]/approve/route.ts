import { httpStatusFor } from "@/http/domain-errors";
import { isPublicToken } from "@/http/public-token";
import { parseApprovalForm, requestEvidence } from "@/http/public-approval";
import {
  json,
  redirectTo,
  respondWithError,
  wantsJson,
} from "@/http/responses";
import { getWorkshop } from "@/service";
import { isDomainError } from "@/workshop/errors";

/**
 * El cliente aprueba desde su enlace. El token es la única credencial; no hay
 * sesión ni formulario con datos personales. La evidencia (IP y agente de
 * usuario) la toma el servidor, nunca el navegador.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const form = await request.formData();
  const input = parseApprovalForm(form);
  const respondJson = wantsJson(request);
  const pageUrl = `/orden/${encodeURIComponent(token)}`;

  const fail = (message: string, status: number) =>
    respondWithError(respondJson, pageUrl, message, status);

  if (!isPublicToken(token)) {
    return fail("Enlace no válido.", 404);
  }

  if ("error" in input) {
    return fail(input.error, 422);
  }

  try {
    const { approval } = await getWorkshop().approveQuote(
      token,
      input.version,
      requestEvidence(request),
    );

    if (respondJson) {
      return json(
        {
          approval: {
            id: approval.id,
            quoteVersion: approval.quoteVersion,
            totalCents: approval.totalCents,
            approvedAt: approval.approvedAt,
          },
        },
        201,
      );
    }

    return redirectTo(`${pageUrl}?aprobada=1`);
  } catch (error) {
    if (isDomainError(error)) {
      return fail(error.message, httpStatusFor(error));
    }
    throw error;
  }
}
