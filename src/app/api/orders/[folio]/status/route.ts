import { sessionFromRequest } from "@/auth/session";
import { parseStatusChange } from "@/http/status-form";
import { getWorkshop } from "@/service";
import { DomainError } from "@/workshop/errors";

const noStore = { "Cache-Control": "no-store" };

const unauthorized = () =>
  Response.json({ error: "No autorizado." }, { status: 401, headers: noStore });

function httpStatusFor(error: DomainError): number {
  switch (error.code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 422;
    default:
      return 409;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ folio: string }> },
) {
  if (!sessionFromRequest(request)) return unauthorized();

  const { folio } = await params;
  const form = await request.formData();
  const input = parseStatusChange(form);
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ?? false;
  const detailUrl = `/ordenes/${encodeURIComponent(folio)}`;

  const fail = (message: string, status: number) => {
    if (wantsJson) {
      return Response.json({ error: message }, { status, headers: noStore });
    }
    return new Response(null, {
      status: 303,
      headers: {
        ...noStore,
        Location: `${detailUrl}?error=${encodeURIComponent(message)}`,
      },
    });
  };

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

    if (wantsJson) {
      return Response.json({ order }, { headers: noStore });
    }

    return new Response(null, {
      status: 303,
      headers: { ...noStore, Location: `${detailUrl}?cambio=1` },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return fail(error.message, httpStatusFor(error));
    }
    throw error;
  }
}
