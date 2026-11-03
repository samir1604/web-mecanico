import { sessionFromRequest } from "@/auth/session";
import { httpStatusFor } from "@/http/domain-errors";
import {
  json,
  redirectTo,
  respondWithError,
  unauthorized,
  wantsJson,
} from "@/http/responses";
import { parseStatusChange } from "@/http/status-form";
import { getWorkshop } from "@/service";
import { isDomainError } from "@/workshop/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folio: string }> },
) {
  if (!sessionFromRequest(request)) return unauthorized();

  const { folio } = await params;
  const form = await request.formData();
  const input = parseStatusChange(form);
  const respondJson = wantsJson(request);
  const detailUrl = `/ordenes/${encodeURIComponent(folio)}`;

  const fail = (message: string, status: number) =>
    respondWithError(respondJson, detailUrl, message, status);

  if ("error" in input) {
    return fail(input.error, 422);
  }

  try {
    const order = await getWorkshop().changeStatus(
      folio,
      input.status,
      input.note,
      { correction: input.correction },
    );

    if (respondJson) return json({ order });

    return redirectTo(`${detailUrl}?cambio=1`);
  } catch (error) {
    if (isDomainError(error)) {
      return fail(error.message, httpStatusFor(error));
    }
    throw error;
  }
}
