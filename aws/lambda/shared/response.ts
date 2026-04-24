type Headers = Record<string, string>;
const JSON_HEADERS: Headers = { 'content-type': 'application/json' };

export const ok = (body: unknown) => ({
  statusCode: 200,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

export const created = (body: unknown) => ({
  statusCode: 201,
  headers: JSON_HEADERS,
  body: JSON.stringify(body),
});

export const noContent = () => ({ statusCode: 204, body: '' });

export const badRequest = (msg: string) => ({
  statusCode: 400,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg }),
});

export const forbidden = (msg = 'Forbidden') => ({
  statusCode: 403,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg }),
});

export const notFound = (msg = 'Not found') => ({
  statusCode: 404,
  headers: JSON_HEADERS,
  body: JSON.stringify({ error: msg }),
});

export const serverError = (err: unknown) => {
  console.error(err);
  return {
    statusCode: 500,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: 'Internal server error' }),
  };
};
