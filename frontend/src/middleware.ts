import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🌟 Nếu user truy cập vào đường dẫn gốc "/"
  if (pathname === '/') {
    // Tự động đá (Redirect) user sang trang đăng ký /signup
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  return NextResponse.next();
}

// 🎯 Cấu hình Matcher để Middleware chỉ chạy khi vào đúng trang chủ
export const config = {
  matcher: ['/'],
};