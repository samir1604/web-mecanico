const TOKEN_SHAPE = /^[A-Za-z0-9_-]{10,128}$/;

/** Descarta tokens con forma imposible antes de tocar el store. */
export const isPublicToken = (value: string): boolean =>
  TOKEN_SHAPE.test(value);
