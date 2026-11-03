const dateTime = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  dateStyle: "medium",
  timeStyle: "short",
});

const dateOnly = new Intl.DateTimeFormat("es-MX", {
  timeZone: "UTC",
  dateStyle: "long",
});

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
});

export const formatDateTime = (iso: string): string =>
  dateTime.format(new Date(iso));

/** `promisedAt` guarda `YYYY-MM-DD`; se presenta como fecha, sin hora. */
export const formatPromiseDate = (value: string): string =>
  dateOnly.format(new Date(`${value}T00:00:00.000Z`));

export const formatMoney = (cents: number): string => money.format(cents / 100);
