import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

interface DecodedToken {
  userId: number;
  email: string;
  role: string | null;
  permissions: string[];
  exp: number;
}

export function useAuth() {
  const [user, setUser] = useState<DecodedToken | null>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          // Nếu token còn hạn thì trả về làm state mặc định luôn
          if (decoded.exp * 1000 > Date.now()) {
            return decoded;
          } else {
            localStorage.removeItem('access_token');
          }
        } catch (error) {
          console.error("Lỗi giải mã token:", error);
        }
      }
    }
    return null;
  });

  const [loading] = useState(false);

  // Check if user have any specific permissions or not
  const hasPermissions = (permission: string) => {
    return user?.permissions?.includes(permission) || false;
  };

  // Quick check on user to see if it's a superAdmin or not
  const isAdmin = user?.role?.toLowerCase() === "admin";

  return { user, loading, hasPermissions, isAdmin };
}
