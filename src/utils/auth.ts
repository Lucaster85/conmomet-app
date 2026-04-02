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

  // Verificar si el token existe y no ha expirado
  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verificar si es un token de demo
      if (token.startsWith('demo.')) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp > currentTime;
      }

      // Verificar JWT real
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      // Decodificar el payload del JWT (sin verificar la firma)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      
      // Verificar si el token no ha expirado
      if (payload.exp && payload.exp < currentTime) {
        this.removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      this.removeToken();
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

    // Si el token ha expirado, redirigir al login
    if (response.status === 401) {
      this.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return response;
  }
}

export function useAuth() {
  const isAuthenticated = TokenManager.isAuthenticated();
  const user = TokenManager.getUser();

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', { email, backend: process.env.NEXT_PUBLIC_API_BASE_URL });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Respuesta del servidor:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      });

      if (!response.ok) {
        let errorMessage = 'Error al iniciar sesión';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_e) {
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
      console.log('✅ Datos recibidos:', { hasToken: !!data.token, user: data.user });
      
      // Verificar que la respuesta tenga la estructura esperada
      if (!data.token) {
        throw new Error('Respuesta del servidor inválida');
      }
      
      // Limpiar y estructurar los datos del usuario para evitar problemas con objetos complejos
      const cleanUser = {
        id: data.user.id,
        name: data.user.name,
        lastname: data.user.lastname,
        email: data.user.email,
        role: data.user.role?.name || 'Usuario',
        roleName: data.user.role?.name || 'Usuario',
        permissions: data.user.role?.permissions || [],
        fullName: `${data.user.name} ${data.user.lastname}`.trim(),
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