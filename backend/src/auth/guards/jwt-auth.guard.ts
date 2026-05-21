import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 🌟 THÊM INTERFACE: Định nghĩa đúng cấu trúc Object mà JwtStrategy.validate() trả về
interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string | null;
  permissions: string[];
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Định kiểu cho các tham số đầu vào để loại bỏ hoàn toàn chữ `any` bừa bãi
  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: TUser | false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info: unknown,
  ): TUser {
    // Nếu có lỗi hệ thống hoặc Passport không bốc được user (trả về false)
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException(
        '❌ Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại nhé Mikey!',
      );
    }

    // 🌟 CHUẨN CHỈ: Trả về một thực thể đã được định kiểu rõ ràng, sạch bóng lỗi unsafe-return
    return user;
  }
}
