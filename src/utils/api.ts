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

// ==================== RRHH MODULE ====================

export interface Plant {
  id: number;
  name: string;
  address?: string;
  client_id?: number;
  is_active: boolean;
  notes?: string;
  client?: { id: number; razonSocial: string };
  createdAt: string;
}

export interface Employee {
  id: number;
  name: string;
  lastname: string;
  dni: string;
  cuil: string;
  address?: string;
  phone?: string;
  email?: string;
  position?: string;
  hire_date: string;
  termination_date?: string;
  status: 'active' | 'inactive' | 'vacation' | 'medical_leave';
  hourly_rate: number;
  pay_type: 'hourly' | 'monthly';
  monthly_salary?: number;
  user_id?: number;
  notes?: string;
  shoe_size?: string;
  shirt_size?: string;
  pant_size?: string;
  user?: { id: number; email: string; name: string; lastname: string };
  createdAt: string;
}

export interface CreateEmployeeData {
  name: string;
  lastname: string;
  dni: string;
  cuil: string;
  address?: string;
  phone?: string;
  email?: string;
  position?: string;
  hire_date: string;
  hourly_rate: number;
  pay_type?: string;
  monthly_salary?: number;
  user_id?: number;
  notes?: string;
  shoe_size?: string;
  shirt_size?: string;
  pant_size?: string;
}

export interface TimeEntry {
  id: number;
  employee_id: number;
  project_id?: number;
  plant_id?: number;
  date: string;
  check_in: string;
  check_out: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  is_late: boolean;
  notes?: string;
  registered_by: number;
  approved_by?: number;
  approved_at?: string;
  status: 'pending' | 'approved' | 'voided';
  voided_by?: number;
  voided_at?: string;
  void_reason?: string;
  employee?: { id: number; name: string; lastname: string; hourly_rate: number };
  plant?: { id: number; name: string };
  registeredBy?: { id: number; name: string; lastname: string };
  approvedBy?: { id: number; name: string; lastname: string };
  createdAt: string;
}

export interface CreateTimeEntryData {
  employee_ids: number[];
  project_id?: number;
  plant_id?: number;
  date: string;
  check_in: string;
  check_out: string;
  overtime_50_hours?: number;
  overtime_100_hours?: number;
  is_late?: boolean;
  notes?: string;
}

// Plant Service
export class PlantService {
  static async getAll(): Promise<Plant[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants`);
    if (!response.ok) throw new Error('Error al obtener plantas');
    const data = await response.json();
    return data.data || [];
  }

  static async create(plantData: Partial<Plant>): Promise<Plant> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants`, {
      method: 'POST',
      body: JSON.stringify(plantData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear planta');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, plantData: Partial<Plant>): Promise<Plant> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plantData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar planta');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar planta');
    }
  }
}

// Employee Service
export class EmployeeService {
  static async getAll(status?: string): Promise<Employee[]> {
    const url = status ? `${API_BASE_URL}/employees?status=${status}` : `${API_BASE_URL}/employees`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener empleados');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<Employee> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${id}`);
    if (!response.ok) throw new Error('Error al obtener empleado');
    const data = await response.json();
    return data.data || data;
  }

  static async create(employeeData: CreateEmployeeData): Promise<Employee> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear empleado');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, employeeData: Partial<CreateEmployeeData>): Promise<Employee> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar empleado');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar empleado');
    }
  }
}

// TimeEntry Service
export class TimeEntryService {
  static async getAll(filters?: { employee_id?: number; plant_id?: number; date_from?: string; date_to?: string; status?: string }): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
      });
    }
    const url = `${API_BASE_URL}/time-entries${params.toString() ? `?${params}` : ''}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener registros de horas');
    const data = await response.json();
    return data.data || [];
  }

  static async create(entryData: CreateTimeEntryData): Promise<{ data: TimeEntry[]; errors: Array<{ employee_id: number; error: string }> }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/time-entries`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear registro de horas');
    }
    return response.json();
  }

  static async update(id: number, entryData: Partial<CreateTimeEntryData>): Promise<TimeEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar registro');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async void(id: number, reason: string): Promise<TimeEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/time-entries/${id}/void`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al anular registro');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async approve(id: number): Promise<TimeEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/time-entries/${id}/approve`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aprobar registro');
    }
    const data = await response.json();
    return data.data || data;
  }
}

// Attendance Service
export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: 'absent' | 'justified' | 'vacation' | 'medical_leave';
  notes?: string;
  document_url?: string;
  document_name?: string;
  employee?: { id: number; name: string; lastname: string };
}

export class AttendanceService {
  static async getAll(filters?: { employee_id?: number; date_from?: string; date_to?: string; status?: string }): Promise<Attendance[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
    }
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/attendance?${params.toString()}`);
    if (!response.ok) throw new Error('Error al obtener presentismo');
    const data = await response.json();
    return data.data || [];
  }

  static async create(payload: { employee_id: number; date: string; status: string; notes?: string; file?: File }): Promise<Attendance> {
    const formData = new FormData();
    formData.append('employee_id', String(payload.employee_id));
    formData.append('date', payload.date);
    formData.append('status', payload.status);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.file) formData.append('file', payload.file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al registrar presentismo');
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, payload: { status: string; notes?: string; file?: File }): Promise<Attendance> {
    const formData = new FormData();
    formData.append('status', payload.status);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.file) formData.append('file', payload.file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al actualizar presentismo');
    const data = await response.json();
    return data.data;
  }
}

// PayPeriod Service
export interface PayPeriod {
  id: number;
  start_date: string;
  end_date: string;
  type: 'first_half' | 'second_half';
  month: number;
  year: number;
  status: 'open' | 'closed' | 'paid';
}

export class PayPeriodService {
  static async getAll(): Promise<PayPeriod[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/pay-periods`);
    if (!response.ok) throw new Error('Error al obtener quincenas');
    const data = await response.json();
    return data.data || [];
  }

  static async create(payload: { month: number; year: number; type: string }): Promise<PayPeriod> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/pay-periods`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al crear quincena');
    const data = await response.json();
    return data.data;
  }

  static async close(id: number): Promise<PayPeriod> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/pay-periods/${id}/close`, { method: 'PUT' });
    if (!response.ok) throw new Error('Error al cerrar quincena');
    return (await response.json()).data;
  }

  static async pay(id: number): Promise<PayPeriod> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/pay-periods/${id}/pay`, { method: 'PUT' });
    if (!response.ok) throw new Error('Error al marcar quincena como pagada');
    return (await response.json()).data;
  }
}

// Payroll Service
export interface PayrollEntry {
  id: number;
  pay_period_id: number;
  employee_id: number;
  employee?: Employee;
  total_regular_hours: number;
  total_overtime_50_hours: number;
  total_overtime_100_hours: number;
  regular_amount: number;
  overtime_50_amount: number;
  overtime_100_amount: number;
  extra_payments: number;
  extra_payments_notes?: string;
  gross_amount: number;
  deductions: number;
  deductions_notes?: string;
  advances_deducted: number;
  net_amount: number;
  late_count: number;
  absent_count: number;
  status: 'draft' | 'confirmed' | 'paid';
}

export class PayrollService {
  static async getByPeriod(periodId: number): Promise<PayrollEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${periodId}`);
    if (!response.ok) throw new Error('Error al obtener liquidaciones');
    const data = await response.json();
    return data.data || [];
  }

  static async generate(periodId: number): Promise<PayrollEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${periodId}/generate`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al generar liquidación');
    const data = await response.json();
    return data.data || [];
  }

  static async update(id: number, payload: { extra_payments?: number; extra_payments_notes?: string; deductions?: number; deductions_notes?: string }): Promise<PayrollEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al actualizar liquidación');
    return (await response.json()).data;
  }

  static async confirm(id: number): Promise<PayrollEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${id}/confirm`, { method: 'PUT' });
    if (!response.ok) throw new Error('Error al confirmar liquidación');
    return (await response.json()).data;
  }

  static async pay(id: number): Promise<PayrollEntry> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${id}/pay`, { method: 'PUT' });
    if (!response.ok) throw new Error('Error al marcar liquidación como pagada');
    return (await response.json()).data;
  }
}

// Salary Advance Service
export interface SalaryAdvance {
  id: number;
  employee_id: number;
  amount: number;
  date: string;
  pay_period_id?: number;
  notes?: string;
  employee?: Employee;
  payPeriod?: PayPeriod;
}

export class SalaryAdvanceService {
  static async getAll(employee_id?: number): Promise<SalaryAdvance[]> {
    const url = employee_id ? `${API_BASE_URL}/salary-advances?employee_id=${employee_id}` : `${API_BASE_URL}/salary-advances`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener adelantos');
    return (await response.json()).data || [];
  }

  static async create(payload: { employee_id: number; amount: number; date: string; notes?: string }): Promise<SalaryAdvance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advances`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Error al crear adelanto');
    return (await response.json()).data;
  }
}

// EPP Catalog Service
export type EppCategory = 'footwear' | 'clothing' | 'head_protection' | 'hand_protection' | 'eye_protection' | 'other';
export type EppSizeType = 'none' | 'numeric' | 'alpha';

export interface EppItem {
  id: number;
  name: string;
  category: EppCategory;
  size_type: EppSizeType;
  is_active: boolean;
}

export class EppItemService {
  static async getAll(includeInactive = false): Promise<EppItem[]> {
    const url = includeInactive ? `${API_BASE_URL}/epp-items?include_inactive=true` : `${API_BASE_URL}/epp-items`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener catálogo EPP');
    return (await response.json()).data || [];
  }

  static async create(payload: { name: string; category: EppCategory; size_type: EppSizeType }): Promise<EppItem> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/epp-items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear artículo');
    }
    return (await response.json()).data;
  }

  static async update(id: number, payload: { name?: string; category?: EppCategory; size_type?: EppSizeType }): Promise<EppItem> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/epp-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar artículo');
    }
    return (await response.json()).data;
  }

  static async toggleActive(id: number): Promise<EppItem> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/epp-items/${id}/toggle`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al cambiar estado del artículo');
    return (await response.json()).data;
  }
}

// Safety Equipment Service
export interface SafetyEquipment {
  id: number;
  employee_id: number;
  epp_item_id: number;
  size_delivered?: string;
  quantity: number;
  delivered_date: string;
  return_date?: string;
  condition?: 'new' | 'good' | 'worn' | 'damaged';
  notes?: string;
  employee?: Employee;
  eppItem?: EppItem;
}

export class SafetyEquipmentService {
  static async getAll(employee_id?: number): Promise<SafetyEquipment[]> {
    const url = employee_id ? `${API_BASE_URL}/safety-equipment?employee_id=${employee_id}` : `${API_BASE_URL}/safety-equipment`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener EPP');
    return (await response.json()).data || [];
  }

  static async create(payload: { employee_id: number; epp_item_id: number; size_delivered?: string; quantity?: number; delivered_date: string; condition?: string; notes?: string }): Promise<SafetyEquipment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/safety-equipment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar EPP');
    }
    return (await response.json()).data;
  }
}

// Entity Document Service (Unified Expirations and Documents)
export interface EntityDocument {
  id: number;
  title: string;
  notes?: string;
  entity_type: 'employee' | 'vehicle' | 'project' | 'company';
  entity_id?: number;
  file_url?: string;
  file_name?: string;
  expiration_date?: string;
  notify_days_before: number;
  alert_status: 'pending' | 'warned' | 'expired_warned' | 'resolved';
  computed_status: 'permanent' | 'valid' | 'expiring_soon' | 'expired' | 'resolved';
  is_renewable: boolean;
  previous_record_id?: number | null;
  resolved_at?: string;
  created_at: string;
}

export class EntityDocumentService {
  static async getAll(entityType?: string, entityId?: number, alertStatus?: string): Promise<EntityDocument[]> {
    let url = `${API_BASE_URL}/documents`;
    const params = new URLSearchParams();
    if (entityType) params.append('entity_type', entityType);
    if (entityId) params.append('entity_id', entityId.toString());
    if (alertStatus) params.append('alert_status', alertStatus);
    if (params.toString()) url += `?${params.toString()}`;

    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener documentos');
    return (await response.json()).data || [];
  }

  static async create(data: { title: string; entity_type: string; entity_id?: number; notes?: string; expiration_date?: string; notify_days_before?: number; is_renewable?: boolean }, file?: File | null): Promise<EntityDocument> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('entity_type', data.entity_type);
    if (data.entity_id) formData.append('entity_id', data.entity_id.toString());
    if (data.notes) formData.append('notes', data.notes);
    if (data.expiration_date) formData.append('expiration_date', data.expiration_date);
    if (data.notify_days_before) formData.append('notify_days_before', data.notify_days_before.toString());
    if (data.is_renewable !== undefined) formData.append('is_renewable', data.is_renewable.toString());
    if (file) formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al guardar documento');
    return (await response.json()).data;
  }

  static async update(id: number, data: { title?: string; notes?: string; expiration_date?: string; notify_days_before?: number }, file?: File | null): Promise<EntityDocument> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.notes !== undefined) formData.append('notes', data.notes);
    if (data.expiration_date !== undefined) formData.append('expiration_date', data.expiration_date);
    if (data.notify_days_before !== undefined) formData.append('notify_days_before', data.notify_days_before.toString());
    if (file) formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al actualizar documento');
    return (await response.json()).data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar documento');
  }

  static async renew(id: number, data: { expiration_date: string; notify_days_before?: number; file_name?: string }, file: File): Promise<EntityDocument> {
    const formData = new FormData();
    formData.append('expiration_date', data.expiration_date);
    if (data.notify_days_before !== undefined) formData.append('notify_days_before', data.notify_days_before.toString());
    if (data.file_name) formData.append('file_name', data.file_name);
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/documents/${id}/renew`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al renovar documento');
    return (await response.json()).data;
  }

  static async resolve(id: number, file: File): Promise<EntityDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/documents/${id}/resolve`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al resolver documento');
    return (await response.json()).data;
  }

  static async getHistory(id: number): Promise<EntityDocument[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/documents/${id}/history`);
    if (!response.ok) throw new Error('Error al obtener historial del documento');
    return (await response.json()).data || [];
  }
}