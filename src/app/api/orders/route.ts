import { sessionFromRequest } from "@/auth/session";
import { parseOrderInput } from "@/http/order-form";
import { json, redirectTo, unauthorized, wantsJson } from "@/http/responses";
import { getWorkshop } from "@/service";

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return unauthorized();

  const orders = await getWorkshop().listOrders();
  return json({ orders });
}

export async function POST(request: Request) {
  if (!sessionFromRequest(request)) return unauthorized();

  const form = await request.formData();
  const input = parseOrderInput(form);
  const respondJson = wantsJson(request);

  if ("error" in input) {
    if (respondJson) {
      return json({ error: input.error }, 422);
    }
    return redirectTo(
      `/ordenes/nueva?error=${encodeURIComponent(input.error)}`,
    );
  }

  const order = await getWorkshop().createOrder(input);

  if (respondJson) {
    return json({ order }, 201);
  }

  return redirectTo(`/?creada=${encodeURIComponent(order.folio)}`);
}
