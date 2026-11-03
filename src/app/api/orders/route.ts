import { sessionFromRequest } from "@/auth/session";
import { parseOrderInput } from "@/http/order-form";
import { getWorkshop } from "@/service";

const noStore = { "Cache-Control": "no-store" };

const unauthorized = () =>
  Response.json({ error: "No autorizado." }, { status: 401, headers: noStore });

export async function GET(request: Request) {
  if (!sessionFromRequest(request)) return unauthorized();

  const orders = await getWorkshop().listOrders();
  return Response.json({ orders }, { headers: noStore });
}

export async function POST(request: Request) {
  if (!sessionFromRequest(request)) return unauthorized();

  const form = await request.formData();
  const input = parseOrderInput(form);
  const wantsJson =
    request.headers.get("accept")?.includes("application/json") ?? false;

  if ("error" in input) {
    if (wantsJson) {
      return Response.json({ error: input.error }, { status: 422, headers: noStore });
    }
    return new Response(null, {
      status: 303,
      headers: {
        ...noStore,
        Location: `/ordenes/nueva?error=${encodeURIComponent(input.error)}`,
      },
    });
  }

  const order = await getWorkshop().createOrder(input);

  if (wantsJson) {
    return Response.json({ order }, { status: 201, headers: noStore });
  }

  return new Response(null, {
    status: 303,
    headers: { ...noStore, Location: `/?creada=${encodeURIComponent(order.folio)}` },
  });
}
