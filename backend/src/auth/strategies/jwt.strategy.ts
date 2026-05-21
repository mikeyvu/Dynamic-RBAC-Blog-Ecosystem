import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: number; // ID của User (thường ký dưới dạng sub)
  email: string;
  role: string | null;
  permissions: string[]; // Mảng chuỗi các quyền hạn
  iat?: number; // Thời gian tạo token (Issued at - tự động có)
  exp?: number; // Thời gian hết hạn token (Expiration - tự động có)
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        '❌ [JwtStrategy] Không tìm thấy cấu hình JWT_SECRET trong file .env!',
      );
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
      userid: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions,
    };
  }
}
