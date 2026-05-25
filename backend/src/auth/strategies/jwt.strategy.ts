import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  userId: number;
  email: string;
  role: string | null;
  permissions: string[];
  iat?: number;
  exp?: number;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('[JwtStrategy] Cannot find JWT_SECRET in .env! file');
    }
    super({
      // 1. Export token from header following form: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: jwtSecret,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
