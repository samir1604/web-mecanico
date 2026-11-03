const noStore = { "Cache-Control": "no-store" };

export const wantsJson = (request: Request): boolean =>
  request.headers.get("accept")?.includes("application/json") ?? false;

export const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status, headers: noStore });

export const unauthorized = (): Response =>
  json({ error: "No autorizado." }, 401);

export const redirectTo = (location: string): Response =>
  new Response(null, {
    status: 303,
    headers: { ...noStore, Location: location },
  });
