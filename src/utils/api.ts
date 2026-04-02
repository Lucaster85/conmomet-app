import { TokenManager } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

console.log('🌐 API_BASE_URL configurada:', API_BASE_URL);
console.log('🔑 Token disponible:', !!TokenManager.getToken());

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_BASE_URL no está definida, usando fallback:', API_BASE_URL);
}

// Tipos para las entidades
export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role_id: number;
  cuit: string;
  phone?: string;
  celphone?: string;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  permissions?: Permission[];
}

export interface Role {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role_id: number;
  cuit: string;
  phone?: string;
  celphone?: string;
  permissions?: number[];
}

export interface Client {
  id: number;
  razonSocial: string;
  email: string;
  phone?: string;
}

export interface CreateClientData {
  razonSocial: string;
  email: string;
  phone?: string;
}

export interface Provider {
  id: number;
  razonSocial: string;
  email: string;
  phone?: string;
}

export interface CreateProviderData {
  razonSocial: string;
  email: string;
  phone?: string;
}

export class UserService {
  static async getAll(): Promise<User[]> {
    console.log('🔍 Fetching users from:', `${API_BASE_URL}/users`);
    console.log('🔑 Headers being sent:', TokenManager.getAuthHeaders());
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users`);
      
      console.log('📡 Users response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Users error response:', errorText);
        throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw users data:', data);
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const users = Array.isArray(data) ? data : (data.data || data.users || []);
      console.log('✅ Processed users:', users);
      
      return users;
    } catch (error) {
      console.error('💥 Error in getAll users:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<User> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener usuario');
    }
    return response.json();
  }

  static async create(userData: CreateUserData): Promise<any> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear usuario');
    }
    return response.json();
  }

  static async update(id: number, userData: Partial<CreateUserData>): Promise<User> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar usuario');
    }
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar usuario');
    }
  }
}

// Servicio para roles
export class RoleService {
  static async getAll(): Promise<Role[]> {
    console.log('🔍 Fetching roles from:', `${API_BASE_URL}/roles`);
    console.log('🔑 Headers being sent:', TokenManager.getAuthHeaders());
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles`);
      
      console.log('📡 Roles response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Roles error response:', errorText);
        throw new Error(`Error al obtener roles: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw roles data:', data);
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const roles = Array.isArray(data) ? data : (data.data || data.roles || []);
      console.log('✅ Processed roles:', roles);
      
      return roles;
    } catch (error) {
      console.error('💥 Error in getAll roles:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener rol');
    }
    return response.json();
  }
}

// Servicio para permisos
export class PermissionService {
  static async getAll(): Promise<Permission[]> {
    console.log('🔍 Fetching permissions from:', `${API_BASE_URL}/permissions`);
    console.log('🔑 Headers being sent:', TokenManager.getAuthHeaders());
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions`);
      
      console.log('📡 Permissions response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Permissions error response:', errorText);
        throw new Error(`Error al obtener permisos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw permissions data:', data);
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const permissions = Array.isArray(data) ? data : (data.data || data.permissions || []);
      console.log('✅ Processed permissions:', permissions);
      
      return permissions;
    } catch (error) {
      console.error('💥 Error in getAll permissions:', error);
      throw error;
    }
  }

  static async assignToUser(userId: number, permissionIds: number[]): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions_assign`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        permission_ids: permissionIds,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al asignar permisos');
    }
  }
}
  export class ClientService {
  static async getAll(): Promise<ClientService[]> {
    console.log('🔍 Fetching users from:', `${API_BASE_URL}/clients`);
    console.log('🔑 Headers being sent:', TokenManager.getAuthHeaders());
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients`);
      
      console.log('📡 Clients response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Clients error response:', errorText);
        throw new Error(`Error al obtener clientes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw clients data:', data);
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const clients = Array.isArray(data) ? data : (data.data || data.clients || []);
      console.log('✅ Processed clients:', clients);
      
      return clients;
    } catch (error) {
      console.error('💥 Error in getAll clients:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Client> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener cliente');
    }
    return response.json();
  }

  static async create(clientData: CreateClientData): Promise<any> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear cliente');
    }
    return response.json();
  }

  static async update(id: number, clientData: Partial<CreateClientData>): Promise<Client> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar cliente');
    }
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar cliente');
    }
  }
}

  export class ProviderService {
  static async getAll(): Promise<ProviderService[]> {
    console.log('🔍 Fetching users from:', `${API_BASE_URL}/providers`);
    console.log('🔑 Headers being sent:', TokenManager.getAuthHeaders());
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers`);
      
      console.log('📡 Providers response:', { 
        status: response.status, 
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Providers error response:', errorText);
        throw new Error(`Error al obtener proveedores: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Raw providers data:', data);
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const providers = Array.isArray(data) ? data : (data.data || data.providers || []);
      console.log('✅ Processed providers:', providers);
      
      return providers;
    } catch (error) {
      console.error('💥 Error in getAll providers:', error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Provider> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers/${id}`);
    if (!response.ok) {
      throw new Error('Error al obtener proveedor');
    }
    return response.json();
  }

  static async create(providerData: CreateProviderData): Promise<any> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers`, {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear proveedor');
    }
    return response.json();
  }

  static async update(id: number, providerData: Partial<CreateProviderData>): Promise<Provider> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(providerData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar proveedor');
    }
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar proveedor');
    }
  }
}