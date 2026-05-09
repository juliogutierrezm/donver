import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { CORE_TABLE_NAME, ddb } from '../../shared/core-db';
import { normalizeProfileWithStatus } from '../../shared/profile';
import { badRequest, conflict, created, serverError } from '../../shared/response';

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  province?: string;
  canton?: string;
  signup_intent?: string;
}

interface CognitoSignUpResponse {
  UserConfirmed?: boolean;
  UserSub?: string;
}

function getCognitoErrorCode(payload: Record<string, unknown> | null) {
  const rawCode =
    (typeof payload?.__type === 'string' && payload.__type) ||
    (typeof payload?.code === 'string' && payload.code) ||
    (typeof payload?.Code === 'string' && payload.Code) ||
    '';

  return rawCode.includes('#') ? rawCode.split('#').pop() : rawCode;
}

function translateCognitoError(code?: string, fallback?: string) {
  switch (code) {
    case 'UsernameExistsException':
      return { kind: 'conflict' as const, message: 'Ya existe una cuenta con ese correo.' };
    case 'InvalidPasswordException':
      return { kind: 'badRequest' as const, message: fallback ?? 'La contrasena no cumple los requisitos.' };
    default:
      return { kind: 'badRequest' as const, message: fallback ?? 'No se pudo crear la cuenta en Cognito.' };
  }
}

async function signUpWithCognito(body: RegisterBody) {
  const region = process.env['AWS_REGION'] ?? process.env['AWS_DEFAULT_REGION'] ?? 'us-east-1';
  const clientId = process.env['COGNITO_USER_POOL_CLIENT_ID'];
  if (!clientId) throw new Error('COGNITO_USER_POOL_CLIENT_ID is not configured');

  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
    },
    body: JSON.stringify({
      ClientId: clientId,
      Username: body.email,
      Password: body.password,
      UserAttributes: [
        { Name: 'email', Value: body.email },
        { Name: 'name', Value: body.name },
      ],
    }),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) as Record<string, unknown> : null;

  if (!response.ok) {
    const code = getCognitoErrorCode(json);
    const fallback =
      typeof json?.message === 'string'
        ? json.message
        : typeof json?.Message === 'string'
          ? json.Message
          : `Error Cognito ${response.status}`;
    return translateCognitoError(code, fallback);
  }

  return json as unknown as CognitoSignUpResponse;
}

export async function handler(event: { body?: string | null }) {
  try {
    const body = JSON.parse(event.body ?? '{}') as RegisterBody;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const phone = body.phone?.trim() ?? '';
    const province = body.province?.trim();
    const canton = body.canton?.trim();
    const signupIntent = body.signup_intent === 'caregiver' ? 'caregiver' : null;

    if (!name || !email || !password || !province || !canton) {
      return badRequest('name, email, password, province and canton are required');
    }

    const signUpResult = await signUpWithCognito({
      name,
      email,
      password,
      phone,
      province,
      canton,
      signup_intent: signupIntent ?? undefined,
    });

    if ('kind' in signUpResult) {
      return signUpResult.kind === 'conflict'
        ? conflict(signUpResult.message)
        : badRequest(signUpResult.message);
    }

    if (!signUpResult.UserSub) {
      return serverError(new Error('Cognito did not return UserSub'));
    }

    const now = new Date().toISOString();
    const initialRoles = signupIntent === 'caregiver' ? [] : ['owner'];
    const initialActiveRole = signupIntent === 'caregiver' ? 'caregiver' : 'owner';
    const profile = {
      pk: `USER#${signUpResult.UserSub}`,
      sk: 'PROFILE',
      sub: signUpResult.UserSub,
      email,
      name,
      phone,
      province,
      canton,
      roles: initialRoles,
      active_role: initialActiveRole,
      owner_profile_active: signupIntent === 'caregiver' ? false : true,
      bio: '',
      avatar_url: '',
      signup_intent: signupIntent,
      created_at: now,
      updated_at: now,
    };

    await ddb.send(new PutCommand({
      TableName: CORE_TABLE_NAME,
      Item: profile,
      ConditionExpression: 'attribute_not_exists(pk)',
    }));

    return created({
      confirmed: Boolean(signUpResult.UserConfirmed),
      user: await normalizeProfileWithStatus(profile, initialRoles),
    });
  } catch (err) {
    return serverError(err);
  }
}
