import { isPublicToken } from "@/http/public-token";
import { json } from "@/http/responses";
import { getWorkshop } from "@/service";
import { isDomainError } from "@/workshop/errors";

/** Enlace público del cliente: el token es la única credencial. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!isPublicToken(token)) {
    return json({ error: "Enlace no válido." }, 404);
  }

  try {
    const order = await getWorkshop().publicOrderByToken(token);
    return json({ order });
  } catch (error) {
    if (isDomainError(error)) {
      return json(
        { error: error.message },
        error.code === "LINK_EXPIRED" ? 410 : 404,
      );
    }
    throw error;
  }
}
