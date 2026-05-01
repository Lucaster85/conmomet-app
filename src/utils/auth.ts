// Utility functions para manejar JWT tokens

export interface UserData {
  id?: number;
  name?: string;
  lastname?: string;
  fullName?: string;
  email?: string;
  role_id?: number;
  roleName?: string;
  role?: string;
  employee_id?: number | null;
  has_dashboard_access?: boolean;
  [key: string]: unknown;
}

export class TokenManager {
  private static readonly TOKEN_KEY = 'conmomet_token';
  private static readonly USER_KEY = 'conmomet_user';

  // Guardar token en localStorage
  static saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  // Obtener token del localStorage
  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  // Remover token del localStorage
  static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  // Guardar información del usuario
  static saveUser(user: UserData): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  // Obtener información del usuario
  static getUser(): UserData | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  // Decodifica Base64URL (formato usado por JWT) de forma segura
  private static decodeJWTPayload(base64url: string): Record<string, unknown> {
    // Convierte Base64URL → Base64 estándar y agrega el padding faltante
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return JSON.parse(atob(padded));
  }

  // Verificar si el token existe y no ha expirado
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = this.decodeJWTPayload(parts[1]);
      const currentTime = Date.now() / 1000;

      if (payload.exp && (payload.exp as number) < currentTime) {
        this.removeToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      // No eliminar el token ante un error de parsing; puede ser un falso negativo
      return false;
    }
  }

  // Obtener headers con autorización para requests
  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Hacer request autenticado
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Solo hacer logout si el token es inválido/expirado (verifyToken falla).
    // Un 401 de "sin permisos" (authPermission) NO debe desloguear al usuario.
    if (response.status === 401) {
      let body: { error?: string } = {};
      try {
        const clone = response.clone();
        body = await clone.json();
      } catch {
        // ignore parse errors
      }

      const isTokenError =
        body.error === 'No token provided' ||
        body.error === 'invalid token' ||
        body.error === 'jwt expired' ||
        body.error === 'jwt malformed';

      if (isTokenError) {
        this.removeToken();
        if (typeof window !== 'undefined') {
          // Si estamos en la misma pestaña de login, no redirigir para evitar loop.
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session_expired=true';
            // Devolvemos un dummy response para evitar que las Promesas en el UI rompan 
            // intentando parsear JSON, mientras ocurre el reload completo.
            return new Response(JSON.stringify({}), { status: 200 }); 
          }
        }
      }

      const message = body.error || 'Sin autorización';
      const err = new Error(message);
      err.name = 'UnauthorizedError';
      throw err;
    }

    return response;
  }
}

export function useAuth() {
  const isAuthenticated = TokenManager.isAuthenticated();
  const user = TokenManager.getUser();

  const login = async (email: string, password: string) => {
    try {

      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });



      if (!response.ok) {
        let errorMessage = 'Error al iniciar sesión';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear el JSON, usar mensaje por defecto
        }

        // Manejar diferentes códigos de error
        if (response.status === 401) {
          throw new Error(errorMessage);
        } else if (response.status === 404) {
          throw new Error('Usuario no encontrado');
        } else if (response.status >= 500) {
          throw new Error('Error del servidor');
        } else {
          throw new Error(errorMessage);
        }
      }

      const data = await response.json();

      
      // Verificar que la respuesta tenga la estructura esperada
      if (!data.token) {
        throw new Error('Respuesta del servidor inválida');
      }
      
      // Limpiar y estructurar los datos del usuario para evitar problemas con objetos complejos
      // Merge role permissions + user individual permissions into a flat, deduplicated array of names
      const rolePermissions = (data.user.role?.permissions || []).map((p: { name: string }) => p.name);
      const userPermissions = (data.user.permissions || []).map((p: { name: string }) => p.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      const cleanUser = {
        id: data.user.id,
        name: data.user.name,
        lastname: data.user.lastname,
        email: data.user.email,
        role: data.user.role?.name || 'Usuario',
        roleName: data.user.role?.name || 'Usuario',
        permissions: allPermissions,
        fullName: `${data.user.name} ${data.user.lastname}`.trim(),
        employee_id: data.user.employee_id || null,
        has_dashboard_access: data.user.has_dashboard_access !== undefined ? data.user.has_dashboard_access : true,
      };
      
      // Guardar token y datos del usuario limpios
      TokenManager.saveToken(data.token);
      TokenManager.saveUser(cleanUser);

      return { success: true, data: { ...data, user: cleanUser } };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    TokenManager.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
  };
}