import { JwtPayload } from './JwtPayload'
import { JwtHeader } from 'jsonwebtoken'

/**
 * Interface representing a JWT token
 */
export interface Jwt {
  header: JwtHeader
  payload: JwtPayload
}

export interface Jwk {
  alg: string
  kty: string
  use: string
  x5c: string
  n: string
  e: string
  kid: string
  x5t: string
}
