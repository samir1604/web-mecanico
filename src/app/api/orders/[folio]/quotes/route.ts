import { sessionFromRequest } from "@/auth/session";
import { httpStatusFor } from "@/http/domain-errors";
import { parseQuoteForm } from "@/http/quote-form";
import { json, redirectTo, unauthorized, wantsJson } from "@/http/responses";
import { getWorkshop } from "@/service";
import { isDomainError } from "@/workshop/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folio: string }> },
) {
  if (!sessionFromRequest(request)) return unauthorized();

  const { folio } = await params;
  const form = await request.formData();
  const input = parseQuoteForm(form);
  const respondJson = wantsJson(request);
  const detailUrl = `/ordenes/${encodeURIComponent(folio)}`;

  const fail = (message: string, status: number) => {
    if (respondJson) return json({ error: message }, status);
    return redirectTo(`${detailUrl}?error=${encodeURIComponent(message)}`);
  };

  if ("error" in input) {
    return fail(input.error, 422);
  }

  try {
    const quote = await getWorkshop().createQuote(folio, input);

    if (respondJson) return json({ quote }, 201);

    return redirectTo(`${detailUrl}?cotizacion=1`);
  } catch (error) {
    if (isDomainError(error)) {
      return fail(error.message, httpStatusFor(error));
    }
    throw error;
  }
}
