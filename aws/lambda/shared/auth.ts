import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export interface AuthClaims {
  sub: string;
  email: string;
}

export function getAuthClaims(
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): AuthClaims {
  const claims = event.requestContext.authorizer.jwt.claims;
  return {
    sub: String(claims['sub']),
    email: String(claims['email'] ?? ''),
  };
}
