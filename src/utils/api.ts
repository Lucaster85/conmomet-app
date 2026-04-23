import { TokenManager } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';


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
  createdAt: string;
  updatedAt?: string;
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
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users`);
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Users error response:', errorText);
        throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const users = Array.isArray(data) ? data : (data.data || data.users || []);
      
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

  static async create(userData: CreateUserData): Promise<User> {
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
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles`);
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Roles error response:', errorText);
        throw new Error(`Error al obtener roles: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const roles = Array.isArray(data) ? data : (data.data || data.roles || []);
      
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

  static async create(name: string): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear rol');
    }
    const data = await response.json();
    return data.role || data.data || data;
  }

  static async update(id: number, name: string): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar rol');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar rol');
    }
  }

  static async setPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: permissionIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al asignar permisos al rol');
    }
    const data = await response.json();
    return data.data || data;
  }
}

// Servicio para permisos
export class PermissionService {
  static async getAll(): Promise<Permission[]> {
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions`);
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Permissions error response:', errorText);
        throw new Error(`Error al obtener permisos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const permissions = Array.isArray(data) ? data : (data.data || data.permissions || []);
      
      return permissions;
    } catch (error) {
      console.error('💥 Error in getAll permissions:', error);
      throw error;
    }
  }

  static async assignToUser(userId: number, permissionIds: number[]): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions_assign`, {
      method: 'POST',
      body: JSON.stringify({ type: 'user', id: userId, permissions: permissionIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al asignar permisos');
    }
  }

  static async create(names: string[]): Promise<Permission[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions: names.map(name => ({ name })) }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear permisos');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/permissions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar permiso');
    }
  }
}
  export class ClientService {
  static async getAll(): Promise<Client[]> {
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients`);
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Clients error response:', errorText);
        throw new Error(`Error al obtener clientes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const clients = Array.isArray(data) ? data : (data.data || data.clients || []);
      
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

  static async create(clientData: CreateClientData): Promise<Client> {
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
  static async getAll(): Promise<Provider[]> {
    
    try {
      const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/providers`);
      

      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Providers error response:', errorText);
        throw new Error(`Error al obtener proveedores: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // El backend devuelve los datos en formato: {count: X, data: [...]}
      const providers = Array.isArray(data) ? data : (data.data || data.providers || []);
      
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

  static async create(providerData: CreateProviderData): Promise<Provider> {
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

export type MediaType = 'slider' | 'card' | 'logo' | 'gallery' | 'banner' | 'background';

export interface Media {
  id: number;
  type: MediaType;
  title?: string;
  description?: string;
  url: string;
  order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMediaData {
  file: File;
  type: MediaType;
  title?: string;
  description?: string;
  order?: number;
}

export interface UpdateMediaData {
  file?: File;
  title?: string;
  description?: string;
  order?: number;
  is_active?: boolean;
}

export class MediaService {
  static async getAll(): Promise<Media[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/media`);
    if (!response.ok) throw new Error('Error al obtener archivos multimedia');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  }

  static async getByType(type: MediaType): Promise<Media[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/media/type/${type}`);
    if (!response.ok) throw new Error('Error al obtener archivos multimedia');
    const data = await response.json();
    return Array.isArray(data) ? data : (data.data || []);
  }

  static async getById(id: number): Promise<Media> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/media/${id}`);
    if (!response.ok) throw new Error('Error al obtener el archivo');
    const data = await response.json();
    return data.data || data;
  }

  static async upload(mediaData: CreateMediaData): Promise<Media> {
    const formData = new FormData();
    formData.append('file', mediaData.file);
    formData.append('type', mediaData.type);
    if (mediaData.title) formData.append('title', mediaData.title);
    if (mediaData.description) formData.append('description', mediaData.description);
    if (mediaData.order !== undefined) formData.append('order', String(mediaData.order));

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir el archivo');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, mediaData: UpdateMediaData): Promise<Media> {
    const formData = new FormData();
    if (mediaData.file) formData.append('file', mediaData.file);
    if (mediaData.title !== undefined) formData.append('title', mediaData.title);
    if (mediaData.description !== undefined) formData.append('description', mediaData.description);
    if (mediaData.order !== undefined) formData.append('order', String(mediaData.order));
    if (mediaData.is_active !== undefined) formData.append('is_active', String(mediaData.is_active));

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el archivo');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/media/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el archivo');
    }
  }

  static async reorder(orderedIds: number[]): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/media/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al reordenar');
    }
  }
}