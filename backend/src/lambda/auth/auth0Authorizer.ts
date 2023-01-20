import {CustomAuthorizerEvent, CustomAuthorizerResult} from 'aws-lambda'
import 'source-map-support/register'
import {decode, verify} from 'jsonwebtoken'
import axios from 'axios'

import {createLogger} from '../../utils/logger'
import {Jwk, Jwt} from '../../auth/Jwt'
import {JwtPayload} from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = process.env.JWKS_URL;
let certificate;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt = decode(token, { complete: true }) as Jwt
  const kid = jwt.header.kid;

  const certificate = await getCert(kid);
  return verify(token, certificate, {algorithms: ['RS256']}) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  return split[1]
}

function convertCertToPEM(cert: string): string {
  cert = cert.match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
}

function getSigningKey(keys: Jwk[], kid): Jwk {
  const signingKeys = keys
      .filter(key => key.use === 'sig'
          && key.kty === 'RSA'
          && key.alg === 'RS256'
          && key.kid
          && ((key.x5c && key.x5c.length) || (key.n && key.e))
      )

  if (!signingKeys.length) {
    logger.error("No signing keys found");
    throw new Error('No signing keys found');
  }

  const signingKey = signingKeys.find(key => key.kid === kid);

  if (!signingKey) {
    logger.error('Unable to find a signing key');
    throw new Error('Unable to find a signing key');
  }

  return signingKey;
}

async function getCert(kid: string): Promise<string> {
  if (certificate) return certificate;

  logger.info('Fetching certificate');

  const response = await axios.get(jwksUrl);
  const keys = response.data.keys as Jwk[];

  if (!keys || !keys.length) {
    logger.error("Error fetching certificate");
    throw new Error('No keys found');
  }

  const signingKey = getSigningKey(keys, kid);
  const pub = signingKey.x5c[0];

  certificate = convertCertToPEM(pub);

  logger.info("Certificate found");
  return certificate;
}
