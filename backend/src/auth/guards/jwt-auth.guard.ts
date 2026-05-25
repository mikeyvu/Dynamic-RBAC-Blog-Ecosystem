import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Define object structure that JwtStrategy.validate() return
interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string | null;
  permissions: string[];
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  //Define input type to avoid any type
  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info: unknown,
  ): TUser {
    // If system error or Passport cannot get user -> return false
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException(
        'Invalid token or has been expired, please log in again',
      );
    }

    return user;
  }
}
