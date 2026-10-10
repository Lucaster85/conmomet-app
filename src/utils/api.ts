import { TokenManager } from './auth';
import type { TaxCondition } from './cuit';

declare global {
  interface Window {
    __ENV__?: { API_BASE_URL?: string; GOOGLE_PLACES_API_KEY?: string };
  }
}

// Lee de window.__ENV__ en runtime (Docker/Railway) o del build-time embed (dev local)
const API_BASE_URL =
  (typeof window !== 'undefined' && window.__ENV__?.API_BASE_URL) ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:4000';

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
  has_dashboard_access?: boolean;
  // Identificador interno inmutable (superadmin/admin/operario), nunca editable desde la UI.
  key?: string;
  // Jerarquía numérica (1-100, mayor = más privilegio).
  level?: number;
  // Roles técnicos: protegidos contra edición/borrado/cambio de permisos.
  is_system?: boolean;
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
  password?: string;
  role_id: number;
  cuit: string;
  phone?: string;
  celphone?: string;
  permissions?: number[];
  employee_id?: number;
}

export interface Client {
  id: number;
  razonSocial: string;
  email: string;
  phone?: string;
  // Datos fiscales opcionales (Facturación / ARCA). El CUIT viene sin guiones.
  cuit?: string | null;
  tax_condition?: TaxCondition | null;
  is_active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClientData {
  razonSocial: string;
  email: string;
  phone?: string;
  cuit?: string | null;
  tax_condition?: TaxCondition | null;
  is_active?: boolean;
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

  static async create(userData: CreateUserData): Promise<{ data: User; token: string; generatedPassword: string | null }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users`, {
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

  static async setPermissions(id: number, permissionIds: number[]): Promise<User> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/users/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: permissionIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al asignar permisos al usuario');
    }
    return (await response.json()).data;
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

  static async changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar la contraseña');
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

  static async create(name: string, has_dashboard_access: boolean = true, level?: number): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name, has_dashboard_access, ...(level !== undefined && { level }) }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear rol');
    }
    const data = await response.json();
    return data.role || data.data || data;
  }

  static async update(id: number, name: string, has_dashboard_access: boolean = true, level?: number): Promise<Role> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, has_dashboard_access, ...(level !== undefined && { level }) }),
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

// Endpoints "lite" de solo lectura (GET /lookup/*), solo requieren estar logueado — no el
// permiso de gestión completa del recurso (roles_read). Sirven para poblar selects, como el
// de rol en UserForm.tsx, sin dar acceso al menú "Roles y Permisos". /lookup/roles ya viene
// filtrado por jerarquía desde el backend (solo roles de nivel menor al del usuario logueado).
// Tipos mínimos devueltos por /lookup/* — a propósito más chicos que el recurso completo
// (Project, Vehicle, etc.), ver conmomet-app/CLAUDE.md "selects que traen datos de otro módulo".
export interface LookupProject {
  id: number;
  name: string;
  code?: string | null;
  client_id?: number;
  plant_id?: number;
  is_additional?: boolean;
  parent?: { id: number; code: string } | null;
}
export interface LookupProjectSupervisor {
  id: number;
  name: string;
  lastname: string;
}
export interface LookupVehicle {
  id: number;
  brand?: string;
  model?: string;
  plate?: string;
}
export interface LookupHoliday {
  date: string;
}
export interface LookupBudgetItemType {
  id: number;
  name: string;
  unit_type: 'hours' | 'units' | 'days';
}
export interface LookupPayrollConcept {
  id: number;
  name: string;
  is_crane_hours?: boolean;
}
export interface LookupPayPeriod {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
}

export class LookupService {
  static async getRoles(): Promise<Pick<Role, 'id' | 'name' | 'level' | 'has_dashboard_access'>[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/lookup/roles`);
    if (!response.ok) {
      throw new Error('Error al obtener los roles disponibles');
    }
    const data = await response.json();
    return data.data || [];
  }

  static async getProjects(params?: { client_id?: number; status?: string; plant_id?: number; include_children?: boolean; is_additional?: boolean }): Promise<LookupProject[]> {
    let url = `${API_BASE_URL}/lookup/projects`;
    if (params) {
      const qs = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) qs.append(key, String(value));
      });
      const query = qs.toString();
      if (query) url += `?${query}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener proyectos');
    const data = await response.json();
    return data.data || [];
  }

  static async getProjectSupervisors(projectId: number): Promise<LookupProjectSupervisor[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/lookup/projects/${projectId}/supervisors`);
    if (!response.ok) throw new Error('Error al obtener supervisores');
    const data = await response.json();
    return data.data || [];
  }

  static async getVehicles(params?: { is_active?: boolean }): Promise<LookupVehicle[]> {
    let url = `${API_BASE_URL}/lookup/vehicles`;
    if (params?.is_active !== undefined) url += `?is_active=${params.is_active}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener vehículos');
    const data = await response.json();
    return data.data || [];
  }

  static async getHolidays(year?: number): Promise<LookupHoliday[]> {
    const params = year ? `?year=${year}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/lookup/holidays${params}`);
    if (!response.ok) throw new Error('Error al obtener feriados');
    const data = await response.json();
    return data.data || [];
  }

  static async getBudgetItemTypes(isActive?: boolean): Promise<LookupBudgetItemType[]> {
    let url = `${API_BASE_URL}/lookup/budget-item-types`;
    if (isActive !== undefined) url += `?is_active=${isActive}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener rubros de presupuesto');
    const data = await response.json();
    return data.data || [];
  }

  static async getPayrollConcepts(activeOnly = false): Promise<LookupPayrollConcept[]> {
    const params = activeOnly ? '?active=true' : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/lookup/payroll-concepts${params}`);
    if (!response.ok) throw new Error('Error al obtener conceptos');
    const data = await response.json();
    return data.data || [];
  }

  static async getPayPeriods(): Promise<LookupPayPeriod[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/lookup/pay-periods`);
    if (!response.ok) throw new Error('Error al obtener quincenas');
    const data = await response.json();
    return data.data || [];
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
  static async getAll(params?: { is_active?: boolean }): Promise<Client[]> {
    let url = `${API_BASE_URL}/clients`;
    if (params?.is_active !== undefined) url += `?is_active=${params.is_active}`;

    try {
      const response = await TokenManager.authenticatedFetch(url);



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

// Bolsa de horas presupuestadas por rubro en un proyecto — budget_item_type_id null es la bolsa
// "Generales" (horas cargadas sin rubro). Reemplaza al viejo Project.budgeted_hours (un total
// único, sin desglose).
export interface HourBucket {
  budget_item_type_id: number | null;
  item_type_name: string;
  budgeted_hours: number;
  consumed_hours: number;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  client_id: number;
  plant_id?: number;
  parent_id?: number;
  // Adicional: proyecto urgente con código A-AAAA-NNN, con o sin padre (módulo Adicionales).
  is_additional?: boolean;
  description?: string;
  hour_buckets?: HourBucket[];
  budgeted_hours_own?: number;
  budgeted_hours_total?: number;
  consumed_hours_own?: number;
  consumed_hours_total?: number;
  consumed_cost_labor?: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  notes?: string;
  client?: { id: number; razonSocial: string };
  plant?: { id: number; name: string };
  parent?: { id: number; name: string; code: string };
  subprojects?: (Project & { consumed_hours_own?: number })[];
  subproject_count?: number;
  budget?: Budget;
  supervisors?: { id: number; name: string; lastname: string }[];
  createdAt: string;
}

export interface CreateProjectData {
  name: string;
  code?: string;
  client_id: number;
  plant_id?: number;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface WorkDayLog {
  id?: number;
  project_id: number;
  date: string;
  day_name: string;
  start_time?: string | null;
  end_time?: string | null;
  computed_start_time?: string | null;
  computed_end_time?: string | null;
  suspension_reason?: string | null;
  suspended_by?: string | null;
  observations?: string | null;
  is_saved: boolean;
  is_holiday?: boolean;
  holiday_name?: string | null;
}

export interface WorkDayLogWeek {
  week_start: string;
  week_end: string;
  days: WorkDayLog[];
}

export interface Category {
  id: number;
  name: string;
  guild_hourly_rate: number;
  guild_id?: number;
  guild?: Guild;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeSize {
  id: number;
  employee_id: number;
  epp_item_id: number;
  size: string;
  eppItem?: EppItem;
}

export interface Employee {
  id: number;
  name: string;
  lastname: string;
  dni: string;
  cuil: string;
  address?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  position?: string;
  hire_date: string;
  termination_date?: string;
  status: 'active' | 'inactive' | 'vacation' | 'medical_leave';
  // Ausentes cuando el usuario no tiene employee_salaries_read — el backend borra estos campos
  // antes de serializar (ver api_conmomet/controllers/employeeController.js#stripSalaryFields).
  hourly_rate?: number;
  pay_type: 'hourly' | 'monthly' | 'biweekly_fixed';
  monthly_salary?: number;
  user_id?: number;
  category_id?: number | null;
  notes?: string;
  sizes?: EmployeeSize[];
  vacation_days_override?: number | null;
  user?: { id: number; email: string; name: string; lastname: string };
  category?: Omit<Category, 'guild_hourly_rate'> & { guild_hourly_rate?: number };
  invitation_status?: 'pending' | 'expired' | null;
  createdAt: string;
}

export interface CreateEmployeeData {
  name: string;
  lastname: string;
  dni: string;
  cuil: string;
  address?: string;
  birth_date?: string;
  phone?: string;
  email?: string;
  position?: string;
  hire_date: string;
  hourly_rate: number;
  pay_type?: string;
  monthly_salary?: number;
  user_id?: number;
  category_id?: number | null;
  notes?: string;
  vacation_days_override?: number | null;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: 'vacation' | 'medical_leave' | 'justified' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  document_url?: string;
  document_key?: string;
  document_name?: string;
  requested_by?: number;
  approved_by?: number;
  approved_at?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface LeaveBalance {
  corresponding_days: number;
  used_days: number;
  balance: number;
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
  employee?: { id: number; name: string; lastname: string; pay_type?: string };
  plant?: { id: number; name: string };
  project?: { id: number; name: string; code: string };
  registeredBy?: { id: number; name: string; lastname: string };
  approvedBy?: { id: number; name: string; lastname: string };
  createdAt: string;
  concept_id?: number;
  concept?: PayrollConcept;
  is_plant_hours?: boolean;
  generates_oca?: boolean;
  supervisor_id?: number;
  vehicle_id?: number;
  oca_id?: number;
  supervisor?: { id: number; name: string; lastname: string };
  vehicle?: { id: number; brand: string; model: string; plate: string; type: string };
  oca?: { id: number; number: string; type: string; status: string };
  // Rubro de PROYECTO (Montaje, Construcción, etc.) para la bolsa de horas del proyecto — NO es
  // el concepto de liquidación (concept_id/PayrollConcept). Opcional: sin rubro, cuenta para la
  // bolsa "Generales" del proyecto.
  budget_item_type_id?: number;
  projectItemType?: BudgetItemType;
}

export interface CreateTimeEntryData {
  employee_ids: number[];
  project_id?: number;
  plant_id?: number;
  date: string;
  check_in: string;
  check_out: string;
  concept_id?: number;
  overtime_50_hours?: number;
  overtime_100_hours?: number;
  is_late?: boolean;
  notes?: string;
  is_plant_hours?: boolean;
  generates_oca?: boolean;
  supervisor_id?: number;
  vehicle_id?: number;
  budget_item_type_id?: number;
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
  static async getAll(status?: string, include_inactive?: boolean): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (include_inactive) params.append('include_inactive', 'true');
    const url = params.toString() ? `${API_BASE_URL}/employees?${params}` : `${API_BASE_URL}/employees`;
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

// Employee Invitation Service (admin, autenticado)
export interface EmployeeInvitationStatus {
  id: number;
  status: 'pending' | 'expired';
  channel: 'email' | 'whatsapp';
  expires_at: string;
  createdAt: string;
}

export interface InviteResult {
  invitation: { id: number; expires_at: string; channel: 'email' | 'whatsapp' };
  invite_link: string;
  email_sent: boolean;
  test_mode: boolean;
  contact_used: string;
  whatsapp_contact: string | null;
}

export class EmployeeInvitationService {
  static async getStatus(employeeId: number): Promise<EmployeeInvitationStatus | null> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${employeeId}/invitation`);
    if (!response.ok) throw new Error('Error al consultar la invitación');
    const data = await response.json();
    return data.data;
  }

  static async invite(employeeId: number, payload: { channel: 'email' | 'whatsapp'; contact: string }): Promise<InviteResult> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${employeeId}/invite`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al invitar al empleado');
    }
    const data = await response.json();
    return data.data;
  }
}

// Public Invitation Service (sin sesión — usado por el formulario público de aceptación)
export class PublicInvitationService {
  static async validate(token: string): Promise<{ employeeName: string; employeeLastname: string }> {
    const response = await fetch(`${API_BASE_URL}/public/invitations/${token}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invitación inválida.');
    }
    const data = await response.json();
    return data.data;
  }

  static async accept(token: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/public/invitations/${token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'No se pudo crear tu usuario.');
    }
    return response.json();
  }
}

export class ProjectService {
  static async getAll(params?: { client_id?: number; status?: string; plant_id?: number; include_children?: boolean; without_budget?: boolean; is_additional?: boolean }): Promise<Project[]> {
    let url = `${API_BASE_URL}/projects`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.client_id) qs.append('client_id', params.client_id.toString());
      if (params.status) qs.append('status', params.status);
      if (params.plant_id) qs.append('plant_id', params.plant_id.toString());
      if (params.include_children) qs.append('include_children', 'true');
      if (params.without_budget) qs.append('without_budget', 'true');
      if (params.is_additional !== undefined) qs.append('is_additional', String(params.is_additional));
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener proyectos');
    const data = await response.json();
    return data.data || data;
  }

  static async getById(id: number): Promise<Project> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}`);
    if (!response.ok) throw new Error('Error al obtener proyecto');
    const data = await response.json();
    return data.data || data;
  }

  static async create(projectData: CreateProjectData): Promise<Project> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error('Error al crear proyecto');
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, projectData: Partial<CreateProjectData>): Promise<Project> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    if (!response.ok) throw new Error('Error al actualizar proyecto');
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar proyecto');
  }

  static async getSupervisors(id: number): Promise<ClientSupervisor[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}/supervisors`);
    if (!response.ok) throw new Error('Error al obtener los supervisores del proyecto');
    const data = await response.json();
    return data.data || [];
  }

  static async syncSupervisors(id: number, supervisorIds: number[]): Promise<ClientSupervisor[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}/supervisors`, {
      method: 'PUT',
      body: JSON.stringify({ supervisor_ids: supervisorIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al sincronizar los supervisores del proyecto');
    }
    const data = await response.json();
    return data.data || [];
  }

  static async getWorkDayLogs(id: number, weekStart?: string): Promise<{ week_start: string; week_end: string; days: WorkDayLog[] }> {
    let url = `${API_BASE_URL}/projects/${id}/work-day-logs`;
    if (weekStart) url += `?week_start=${encodeURIComponent(weekStart)}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener la planilla diaria');
    const data = await response.json();
    return data.data;
  }

  static async getWorkDayLogsAll(id: number, from?: string, to?: string): Promise<WorkDayLogWeek[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}/work-day-logs/all${qs}`);
    if (!response.ok) throw new Error('Error al obtener las planillas del proyecto');
    const data = await response.json();
    return data.data || [];
  }

  static async saveWorkDayLogs(id: number, entries: Partial<WorkDayLog>[]): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${id}/work-day-logs`, {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la planilla diaria');
    }
  }
}

// Rubros de Presupuesto (antes "BudgetCategory" — renombrado para no confundir con
// la Categoría gremial/CCT de empleados, que es un concepto distinto)
export interface BudgetItemType {
  id: number;
  name: string;
  // 'days': rubro que se carga y cotiza en días; cada día equivale a 9 hs en la bolsa del proyecto.
  unit_type: 'hours' | 'units' | 'days';
  unit_label: string;
  display_order: number;
  is_active: boolean;
}

export interface CreateBudgetItemTypeData {
  name: string;
  // 'days': rubro que se carga y cotiza en días; cada día equivale a 9 hs en la bolsa del proyecto.
  unit_type: 'hours' | 'units' | 'days';
  unit_label?: string;
  display_order?: number;
  is_active?: boolean;
}

export class BudgetItemTypeService {
  static async getAll(isActive?: boolean): Promise<BudgetItemType[]> {
    let url = `${API_BASE_URL}/budget-item-types`;
    if (isActive !== undefined) url += `?is_active=${isActive}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener rubros de presupuesto');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: CreateBudgetItemTypeData): Promise<BudgetItemType> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budget-item-types`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear rubro de presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: Partial<CreateBudgetItemTypeData>): Promise<BudgetItemType> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budget-item-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar rubro de presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budget-item-types/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar rubro de presupuesto');
    }
  }
}

// Unidades de Medida (para las líneas de materiales de un Presupuesto)
export interface MaterialUnit {
  id: number;
  label: string;
  display_order: number;
  is_active: boolean;
}

export interface CreateMaterialUnitData {
  label: string;
  display_order?: number;
  is_active?: boolean;
}

export class MaterialUnitService {
  static async getAll(isActive?: boolean): Promise<MaterialUnit[]> {
    let url = `${API_BASE_URL}/material-units`;
    if (isActive !== undefined) url += `?is_active=${isActive}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener unidades de medida');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: CreateMaterialUnitData): Promise<MaterialUnit> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/material-units`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear unidad de medida');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: Partial<CreateMaterialUnitData>): Promise<MaterialUnit> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/material-units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar unidad de medida');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/material-units/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar unidad de medida');
    }
  }
}

// Pañol — Tipos de Herramienta (catálogo chico, alta rápida inline) y Herramientas
export interface ToolType {
  id: number;
  name: string;
  is_active: boolean;
}

export interface CreateToolTypeData {
  name: string;
  is_active?: boolean;
}

export class ToolTypeService {
  static async getAll(isActive?: boolean): Promise<ToolType[]> {
    let url = `${API_BASE_URL}/tool-types`;
    if (isActive !== undefined) url += `?is_active=${isActive}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener tipos de herramienta');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: CreateToolTypeData): Promise<ToolType> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tool-types`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear tipo de herramienta');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: Partial<CreateToolTypeData>): Promise<ToolType> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tool-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar tipo de herramienta');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tool-types/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar tipo de herramienta');
    }
  }
}

export type ToolStatus = 'available' | 'reserved' | 'delivered' | 'in_repair' | 'retired' | 'lost';

export interface Tool {
  id: number;
  tool_type_id: number;
  toolType?: ToolType;
  name: string;
  reference_code: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  status: ToolStatus;
  notes?: string | null;
  repair_responsible_id?: number | null;
  repairResponsible?: { id: number; name: string; lastname: string } | null;
}

export interface CreateToolData {
  tool_type_id: number;
  name: string;
  reference_code: string;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}

// reference_code queda afuera a propósito: el backend nunca la acepta en el update (ver
// toolController.js#update) — no editable una vez creada la herramienta.
export type UpdateToolData = Partial<Omit<CreateToolData, 'reference_code'>>;

export interface ToolStatusLogEntry {
  id: number;
  tool_id: number;
  from_status?: string;
  to_status: string;
  changed_by: number;
  changed_at: string;
  notes?: string;
  changedByUser?: { id: number; name: string; lastname: string };
  responsible_employee_id?: number | null;
  responsibleEmployee?: { id: number; name: string; lastname: string } | null;
}

export class ToolService {
  static async getAll(params?: { tool_type_id?: number; status?: ToolStatus; q?: string }): Promise<Tool[]> {
    let url = `${API_BASE_URL}/tools`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.tool_type_id) qs.append('tool_type_id', params.tool_type_id.toString());
      if (params.status) qs.append('status', params.status);
      if (params.q) qs.append('q', params.q);
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener herramientas');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<Tool> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools/${id}`);
    if (!response.ok) throw new Error('Error al obtener la herramienta');
    const data = await response.json();
    return data.data;
  }

  static async create(body: CreateToolData): Promise<Tool> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear la herramienta');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: UpdateToolData): Promise<Tool> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar la herramienta');
    }
    const data = await response.json();
    return data.data;
  }

  static async changeStatus(id: number, status: ToolStatus, notes?: string, responsibleEmployeeId?: number): Promise<Tool> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes, responsible_employee_id: responsibleEmployeeId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar el estado');
    }
    const data = await response.json();
    return data.data;
  }

  static async getStatusHistory(id: number): Promise<ToolStatusLogEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools/${id}/status-history`);
    if (!response.ok) throw new Error('Error al obtener el historial de estados');
    const data = await response.json();
    return data.data || [];
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/tools/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar la herramienta');
    }
  }
}

// Presupuestos / Cotizaciones
export type BudgetCurrency = 'ARS' | 'USD';

// Proveedor mínimo para el catálogo de materiales (ABM rápido, solo nombre). "Sin especificar"
// (is_system) aloja los costos sin proveedor y no se puede renombrar ni borrar.
export interface MaterialProvider {
  id: number;
  razonSocial: string;
  is_system: boolean;
}

// Precio de un Material con un Proveedor. cost null = el proveedor lo tiene pero sin precio
// cargado (o el usuario no tiene material_costs_read: el backend vacía cost/currency pero deja
// el proveedor, para que el nombre se siga viendo).
export interface MaterialProviderPrice {
  id?: number;
  material_id?: number;
  provider_id: number;
  provider?: MaterialProvider;
  cost: number | null;
  currency: BudgetCurrency | null;
}

// Catálogo de Materiales. Todo costo es por proveedor (providerPrices).
export interface Material {
  id: number;
  description: string;
  material_unit_id: number;
  materialUnit?: MaterialUnit;
  kg_per_meter?: number | null;
  providerPrices?: MaterialProviderPrice[];
  is_active: boolean;
}

export interface MaterialProviderPriceInput {
  provider_id: number;
  cost: number | null;
  currency: BudgetCurrency | null;
}

export interface CreateMaterialData {
  description: string;
  material_unit_id: number;
  kg_per_meter?: number | null;
  // Semántica de reemplazo: los proveedores ausentes se borran. Ignorado sin material_costs_read.
  provider_prices?: MaterialProviderPriceInput[];
  is_active?: boolean;
}

export interface MaterialImportRow {
  description: string;
  unit: string;
  provider: string;
  cost: number | null;
  currency: BudgetCurrency | null;
  kg_per_meter: number | null;
}

// Resultado por fila de POST /materials/import, con el costo efectivo guardado.
export interface MaterialImportCommitRow {
  material_id: number;
  material_unit_id: number;
  unit: string;
  provider_id: number;
  provider_name: string;
  cost: number | null;
  currency: BudgetCurrency | null;
}

export interface MaterialImportSummary {
  materials_created: number;
  units_created: number;
  providers_created: number;
  prices_updated: number;
}

// Registro de auditoría append-only del costo de un Material — nunca se edita ni se borra.
export interface MaterialCostHistoryEntry {
  id: number;
  material_id: number;
  provider_id?: number | null;
  provider?: MaterialProvider | null;
  cost: number;
  currency: BudgetCurrency;
  changed_by: number;
  changedBy?: { id: number; name: string; lastname: string };
  createdAt: string;
}

export class MaterialProviderService {
  static async getAll(): Promise<MaterialProvider[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/providers`);
    if (!response.ok) throw new Error('Error al obtener proveedores');
    const data = await response.json();
    return data.data || [];
  }

  // Find-or-create por nombre (case-insensitive): crear uno existente devuelve el existente.
  static async create(razonSocial: string): Promise<MaterialProvider> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/providers`, {
      method: 'POST',
      body: JSON.stringify({ razonSocial }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear proveedor');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, razonSocial: string): Promise<MaterialProvider> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ razonSocial }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar proveedor');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/providers/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar proveedor');
    }
  }
}

export class MaterialService {
  static async getAll(params?: { q?: string; is_active?: boolean }): Promise<Material[]> {
    let url = `${API_BASE_URL}/materials`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.q) qs.append('q', params.q);
      if (params.is_active !== undefined) qs.append('is_active', String(params.is_active));
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener materiales');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: CreateMaterialData): Promise<Material> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear material');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: Partial<CreateMaterialData>): Promise<Material> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar material');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar material');
    }
  }

  static async importPreview(file: File): Promise<MaterialImportRow[]> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/import-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar el Excel de materiales');
    }
    const data = await response.json();
    return data.data || [];
  }

  // Confirma el import (catálogo y presupuesto) en una sola transacción: crea unidades,
  // proveedores, materiales y precios que falten.
  static async importCommit(rows: MaterialImportRow[]): Promise<{ data: MaterialImportCommitRow[]; summary: MaterialImportSummary }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/import`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar materiales');
    }
    return response.json();
  }

  static async getCostHistory(materialId: number): Promise<MaterialCostHistoryEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/materials/${materialId}/cost-history`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el historial de costos');
    }
    const data = await response.json();
    return data.data || [];
  }
}

export interface BudgetLaborLine {
  id?: number;
  budget_id?: number;
  budget_item_type_id: number;
  itemType?: BudgetItemType;
  quantity: number;
  unit_price: number;
  currency?: BudgetCurrency | null;
  estimated_total?: number;
  // Horas por unidad cuando el rubro es por días (9) — null en rubros por horas/unidades y en
  // líneas viejas. Lo fija el backend; se guarda en la línea.
  hours_per_day?: number | null;
  // Descripción de la línea, para el Detalle de mano de obra.
  description?: string | null;
  // Horas cotizadas de la línea (en un rubro por días: días × 9). Lo calcula el backend.
  hours?: number;
  notes?: string;
  // Horas ya cargadas de este rubro en el proyecto vinculado — informativo, solo presente
  // cuando el presupuesto ya generó/está vinculado a un proyecto con horas reales.
  consumed_hours?: number;
}

export interface BudgetMaterialItem {
  id?: number;
  budget_id?: number;
  material_id?: number | null;
  material?: Material;
  // Proveedor del que se tomó el costo (visible aunque no se tenga material_costs_read).
  provider_id?: number | null;
  provider?: MaterialProvider | null;
  description: string;
  quantity: number;
  material_unit_id: number;
  materialUnit?: MaterialUnit;
  unit_price: number;
  currency?: BudgetCurrency | null;
  total_price?: number;
  // % de margen sobre material_cost_snapshot — unit_price se calcula desde acá en el backend,
  // no se carga directo. Presente solo si el usuario tiene budget_prices_read.
  margin_percent?: number;
  // Presentes solo si el usuario tiene material_costs_read (igual que los precios por proveedor del Material)
  material_cost_snapshot?: number | null;
  material_cost_currency?: BudgetCurrency | null;
  notes?: string;
}

export interface Budget {
  id: number;
  number: string;
  title: string;
  client_id: number;
  plant_id?: number;
  currency: BudgetCurrency;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  parent_project_id?: number;
  existing_project_id?: number;
  project_id?: number;
  description?: string;
  start_date?: string;
  end_date?: string;
  validity_days?: number;
  notes?: string;
  // N° de OT libre que asigna el cliente — solo para rastreo, sin gating de permisos.
  work_order_number?: string | null;
  // Bonificación % post-presentación, discriminada mano de obra / material — presentes solo
  // si el usuario tiene budget_prices_read (ver FLOWS.md).
  labor_discount_percent?: number;
  material_discount_percent?: number;
  sent_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  approved_by?: number;
  approved_document_url?: string;
  approved_by_supervisor_id?: number;
  created_by: number;
  // Pedido de Cotización que originó este presupuesto (opcional — ver utils/api.ts#QuoteRequest)
  quote_request_id?: number | null;
  client?: { id: number; razonSocial: string };
  plant?: { id: number; name: string };
  parentProject?: { id: number; name: string; code: string };
  existingProject?: { id: number; name: string; code: string };
  project?: { id: number; name: string; code: string; is_additional?: boolean; parent?: { id: number; name: string; code: string } };
  createdBy?: { id: number; name: string; lastname: string };
  approvedBy?: { id: number; name: string; lastname: string };
  // Contacto externo del cliente que aprobó — distinto de approvedBy (usuario interno)
  approvedBySupervisor?: { id: number; name: string; lastname: string; email?: string; phone?: string };
  // El N° de cotización del cliente vive en la PC, no acá — el presupuesto lo lee a través de
  // esta relación (ver FLOWS.md flujo 27).
  // `assigned_to_me` lo calcula el backend desde los responsables del PC (withTotals) — llega
  // como booleano, no viene la lista de responsables.
  // Solo en presupuestos aprobados y para quien tiene invoices_read (chip en el listado).
  billing_status?: { status: BillingStatus; has_pending_payment: boolean; has_balance: boolean };
  quoteRequest?: {
    id: number;
    number: string;
    client_quote_number?: string | null;
    due_date: string;
    status: string;
    assigned_to_me?: boolean;
    // Pliego adjunto del PC — solo viene si el usuario tiene acceso al PC (asignado o con
    // quote_requests_read).
    files?: { id: number; file_url: string; file_name?: string; size_bytes?: number }[];
  };
  laborLines?: BudgetLaborLine[];
  materialItems?: BudgetMaterialItem[];
  totals_by_currency?: Record<BudgetCurrency, number>;
  // Subtotal bruto de materiales (sin bonificación). Siempre viene; es lo que ve quien no tiene
  // budget_prices_read, que no recibe totals_by_currency (incluye mano de obra).
  materials_totals_by_currency?: Record<BudgetCurrency, number>;
  createdAt: string;
}

export interface CreateBudgetData {
  title: string;
  client_id?: number;
  plant_id?: number;
  currency?: BudgetCurrency;
  parent_project_id?: number;
  existing_project_id?: number;
  description?: string;
  start_date?: string;
  end_date?: string;
  validity_days?: number;
  notes?: string;
  work_order_number?: string | null;
  quote_request_id?: number;
  laborLines?: BudgetLaborLine[];
  materialItems?: BudgetMaterialItem[];
}

export interface BudgetMaterialImportRow {
  description: string;
  quantity: number;
  unit: string;
  provider: string;
  // Costo real del material (lo que sale comprarlo) — nunca el precio al cliente. null si el
  // archivo no lo trae.
  cost: number | null;
  currency: BudgetCurrency | null;
  kg_per_meter: number | null;
  total_price: number;
}

export class BudgetService {
  static async getAll(params?: { status?: string; client_id?: number }): Promise<Budget[]> {
    let url = `${API_BASE_URL}/budgets`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.status) qs.append('status', params.status);
      if (params.client_id) qs.append('client_id', params.client_id.toString());
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener presupuestos');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}`);
    if (!response.ok) throw new Error('Error al obtener presupuesto');
    const data = await response.json();
    return data.data;
  }

  static async create(body: CreateBudgetData): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async update(id: number, body: Partial<CreateBudgetData>): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar presupuesto');
    }
  }

  static async changeStatus(id: number, status: string, options?: { rejection_reason?: string; file?: File; approved_by_supervisor_id?: number }): Promise<Budget> {
    const formData = new FormData();
    formData.append('status', status);
    if (options?.rejection_reason) formData.append('rejection_reason', options.rejection_reason);
    if (options?.file) formData.append('file', options.file);
    if (options?.approved_by_supervisor_id) formData.append('approved_by_supervisor_id', String(options.approved_by_supervisor_id));

    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}/status`, {
      method: 'PUT',
      headers: {
        // Dejar que fetch ponga el header Content-Type correcto para FormData
        'Content-Type': 'SKIP_MULTIPART_HEADER',
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar el estado del presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async generateProject(id: number): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}/generate-project`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al generar el proyecto');
    }
    const data = await response.json();
    return data.data;
  }

  // quote_request_id no se copia solo del original: queda a criterio del usuario si el duplicado
  // sigue atado al mismo Pedido de Cotización (y por lo tanto hereda su N° de cotización del
  // cliente) o nace libre (ver FLOWS.md).
  static async duplicate(id: number, options?: { quote_request_id?: number }): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al duplicar el presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  // Bonificación post-presentación: separada de update porque solo se puede aplicar desde
  // "sent" en adelante (update general solo permite editar en "draft") — ver FLOWS.md.
  static async applyDiscount(id: number, labor_discount_percent: number, material_discount_percent: number): Promise<Budget> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/budgets/${id}/discount`, {
      method: 'PUT',
      body: JSON.stringify({ labor_discount_percent, material_discount_percent }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aplicar la bonificación');
    }
    const data = await response.json();
    return data.data;
  }

  static async importMaterials(file: File): Promise<BudgetMaterialImportRow[]> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/budgets/materials/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al importar el Excel de materiales');
    }
    const data = await response.json();
    return data.data || [];
  }
}

// Pedido de Cotización (PC) — paso previo opcional a un Presupuesto: documento que manda el
// cliente, vencimiento de presentación y responsables asignados. quote_request_id en Budget es
// nullable, así que un Presupuesto se sigue pudiendo crear sin pasar por acá (ver FLOWS.md).
export interface QuoteRequestFile {
  id: number;
  quote_request_id: number;
  file_url: string;
  file_name?: string;
  mime_type?: string;
  size_bytes?: number;
  uploaded_by: number;
  uploader?: { id: number; name: string; lastname: string };
  createdAt: string;
}

export interface QuoteRequest {
  id: number;
  // Código interno nuestro (PC-YYYY-NNN)
  number: string;
  // Número con el que el CLIENTE identifica su pedido. Texto libre (cada cliente usa su propia
  // nomenclatura) y obligatorio al cargar la PC. Los Presupuestos de esta PC lo leen de acá.
  client_quote_number?: string | null;
  title: string;
  client_id: number;
  plant_id?: number | null;
  description?: string;
  received_at?: string | null;
  due_date: string;
  status: 'pending' | 'in_progress' | 'pending_review' | 'quoted' | 'cancelled';
  notes?: string;
  created_by: number;
  client?: { id: number; razonSocial: string };
  plant?: { id: number; name: string };
  createdBy?: { id: number; name: string; lastname: string };
  assignees?: { id: number; name: string; lastname: string }[];
  files?: QuoteRequestFile[];
  budgets?: { id: number; number: string; status: string; title: string; created_by?: number; sent_at?: string | null }[];
  createdAt: string;
  // Cuándo salió la cotización al cliente (último presupuesto enviado y no rechazado) — reemplaza
  // al vencimiento en el chip una vez que el PC está cotizado.
  last_sent_at?: string | null;
  // Último comentario del ida y vuelta dirigido a MÍ (resuelto por el backend según el usuario
  // de la request) — liviano a propósito, para el aviso del tablero. El hilo completo se pide
  // aparte con getHistory().
  last_comment?: { comment: string; at: string; from: { name: string; lastname: string } } | null;
}

export interface CreateQuoteRequestData {
  title: string;
  client_quote_number: string;
  client_id: number;
  plant_id?: number | null;
  description?: string;
  received_at?: string | null;
  due_date: string;
  notes?: string;
  assignee_ids?: number[];
  files?: File[];
  // Mensaje dirigido a los destinatarios de ESTA operación puntual (alta o reasignación) — no
  // es lo mismo que `notes`, que son notas generales del pedido. Queda en la línea de tiempo
  // (ver FLOWS.md flujo 27g) y viaja en el push.
  comment?: string;
}

export interface QuoteRequestHistoryEntry {
  id: string;
  source: 'quote_request' | 'budget';
  event: 'assigned' | 'delivered' | 'returned' | 'reassigned' | 'cancelled' | 'reopened' | 'quoted'
    | 'budget_sent' | 'budget_approved' | 'budget_rejected';
  at: string;
  actor: { id: number; name: string; lastname: string } | null;
  recipients: { id: number; name: string; lastname: string }[];
  comment?: string | null;
  from_status?: string | null;
  to_status: string;
  budget: { id: number; number: string } | null;
}

export class QuoteRequestService {
  static async getAll(params?: { status?: string; client_id?: number; assigned_to_me?: boolean }): Promise<QuoteRequest[]> {
    let url = `${API_BASE_URL}/quote-requests`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.status) qs.append('status', params.status);
      if (params.client_id) qs.append('client_id', params.client_id.toString());
      if (params.assigned_to_me) qs.append('assigned_to_me', 'true');
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener pedidos de cotización');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<QuoteRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}`);
    if (!response.ok) throw new Error('Error al obtener el pedido de cotización');
    const data = await response.json();
    return data.data;
  }

  private static buildFormData(body: Partial<CreateQuoteRequestData>): FormData {
    const formData = new FormData();
    if (body.title !== undefined) formData.append('title', body.title);
    if (body.client_quote_number !== undefined) formData.append('client_quote_number', body.client_quote_number);
    if (body.client_id !== undefined) formData.append('client_id', String(body.client_id));
    if (body.plant_id !== undefined) formData.append('plant_id', body.plant_id ? String(body.plant_id) : '');
    if (body.description !== undefined) formData.append('description', body.description || '');
    if (body.received_at !== undefined) formData.append('received_at', body.received_at || '');
    if (body.due_date !== undefined) formData.append('due_date', body.due_date);
    if (body.notes !== undefined) formData.append('notes', body.notes || '');
    if (body.assignee_ids !== undefined) formData.append('assignee_ids', JSON.stringify(body.assignee_ids));
    if (body.comment !== undefined) formData.append('comment', body.comment || '');
    (body.files || []).forEach((file) => formData.append('files', file));
    return formData;
  }

  static async create(body: CreateQuoteRequestData): Promise<QuoteRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: this.buildFormData(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el pedido de cotización');
    }
    const data = await response.json();
    return data.data;
  }

  // Reemplazo total de responsables (no merge) — refleja el handoff explícito entre el
  // responsable y gerencia en cada paso. No acepta archivos: se suman aparte con addFiles.
  static async update(id: number, body: Omit<Partial<CreateQuoteRequestData>, 'files'>): Promise<QuoteRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el pedido de cotización');
    }
    const data = await response.json();
    return data.data;
  }

  static async changeStatus(id: number, status: QuoteRequest['status'], assigneeIds?: number[], comment?: string): Promise<QuoteRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, assignee_ids: assigneeIds, comment }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar el estado del pedido de cotización');
    }
    const data = await response.json();
    return data.data;
  }

  // Línea de tiempo unificada PC + Presupuesto (ver FLOWS.md flujo 27g).
  static async getHistory(id: number): Promise<QuoteRequestHistoryEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}/history`);
    if (!response.ok) throw new Error('Error al obtener el historial del pedido de cotización');
    const data = await response.json();
    return data.data || [];
  }

  static async addFiles(id: number, files: File[]): Promise<QuoteRequest> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir archivos');
    }
    const data = await response.json();
    return data.data;
  }

  static async removeFile(id: number, fileId: number): Promise<QuoteRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}/files/${fileId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el archivo');
    }
    const data = await response.json();
    return data.data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/quote-requests/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el pedido de cotización');
    }
  }
}

// Tarifa por cliente y rubro de mano de obra (ej. "Hs Grúa" varía según el cliente) — valor
// actual + historial append-only, mismo patrón que Material/MaterialCostHistory. Montado bajo
// /clients: hereda el permiso de ruta clients_read/clients_write, y cada endpoint chequea
// budget_prices_read a mano (ver FLOWS.md).
export interface ClientItemRate {
  id: number;
  client_id: number;
  budget_item_type_id: number;
  itemType?: BudgetItemType;
  current_rate: number;
  currency: BudgetCurrency;
  updated_by: number;
  updatedAt: string;
}

export interface ClientItemRateHistoryEntry {
  id: number;
  client_id: number;
  budget_item_type_id: number;
  rate: number;
  currency: BudgetCurrency;
  changed_by: number;
  changedBy?: { id: number; name: string; lastname: string };
  createdAt: string;
}

export class ClientItemRateService {
  static async getAll(clientId: number): Promise<ClientItemRate[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${clientId}/item-rates`);
    if (!response.ok) throw new Error('Error al obtener tarifas del cliente');
    const data = await response.json();
    return data.data || [];
  }

  static async upsert(clientId: number, itemTypeId: number, current_rate: number, currency: BudgetCurrency): Promise<ClientItemRate> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${clientId}/item-rates/${itemTypeId}`, {
      method: 'PUT',
      body: JSON.stringify({ current_rate, currency }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la tarifa del cliente');
    }
    const data = await response.json();
    return data.data;
  }

  static async getHistory(clientId: number, itemTypeId: number): Promise<ClientItemRateHistoryEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/clients/${clientId}/item-rates/${itemTypeId}/history`);
    if (!response.ok) throw new Error('Error al obtener el historial de tarifas');
    const data = await response.json();
    return data.data || [];
  }
}

// Document Categories (for compliance system)
export interface DocumentCategory {
  id: number;
  name: string;
  description?: string;
  applies_to: 'employee' | 'vehicle' | 'project' | 'company';
  is_plant_specific: boolean;
  createdAt: string;
}

export interface CreateDocumentCategoryData {
  name: string;
  description?: string;
  applies_to: 'employee' | 'vehicle' | 'project' | 'company';
  is_plant_specific?: boolean;
}

export class DocumentCategoryService {
  static async getAll(appliesTo?: string): Promise<DocumentCategory[]> {
    let url = `${API_BASE_URL}/document-categories`;
    if (appliesTo) url += `?applies_to=${appliesTo}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener categorías de documentos');
    const data = await response.json();
    return data.data || data;
  }

  static async create(body: CreateDocumentCategoryData): Promise<DocumentCategory> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/document-categories`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear categoría de documento');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, body: Partial<CreateDocumentCategoryData>): Promise<DocumentCategory> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/document-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar categoría de documento');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/document-categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar categoría de documento');
    }
  }
}

// Plant Requirements (for compliance system)
export interface PlantRequirement {
  id: number;
  plant_id: number;
  document_category_id: number;
  is_mandatory: boolean;
  notes?: string;
  documentCategory?: { id: number; name: string; applies_to: string; is_plant_specific: boolean };
  createdAt: string;
}

export class PlantRequirementService {
  static async getAll(plantId: number): Promise<PlantRequirement[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${plantId}/requirements`);
    if (!response.ok) throw new Error('Error al obtener requisitos');
    const data = await response.json();
    return data.data || data;
  }

  static async create(plantId: number, body: { document_category_id: number; is_mandatory?: boolean; notes?: string }): Promise<PlantRequirement> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${plantId}/requirements`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar requisito');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(plantId: number, reqId: number, body: { is_mandatory?: boolean; notes?: string }): Promise<PlantRequirement> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${plantId}/requirements/${reqId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar requisito');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(plantId: number, reqId: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${plantId}/requirements/${reqId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar requisito');
    }
  }
}

// Compliance types
export interface ComplianceDetail {
  requirement: {
    id: number;
    category_name: string;
    is_mandatory: boolean;
    is_plant_specific: boolean;
  };
  status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
  document: { id: number; title: string; expiration_date?: string } | null;
}

export interface EmployeeCompliance {
  employee: { id: number; name: string; lastname: string };
  status: 'compliant' | 'partial' | 'non_compliant';
  summary: { total: number; met: number; expiring: number; missing: number; expired: number };
  details: ComplianceDetail[];
}

export interface PlantComplianceResult {
  requirements: { id: number; category_name: string; is_mandatory: boolean; is_plant_specific: boolean }[];
  employees: EmployeeCompliance[];
}

export interface ProjectTeamMember {
  employee: { id: number; name: string; lastname: string };
  hours: { regular: number; overtime_50: number; overtime_100: number; weighted_total: number };
  entries: number;
  first_date: string;
  last_date: string;
  compliance: { status: string; summary: { total: number; met: number; expiring: number; missing: number; expired: number } } | null;
}

export interface ProjectTeamResult {
  project: Project;
  team: ProjectTeamMember[];
}

export class ComplianceService {
  static async getPlantCompliance(plantId: number): Promise<PlantComplianceResult> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/plants/${plantId}/compliance`);
    if (!response.ok) throw new Error('Error al obtener habilitaciones');
    const data = await response.json();
    return data.data;
  }

  static async getProjectTeam(projectId: number): Promise<ProjectTeamResult> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/projects/${projectId}/team`);
    if (!response.ok) throw new Error('Error al obtener equipo del proyecto');
    const data = await response.json();
    return data.data;
  }
}

export class CategoryService {
  static async getAll(filters?: { guild_id?: number }): Promise<Category[]> {
    const params = new URLSearchParams();
    if (filters?.guild_id) {
      params.append('guild_id', filters.guild_id.toString());
    }
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/categories${queryString}`);
    if (!response.ok) throw new Error('Error al obtener categorías');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: { name: string; guild_hourly_rate: number; guild_id: number }): Promise<Category> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear categoría');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async update(id: number, body: { name?: string; guild_hourly_rate?: number; guild_id?: number }): Promise<Category> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar categoría');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar categoría');
    }
  }

  static async applyBonus(id: number, body: ApplyCategoryBonusData): Promise<ApplyCategoryBonusResponse> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/categories/${id}/apply-bonus`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aplicar la suma no remunerativa');
    }
    return response.json();
  }
}

export interface ApplyCategoryBonusData {
  pay_period_id: number;
  amount: number;
  label: string;
}

export interface ApplyCategoryBonusResultItem {
  employee_id: number;
  name: string;
}

export interface ApplyCategoryBonusSkippedItem extends ApplyCategoryBonusResultItem {
  reason: string;
}

export interface ApplyCategoryBonusResponse {
  message: string;
  created: ApplyCategoryBonusResultItem[];
  skipped: ApplyCategoryBonusSkippedItem[];
}

// TimeEntry Service
export class TimeEntryService {
  static async getAll(filters?: { employee_id?: number; project_id?: number; plant_id?: number; date_from?: string; date_to?: string; status?: string; include_voided?: boolean }): Promise<TimeEntry[]> {
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

  static async void(id: number, reason?: string): Promise<TimeEntry> {
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
  hours?: number | null;
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

  static async create(payload: { employee_id: number; date: string; status: string; hours?: number | null; notes?: string; file?: File }): Promise<Attendance> {
    const formData = new FormData();
    formData.append('employee_id', String(payload.employee_id));
    formData.append('date', payload.date);
    formData.append('status', payload.status);
    if (payload.hours != null) formData.append('hours', String(payload.hours));
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

  static async update(id: number, payload: { status: string; hours?: number | null; notes?: string; file?: File }): Promise<Attendance> {
    const formData = new FormData();
    formData.append('status', payload.status);
    if (payload.hours != null) formData.append('hours', String(payload.hours));
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

// LeaveRequest Service
export class LeaveRequestService {
  static async getAll(filters?: { employee_id?: number; leave_type?: string; status?: string; year?: number }): Promise<LeaveRequest[]> {
    const params = new URLSearchParams();
    if (filters?.employee_id) params.append('employee_id', filters.employee_id.toString());
    if (filters?.leave_type) params.append('leave_type', filters.leave_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.year) params.append('year', filters.year.toString());
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/leave-requests?${params.toString()}`);
    if (!response.ok) throw new Error('Error al obtener solicitudes de licencia');
    return (await response.json()).data || [];
  }

  static async getBalance(employeeId: number): Promise<LeaveBalance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/leave-requests/balance/${employeeId}`);
    if (!response.ok) throw new Error('Error al obtener balance de licencia');
    return (await response.json()).data;
  }

  static async create(data: FormData): Promise<LeaveRequest> {
    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/leave-requests`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    });
    if (!response.ok) throw new Error('Error al crear solicitud');
    return (await response.json()).data;
  }

  static async approve(id: number): Promise<LeaveRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/leave-requests/${id}/approve`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al aprobar solicitud');
    return (await response.json()).data;
  }

  static async reject(id: number, notes?: string): Promise<LeaveRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/leave-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error('Error al rechazar solicitud');
    return (await response.json()).data;
  }

  static async cancel(id: number): Promise<LeaveRequest> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/leave-requests/${id}/cancel`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al cancelar solicitud');
    return (await response.json()).data;
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
export interface PepSummaryDetail {
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  total: number;
}

export interface PepSummary {
  pep_oca?: PepSummaryDetail;
  pep_regular?: PepSummaryDetail;
  total_pep_hours?: number;
}

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
  gross_amount: number;
  advances_deducted: number;
  advances?: Pick<SalaryAdvance, 'id' | 'employee_id' | 'amount' | 'payment_method' | 'date'>[];
  loan_installments_deducted: number;
  loanInstallments?: Pick<LoanInstallment, 'id' | 'loan_id' | 'installment_number' | 'principal_amount' | 'interest_amount' | 'total_amount'>[];
  deductions?: number;
  extra_payments_notes?: string;
  deductions_notes?: string;
  adjustments?: PayrollAdjustment[];
  net_amount: number;
  late_count: number;
  absent_count: number;
  status: 'draft' | 'confirmed' | 'paid';
  paid_at?: string | null;
  signature_url?: string | null;
  signature_key?: string | null;
  signature_name?: string | null;
  signed_at?: string | null;
  payPeriod?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  lines?: PayrollLine[];
  pep_summary?: PepSummary;
  rate_fallback_warnings?: { concept_id: number; label: string }[];
}

export class PayrollService {
  // El status de PayPeriod es global — puede seguir "open" aunque la liquidación puntual de un
  // empleado ya esté confirmada/pagada. Esto devuelve, liviano, el status real por período de
  // UN empleado, para no ofrecer quincenas ya cerradas para él en combos de reasignación.
  static async getPeriodStatusesByEmployee(employeeId: number): Promise<{ id: number; pay_period_id: number; status: 'draft' | 'confirmed' | 'paid' }[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/employee/${employeeId}/period-statuses`);
    if (!response.ok) throw new Error('Error al obtener el estado de liquidaciones del empleado');
    const data = await response.json();
    return data.data || [];
  }

  static async getByPeriod(periodId: number): Promise<PayrollEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${periodId}`);
    if (!response.ok) throw new Error('Error al obtener liquidaciones');
    const data = await response.json();
    return data.data || [];
  }

  static async getLines(entryId: number): Promise<{ data: PayrollLine[]; entry: PayrollEntry }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/entry/${entryId}/lines`);
    if (!response.ok) throw new Error('Error al obtener líneas de liquidación');
    return await response.json();
  }

  static async generate(periodId: number): Promise<{ entries: PayrollEntry[] }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll/${periodId}/generate`, { method: 'POST' });
    if (!response.ok) throw new Error('Error al generar liquidación');
    const data = await response.json();
    return { entries: data.data || [] };
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

  static async attachSignature(id: number, signature: File): Promise<PayrollEntry> {
    const formData = new FormData();
    formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/payroll/${id}/signature`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al guardar la firma');
    return (await response.json()).data;
  }
}

// Salary Advance Service
export interface SalaryAdvance {
  id: number;
  employee_id: number;
  amount: number;
  requested_amount?: number | null;
  date: string;
  payment_method?: 'efectivo' | 'transferencia' | null;
  pay_period_id?: number;
  notes?: string;
  rejection_reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by?: number;
  approved_by?: number;
  approved_at?: string | null;
  paid_by?: number;
  paid_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: number;
  cancellation_reason?: string | null;
  payment_proof_url?: string | null;
  payment_proof_key?: string | null;
  payment_proof_name?: string | null;
  signature_url?: string | null;
  signature_key?: string | null;
  signature_name?: string | null;
  conflict_warning?: string | null;
  source?: 'manual' | 'biweekly_auto';
  employee?: Employee;
  payPeriod?: PayPeriod;
}

export interface DuplicateAdvanceConflict {
  employee_id: number;
  existing: { id: number; amount: number; status: string; paid_at: string | null };
}

export class DuplicateAdvanceError extends Error {
  conflicts: DuplicateAdvanceConflict[];
  constructor(message: string, conflicts: DuplicateAdvanceConflict[]) {
    super(message);
    this.name = 'DuplicateAdvanceError';
    this.conflicts = conflicts;
  }
}

async function throwSalaryAdvanceError(response: Response, fallback: string): Promise<never> {
  const err = await response.json().catch(() => ({}));
  if (response.status === 409 && err.error === 'duplicate_advance') {
    throw new DuplicateAdvanceError(err.message || fallback, err.conflicts || []);
  }
  throw new Error(err.error || fallback);
}

export class SalaryAdvanceService {
  static async getAll(params?: { employee_id?: number; status?: string; paid?: boolean }): Promise<SalaryAdvance[]> {
    const query = new URLSearchParams();
    if (params?.employee_id) query.append('employee_id', params.employee_id.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.paid !== undefined) query.append('paid', params.paid.toString());
    const qs = query.toString();
    const url = qs ? `${API_BASE_URL}/salary-advances?${qs}` : `${API_BASE_URL}/salary-advances`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener adelantos');
    return (await response.json()).data || [];
  }

  static async approve(id: number, data?: { amount?: number; payment_method?: 'efectivo' | 'transferencia'; pay_period_id?: number; mark_as_paid?: boolean; confirmDuplicate?: boolean }, file?: File | null, signature?: File | null): Promise<SalaryAdvance> {
    const formData = new FormData();
    if (data?.amount !== undefined) formData.append('amount', data.amount.toString());
    if (data?.payment_method) formData.append('payment_method', data.payment_method);
    if (data?.pay_period_id !== undefined) formData.append('pay_period_id', data.pay_period_id.toString());
    if (data?.mark_as_paid !== undefined) formData.append('mark_as_paid', data.mark_as_paid.toString());
    if (data?.confirmDuplicate) formData.append('confirm_duplicate', 'true');
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/salary-advances/${id}/approve`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) return throwSalaryAdvanceError(response, 'Error al aprobar adelanto');
    return (await response.json()).data;
  }

  static async reject(id: number, notes?: string): Promise<SalaryAdvance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advances/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error('Error al rechazar adelanto');
    return (await response.json()).data;
  }

  static async markAsPaid(id: number, data: { payment_method: 'efectivo' | 'transferencia' }, file?: File | null, signature?: File | null): Promise<SalaryAdvance> {
    const formData = new FormData();
    formData.append('payment_method', data.payment_method);
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/salary-advances/${id}/mark-paid`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al marcar el adelanto como pagado');
    return (await response.json()).data;
  }

  static async uploadPaymentProof(id: number, file: File): Promise<SalaryAdvance> {
    const formData = new FormData();
    formData.append('file', file);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/salary-advances/${id}/payment-proof`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al cargar el comprobante');
    return (await response.json()).data;
  }

  static async create(payload: {
    employee_id?: number;
    employee_ids?: number[];
    amount: number;
    date: string;
    payment_method: 'efectivo' | 'transferencia';
    notes?: string;
    mark_as_paid?: boolean;
    pay_period_id?: number;
    confirmDuplicate?: boolean;
  }, file?: File | null, signature?: File | null): Promise<SalaryAdvance | SalaryAdvance[]> {
    const formData = new FormData();
    if (payload.employee_id !== undefined) formData.append('employee_id', payload.employee_id.toString());
    if (payload.employee_ids) formData.append('employee_ids', JSON.stringify(payload.employee_ids));
    formData.append('amount', payload.amount.toString());
    formData.append('date', payload.date);
    formData.append('payment_method', payload.payment_method);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.mark_as_paid !== undefined) formData.append('mark_as_paid', payload.mark_as_paid.toString());
    if (payload.pay_period_id !== undefined) formData.append('pay_period_id', payload.pay_period_id.toString());
    if (payload.confirmDuplicate) formData.append('confirm_duplicate', 'true');
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/salary-advances`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) return throwSalaryAdvanceError(response, 'Error al crear adelanto(s)');
    return (await response.json()).data;
  }

  static async reassignPeriod(id: number, pay_period_id: number | null): Promise<SalaryAdvance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advances/${id}/reassign-period`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pay_period_id }),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al reasignar la quincena');
    return (await response.json()).data;
  }

  static async delete(id: number, justification?: string): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advances/${id}`, {
      method: 'DELETE',
      ...(justification ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ justification }) } : {}),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error al anular adelanto');
    }
  }
}

export interface SalaryAdvanceDeletionAlert {
  id: number;
  employee_id: number;
  pay_period_id: number | null;
  amount: number;
  payment_method: 'efectivo' | 'transferencia' | null;
  justification: string;
  deleted_by: number | null;
  created_at: string;
  employee?: Pick<Employee, 'id' | 'name' | 'lastname'>;
  payPeriod?: Pick<PayPeriod, 'id' | 'month' | 'year' | 'type'>;
  deletedBy?: { id: number; name: string; lastname: string };
}

export class SalaryAdvanceDeletionAlertService {
  static async getAll(): Promise<SalaryAdvanceDeletionAlert[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advance-deletion-alerts`);
    if (!response.ok) throw new Error('Error al obtener avisos');
    return (await response.json()).data || [];
  }

  static async dismiss(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/salary-advance-deletion-alerts/${id}/dismiss`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Error al descartar el aviso');
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
  lifespan_months?: number | null;
  notify_days_before?: number | null;
}

export class EppItemService {
  static async getAll(includeInactive = false): Promise<EppItem[]> {
    const url = includeInactive ? `${API_BASE_URL}/epp-items?include_inactive=true` : `${API_BASE_URL}/epp-items`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener catálogo EPP');
    return (await response.json()).data || [];
  }

  static async create(payload: { name: string; category: EppCategory; size_type: EppSizeType; lifespan_months?: number | null; notify_days_before?: number | null }): Promise<EppItem> {
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

  static async update(id: number, payload: { name?: string; category?: EppCategory; size_type?: EppSizeType; lifespan_months?: number | null; notify_days_before?: number | null }): Promise<EppItem> {
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
export type SafetyEquipmentAlertStatus = 'pending' | 'warned' | 'expired_warned' | 'renewed';
export type SafetyEquipmentComputedStatus = 'permanent' | 'valid' | 'expiring_soon' | 'expired' | 'renewed';

export interface SafetyEquipment {
  id: number;
  employee_id: number;
  epp_item_id: number;
  size_delivered?: string;
  quantity: number;
  delivered_date: string;
  return_date?: string;
  expiration_date?: string | null;
  notify_days_before?: number;
  alert_status?: SafetyEquipmentAlertStatus;
  computed_status?: SafetyEquipmentComputedStatus;
  previous_record_id?: number | null;
  renewed_at?: string | null;
  condition?: 'new' | 'good' | 'worn' | 'damaged';
  notes?: string;
  signature_url?: string | null;
  signature_key?: string | null;
  signature_name?: string | null;
  employee?: Employee;
  eppItem?: EppItem;
  renewedBy?: { id: number; name: string; lastname: string };
}

export type SafetyEquipmentStatusFilter = 'current' | 'renewed' | 'permanent' | 'expired' | 'expiring_soon' | 'alert';

export class SafetyEquipmentService {
  static async getAll(filters?: { employee_id?: number; epp_item_id?: number; category?: EppCategory; date_from?: string; date_to?: string; status?: SafetyEquipmentStatusFilter }): Promise<SafetyEquipment[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
    }
    const query = params.toString();
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/safety-equipment${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Error al obtener EPP');
    return (await response.json()).data || [];
  }

  static async create(payload: { employee_id: number; epp_item_id: number; size_delivered?: string; quantity?: number; delivered_date: string; expiration_date?: string | null; condition?: string; notes?: string }, signature?: File | null): Promise<SafetyEquipment> {
    const formData = new FormData();
    formData.append('employee_id', String(payload.employee_id));
    formData.append('epp_item_id', String(payload.epp_item_id));
    if (payload.size_delivered) formData.append('size_delivered', payload.size_delivered);
    formData.append('quantity', String(payload.quantity ?? 1));
    formData.append('delivered_date', payload.delivered_date);
    // Siempre se manda la clave, aunque sea '' (equivalente a null): el backend decide si
    // calcula el vencimiento automáticamente mirando si la clave está presente en el body, no
    // si vale null — con FormData no se puede mandar `null` literal (se tipearía "null").
    formData.append('expiration_date', payload.expiration_date ?? '');
    if (payload.condition) formData.append('condition', payload.condition);
    if (payload.notes) formData.append('notes', payload.notes);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/safety-equipment`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al registrar EPP');
    }
    return (await response.json()).data;
  }

  static async update(id: number, payload: Partial<{ epp_item_id: number; size_delivered: string; quantity: number; delivered_date: string; return_date: string | null; expiration_date: string | null; condition: string; notes: string }>): Promise<SafetyEquipment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/safety-equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar EPP');
    }
    return (await response.json()).data;
  }
}

// Talles adicionales de EPP por empleado (además de los 3 básicos — shoe_size/shirt_size/pant_size
// — que siguen siendo columnas de Employee).
export class EmployeeSizeService {
  static async list(employeeId: number): Promise<EmployeeSize[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${employeeId}/sizes`);
    if (!response.ok) throw new Error('Error al obtener talles');
    return (await response.json()).data || [];
  }

  static async upsert(employeeId: number, payload: { epp_item_id: number; size: string }): Promise<EmployeeSize | null> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employees/${employeeId}/sizes`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar el talle');
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
  entity_name?: string;
  file_url?: string;
  file_name?: string;
  document_category_id?: number;
  target_plant_id?: number;
  documentCategory?: { id: number; name: string; applies_to: string; is_plant_specific: boolean };
  targetPlant?: { id: number; name: string };
  expiration_date?: string;
  notify_days_before: number;
  alert_status: 'pending' | 'warned' | 'expired_warned' | 'resolved';
  computed_status: 'permanent' | 'valid' | 'expiring_soon' | 'expired' | 'resolved';
  status?: string;
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

  static async create(data: { title: string; entity_type: string; entity_id?: number; notes?: string; expiration_date?: string; notify_days_before?: number; is_renewable?: boolean; document_category_id?: number; target_plant_id?: number }, file?: File | null): Promise<EntityDocument> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('entity_type', data.entity_type);
    if (data.entity_id) formData.append('entity_id', data.entity_id.toString());
    if (data.notes) formData.append('notes', data.notes);
    if (data.expiration_date) formData.append('expiration_date', data.expiration_date);
    if (data.notify_days_before) formData.append('notify_days_before', data.notify_days_before.toString());
    if (data.is_renewable !== undefined) formData.append('is_renewable', data.is_renewable.toString());
    if (data.document_category_id) formData.append('document_category_id', data.document_category_id.toString());
    if (data.target_plant_id) formData.append('target_plant_id', data.target_plant_id.toString());
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

// --- SELF-SERVICE (Portal del Empleado) ---
export class SelfService {
  static async getMyProfile(): Promise<Employee> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/profile`);
    if (!response.ok) throw new Error('Error al obtener mi perfil');
    return (await response.json()).data;
  }

  static async getMyDocuments(): Promise<EntityDocument[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/documents`);
    if (!response.ok) throw new Error('Error al obtener mis documentos');
    return (await response.json()).data || [];
  }

  static async getMyTimeEntries(from?: string, to?: string): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const url = `${API_BASE_URL}/me/time-entries${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener mis horas');
    return (await response.json()).data || [];
  }

  static async getMyAttendance(): Promise<Attendance[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/attendance`);
    if (!response.ok) throw new Error('Error al obtener mis ausencias');
    return (await response.json()).data || [];
  }

  static async getMySafetyEquipment(): Promise<SafetyEquipment[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/safety-equipment`);
    if (!response.ok) throw new Error('Error al obtener mi EPP');
    return (await response.json()).data || [];
  }

  static async getMyToolsInRepair(): Promise<Tool[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/tools-in-repair`);
    if (!response.ok) throw new Error('Error al obtener mis herramientas en reparación');
    return (await response.json()).data || [];
  }

  static async getMyAdvances(): Promise<SalaryAdvance[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/salary-advances`);
    if (!response.ok) throw new Error('Error al obtener mis adelantos');
    return (await response.json()).data || [];
  }

  static async requestAdvance(data: { amount: number; notes?: string }): Promise<SalaryAdvance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/salary-advances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Error al solicitar el adelanto');
    return (await response.json()).data;
  }

  static async cancelMyAdvance(id: number): Promise<SalaryAdvance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/salary-advances/${id}/cancel`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Error al cancelar el adelanto');
    return (await response.json()).data;
  }

  static async getMyLoans(): Promise<Loan[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/loans`);
    if (!response.ok) throw new Error('Error al obtener mis préstamos');
    return (await response.json()).data || [];
  }

  static async requestLoan(data: { amount: number; notes?: string; requested_num_installments?: number }): Promise<Loan> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Error al solicitar el préstamo');
    return (await response.json()).data;
  }

  static async cancelMyLoan(id: number): Promise<Loan> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/loans/${id}/cancel`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error((await response.json()).error || 'Error al cancelar el préstamo');
    return (await response.json()).data;
  }

  static async getMyPayroll(): Promise<PayrollEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/payroll`);
    if (!response.ok) throw new Error('Error al obtener mis liquidaciones');
    return (await response.json()).data || [];
  }

  static async getMyLeaveRequests(): Promise<LeaveRequest[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/leave-requests`);
    if (!response.ok) throw new Error('Error al obtener mis solicitudes');
    return (await response.json()).data || [];
  }

  static async getMyVacationBalance(): Promise<LeaveBalance> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/vacation-balance`);
    if (!response.ok) throw new Error('Error al obtener mi saldo de vacaciones');
    return (await response.json()).data;
  }
}

// ==================== PAYROLL FLEXIBLE SYSTEM ====================

export interface Holiday {
  id: number;
  date: string;
  name: string;
}

export interface PayrollConcept {
  id: number;
  name: string;
  code: string;
  calc_type: 'hourly' | 'fixed';
  sort_order: number;
  is_active: boolean;
  is_crane_hours?: boolean;
}

export interface EmployeeRate {
  id: number;
  employee_id: number;
  concept_id: number | null;
  rate: number;
  guild_rate: number | null;
  extras_rate: number | null;
  concept?: PayrollConcept;
}

export interface PayrollLine {
  id: number;
  payroll_entry_id: number;
  concept_id: number | null;
  label: string;
  quantity: number;
  rate: number;
  subtotal: number;
  line_type: 'regular' | 'extras_50' | 'extras_100' | 'holiday' | 'fixed' | 'retroactive' | 'vacation' | 'medical_leave' | 'justified' | 'medical_leave_deduction' | 'vacation_deduction' | 'absence_deduction';
  source_period_id: number | null;
  concept?: PayrollConcept;
}

export class HolidayService {
  static async getAll(year?: number): Promise<Holiday[]> {
    const params = year ? `?year=${year}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/holidays${params}`);
    if (!response.ok) throw new Error('Error al obtener feriados');
    return (await response.json()).data || [];
  }

  static async create(data: { date: string; name: string }): Promise<Holiday> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/holidays`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al crear feriado');
    }
    return (await response.json()).data;
  }

  static async bulkCreate(holidays: { date: string; name: string }[]): Promise<Holiday[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/holidays/bulk`, {
      method: 'POST',
      body: JSON.stringify({ holidays }),
    });
    if (!response.ok) throw new Error('Error al crear feriados');
    return (await response.json()).data || [];
  }

  static async update(id: number, data: { date?: string; name?: string }): Promise<Holiday> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar feriado');
    return (await response.json()).data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/holidays/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar feriado');
  }
}

export class PayrollConceptService {
  static async getAll(activeOnly = false): Promise<PayrollConcept[]> {
    const params = activeOnly ? '?active=true' : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-concepts${params}`);
    if (!response.ok) throw new Error('Error al obtener conceptos');
    return (await response.json()).data || [];
  }

  static async create(data: { name: string; code: string; calc_type?: string; sort_order?: number }): Promise<PayrollConcept> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-concepts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al crear concepto');
    }
    return (await response.json()).data;
  }

  static async update(id: number, data: Partial<PayrollConcept>): Promise<PayrollConcept> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-concepts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar concepto');
    return (await response.json()).data;
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-concepts/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar concepto');
  }
}

export class EmployeeRateService {
  static async getByEmployee(employeeId: number): Promise<EmployeeRate[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employee-rates/${employeeId}`);
    if (!response.ok) throw new Error('Error al obtener tarifas');
    return (await response.json()).data || [];
  }

  static async upsert(data: {
    employee_id: number;
    concept_id?: number | null;
    rate: number;
    guild_rate?: number | null;
    extras_rate?: number | null;
  }): Promise<EmployeeRate> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employee-rates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error al guardar tarifa');
    }
    return (await response.json()).data;
  }

  static async bulkSave(employeeId: number, rates: Array<{
    concept_id?: number | null;
    rate: number;
    guild_rate?: number | null;
    extras_rate?: number | null;
  }>): Promise<EmployeeRate[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employee-rates/bulk`, {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId, rates }),
    });
    if (!response.ok) throw new Error('Error al guardar tarifas');
    return (await response.json()).data || [];
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employee-rates/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar tarifa');
  }
}
// --- GUILDS ---
export interface Guild {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuildData {
  name: string;
  code: string;
  is_active?: boolean;
}

export class GuildService {
  static async getAll(): Promise<Guild[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds`);
    if (!response.ok) throw new Error('Error al obtener gremios');
    return response.json();
  }

  static async getById(id: number): Promise<Guild> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds/${id}`);
    if (!response.ok) throw new Error('Error al obtener gremio');
    return response.json();
  }

  static async create(data: CreateGuildData): Promise<Guild> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear gremio');
    return response.json();
  }

  static async update(id: number, data: Partial<CreateGuildData>): Promise<Guild> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar gremio');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar gremio');
  }

  static async applyIncrease(id: number, body: { percentage: number; categoryIds: number[]; notes?: string }): Promise<{ message: string; summary: unknown }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/guilds/${id}/apply-increase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al aplicar aumento');
    }
    return response.json();
  }
}

// --- EMPLOYER COSTS ---
export interface EmployerCostCategory {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployerCostCategoryData {
  name: string;
  code: string;
  is_active?: boolean;
}

export interface EmployerCost {
  id: number;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  file_url?: string;
  notes?: string;
  created_by?: number;
  updated_by?: number;
  createdAt: string;
  updatedAt: string;
  category?: EmployerCostCategory;
}

export interface CreateEmployerCostData {
  category_id: number;
  month: number;
  year: number;
  amount: number;
  notes?: string;
}

export class EmployerCostCategoryService {
  static async getAll(): Promise<EmployerCostCategory[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employer-cost-categories`);
    if (!response.ok) throw new Error('Error al obtener categorías de costos');
    return response.json();
  }

  static async create(data: CreateEmployerCostCategoryData): Promise<EmployerCostCategory> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employer-cost-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear categoría de costo');
    return response.json();
  }

  static async update(id: number, data: Partial<CreateEmployerCostCategoryData>): Promise<EmployerCostCategory> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employer-cost-categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar categoría de costo');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employer-cost-categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar categoría de costo');
  }
}

export class EmployerCostService {
  static async getAll(params?: { category_id?: number; start_date?: string; end_date?: string }): Promise<EmployerCost[]> {
    let url = `${API_BASE_URL}/employer-costs`;
    if (params) {
      const query = new URLSearchParams();
      if (params.category_id) query.append('category_id', params.category_id.toString());
      if (params.start_date) query.append('start_date', params.start_date);
      if (params.end_date) query.append('end_date', params.end_date);
      url += `?${query.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener costos');
    return response.json();
  }

  static async create(data: CreateEmployerCostData, file?: File | null): Promise<EmployerCost> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (file) {
      formData.append('file', file);
    }

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/employer-costs`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al registrar costo');
    return response.json();
  }

  static async update(id: number, data: Partial<CreateEmployerCostData>, file?: File | null): Promise<EmployerCost> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    if (file) {
      formData.append('file', file);
    }

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/employer-costs/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error('Error al actualizar costo');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/employer-costs/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar costo');
  }
}

// --- LOANS ---
export interface Loan {
  id: number;
  employee_id: number;
  currency: 'USD' | 'ARS';
  start_date: string;
  amount: number;
  requested_amount?: number | null;
  interest_rate_percent?: number | null;
  exchange_rate_at_origin?: number | null;
  amount_ars_at_origin?: number | null;
  remaining_balance: number;
  payment_method?: 'efectivo' | 'transferencia' | null;
  notes?: string;
  rejection_reason?: string | null;
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'completed' | 'cancelled';
  // Rediseño de cuota fija — los préstamos viejos quedan plan_type:'discretionary' (formato
  // congelado, sin tocar) y siguen usando interest_rate_percent + "Aplicar interés" manual.
  // Todo préstamo nuevo se crea siempre 'fixed_installments'.
  plan_type: 'discretionary' | 'fixed_installments';
  num_installments?: number | null;
  requested_num_installments?: number | null;
  monthly_interest_percent?: number | null;
  installment_amount?: number | null;
  due_period_type?: 'first_half' | 'second_half' | null;
  requested_by?: number;
  approved_by?: number;
  approved_at?: string | null;
  paid_by?: number;
  paid_at?: string | null;
  payment_proof_url?: string | null;
  payment_proof_key?: string | null;
  payment_proof_name?: string | null;
  signature_url?: string | null;
  signature_key?: string | null;
  signature_name?: string | null;
  conflict_warning?: string | null;
  created_by?: number;
  updated_by?: number;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  payments?: LoanPayment[];
  interestApplications?: LoanInterestApplication[];
  installments?: LoanInstallment[];
}

export interface LoanInstallment {
  id: number;
  loan_id: number;
  installment_number: number;
  due_month: number;
  due_year: number;
  due_period_type: 'first_half' | 'second_half';
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  remaining_principal_after: number;
  status: 'scheduled' | 'deducted' | 'prepaid' | 'cancelled';
  payroll_entry_id?: number | null;
  loan_payment_id?: number | null;
  deducted_at?: string | null;
}

export interface LoanInterestApplication {
  id: number;
  loan_id: number;
  applied_at: string;
  rate_percent_used: number;
  capital_before: number;
  interest_amount: number;
  capital_after: number;
  notes?: string;
  applied_by?: number;
  appliedBy?: { id: number; name: string; lastname: string };
}

export interface LoanPayment {
  id: number;
  loan_id: number;
  date: string;
  amount: number;
  exchange_rate?: number | null;
  amount_ars?: number | null;
  payroll_entry_id?: number;
  loan_installment_id?: number | null;
  payrollEntry?: { id: number; pay_period_id: number; payPeriod?: PayPeriod };
  notes?: string;
  created_by?: number;
  createdAt: string;
  updatedAt: string;
}

// Todo préstamo nuevo es siempre en ARS con cuota fija — sin moneda/cotización, forzado también
// del lado del servidor (ver api_conmomet/controllers/loanController.js).
export interface CreateLoanData {
  employee_id: number;
  start_date: string;
  amount: number;
  num_installments: number;
  monthly_interest_percent?: number;
  payment_method?: 'efectivo' | 'transferencia';
  notes?: string;
  mark_as_paid?: boolean;
}

export interface CreateLoanPaymentData {
  loan_id: number;
  date: string;
  amount: number;
  exchange_rate?: number;
  amount_ars?: number;
  payroll_entry_id?: number;
  notes?: string;
}

export class LoanService {
  static async getAll(params?: { status?: string; employee_id?: number }): Promise<Loan[]> {
    let url = `${API_BASE_URL}/loans`;
    if (params) {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.employee_id) query.append('employee_id', params.employee_id.toString());
      url += `?${query.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener préstamos');
    return response.json();
  }

  static async getById(id: number): Promise<Loan> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loans/${id}`);
    if (!response.ok) throw new Error('Error al obtener préstamo');
    return response.json();
  }

  static async create(data: CreateLoanData, file?: File | null, signature?: File | null): Promise<Loan> {
    const formData = new FormData();
    formData.append('employee_id', data.employee_id.toString());
    formData.append('start_date', data.start_date);
    formData.append('amount', data.amount.toString());
    formData.append('num_installments', data.num_installments.toString());
    if (data.monthly_interest_percent !== undefined) formData.append('monthly_interest_percent', data.monthly_interest_percent.toString());
    if (data.payment_method) formData.append('payment_method', data.payment_method);
    if (data.notes) formData.append('notes', data.notes);
    if (data.mark_as_paid !== undefined) formData.append('mark_as_paid', data.mark_as_paid.toString());
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Error al crear préstamo');
    return response.json();
  }

  static async addPayment(loanId: number, data: CreateLoanPaymentData): Promise<LoanPayment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loan-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al registrar pago');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loans/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar préstamo');
  }

  static async approve(id: number, data?: {
    amount?: number;
    num_installments?: number;
    monthly_interest_percent?: number;
    payment_method?: 'efectivo' | 'transferencia';
    notes?: string;
    start_date?: string;
    mark_as_paid?: boolean;
  }, file?: File | null, signature?: File | null): Promise<Loan> {
    const formData = new FormData();
    if (data?.amount !== undefined) formData.append('amount', data.amount.toString());
    if (data?.num_installments !== undefined) formData.append('num_installments', data.num_installments.toString());
    if (data?.monthly_interest_percent !== undefined) formData.append('monthly_interest_percent', data.monthly_interest_percent.toString());
    if (data?.payment_method) formData.append('payment_method', data.payment_method);
    if (data?.notes !== undefined) formData.append('notes', data.notes);
    if (data?.start_date) formData.append('start_date', data.start_date);
    if (data?.mark_as_paid !== undefined) formData.append('mark_as_paid', data.mark_as_paid.toString());
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/loans/${id}/approve`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Error al aprobar préstamo');
    return response.json();
  }

  static async markAsPaid(id: number, data: { payment_method: 'efectivo' | 'transferencia' }, file?: File | null, signature?: File | null): Promise<Loan> {
    const formData = new FormData();
    formData.append('payment_method', data.payment_method);
    if (file) formData.append('file', file);
    if (signature) formData.append('signature', signature);

    const token = TokenManager.getToken();
    const response = await fetch(`${API_BASE_URL}/loans/${id}/mark-paid`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Error al marcar el préstamo como pagado');
    return response.json();
  }

  static async reject(id: number, notes?: string): Promise<Loan> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loans/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) throw new Error('Error al rechazar préstamo');
    return response.json();
  }

  static async applyInterest(id: number, data?: { rate_percent?: number; notes?: string }): Promise<{ loan: Loan; application: LoanInterestApplication }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loans/${id}/apply-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    if (!response.ok) throw new Error('Error al aplicar interés');
    return response.json();
  }

  // Liquidación por baja (renuncia/despido) — no es cancelación anticipada por elección del
  // empleado. Cobra completa la cuota de la quincena en curso y liquida el resto solo a capital.
  static async settle(id: number, data?: { reason?: 'resignation' | 'dismissal' | 'other'; notes?: string }): Promise<{ loan: Loan; total_charged: number }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/loans/${id}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Error al liquidar el préstamo');
    return response.json();
  }
}

// --- SYSTEM SETTINGS ---
export interface SystemSetting {
  id: number;
  max_loan_amount_ars: number;
  oca_budget_notification_user_id?: number | null;
  ocaBudgetNotificationUser?: { id: number; name: string; lastname: string };
  // Alícuotas de IVA disponibles al cargar una factura. Arranca solo con 21%.
  invoice_iva_rates?: number[] | null;
}

export class SystemSettingService {
  static async get(): Promise<SystemSetting> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/system-settings`);
    if (!response.ok) throw new Error('Error al obtener la configuración general');
    const data = await response.json();
    return data.data;
  }

  static async update(data: { max_loan_amount_ars?: number; oca_budget_notification_user_id?: number | null; invoice_iva_rates?: number[] }): Promise<SystemSetting> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/system-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al actualizar la configuración');
    const result = await response.json();
    return result.data;
  }
}

// --- FACTURACIÓN ---
export type VoucherType = 'A' | 'B' | 'C' | 'E' | 'sin_factura';
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled';
export type InvoiceConcept = 'materials' | 'labor' | 'other';
export type BillingStatus = 'unbilled' | 'partial' | 'billed' | 'billed_and_paid';

export interface InvoiceLine {
  id?: number;
  concept: InvoiceConcept;
  description?: string | null;
  percent?: number | null;
  net_amount: number;
  base_gross_amount?: number | null;
  base_discount_percent?: number | null;
  base_net_amount?: number | null;
}

export interface Invoice {
  id: number;
  voucher_type: VoucherType;
  pos_number: number | null;
  number: number | null;
  issue_date: string;
  due_date: string | null;
  client_id: number;
  budget_id: number | null;
  project_id: number | null;
  currency: BudgetCurrency;
  exchange_rate: number | null;
  net_amount: number;
  iva_rate: number;
  iva_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  file_url: string | null;
  file_name: string | null;
  // Comprobante de pago, opcional, adjuntado al marcar la factura como cobrada.
  payment_file_url?: string | null;
  payment_file_name?: string | null;
  notes: string | null;
  createdAt?: string;
  client?: { id: number; razonSocial: string; cuit?: string | null; tax_condition?: TaxCondition | null };
  budget?: { id: number; number: string; title: string; status: string } | null;
  project?: { id: number; code: string; name: string; is_additional?: boolean } | null;
  createdBy?: { id: number; name: string; lastname: string };
  lines: InvoiceLine[];
}

// Bruto, % de bonificación y neto de un concepto del presupuesto (por moneda).
export interface BillingBase { gross: number; discount_percent: number; net: number }
export type BillingByCurrency<T> = Record<BudgetCurrency, { materials: T; labor: T }>;

export interface BudgetBillingSummary {
  budget_id: number;
  bases: BillingByCurrency<BillingBase>;
  billed: BillingByCurrency<number>;
  balances: BillingByCurrency<number>;
  billed_percent: BillingByCurrency<number>;
  covered_by_reserved: BillingByCurrency<boolean>;
  has_balance: boolean;
  has_materials_balance: boolean;
  billing_status: BillingStatus;
  pending_invoices_count: number;
  pending_amount: Record<BudgetCurrency, number>;
  has_pending_payment: boolean;
  // null = el presupuesto todavía no tiene proyecto. Son las horas PROPIAS del proyecto, no el
  // consolidado con sus adicionales.
  project_progress: { budgeted_hours_own: number; consumed_hours_own: number; progress_percent: number | null } | null;
  labor_billed_percent: number;
  labor_hours_billed_equivalent: number | null;
  overbilled_labor: boolean;
}

export interface BillableBudget {
  id: number;
  number: string;
  title: string;
  status: string;
  currency: BudgetCurrency;
  approved_at: string | null;
  sent_at: string | null;
  labor_discount_percent: number | null;
  material_discount_percent: number | null;
  project_id: number | null;
  client?: { id: number; razonSocial: string; cuit?: string | null; tax_condition?: TaxCondition | null };
  project?: { id: number; code: string; name: string; is_additional?: boolean; parent?: { id: number; code: string; name: string } | null } | null;
  quoteRequest?: { id: number; number: string; client_quote_number?: string | null; title: string } | null;
  billing: BudgetBillingSummary;
}

export interface IvaInfo { rates: number[]; default_rate: number }

export interface HourBucket { budget_item_type_id: number | null; item_type_name: string; budgeted_hours: number; consumed_hours: number }

export interface BudgetBillingDetail {
  budget: Omit<BillableBudget, 'billing'>;
  billing: BudgetBillingSummary;
  hour_buckets: HourBucket[];
  invoices: Invoice[];
  has_reserved_records: boolean;
  iva: IvaInfo;
}

export interface InvoiceLineInput {
  concept: InvoiceConcept;
  description?: string;
  // El usuario carga el porcentaje O el monto; el servidor recalcula el otro contra la base real.
  percent?: number;
  net_amount?: number;
}

export interface InvoiceInput {
  voucher_type: VoucherType;
  pos_number?: number | null;
  number?: number | null;
  issue_date: string;
  due_date?: string | null;
  currency: BudgetCurrency;
  exchange_rate?: number | null;
  iva_rate?: number;
  budget_id?: number | null;
  client_id?: number | null;
  project_id?: number | null;
  notes?: string | null;
  paid_at?: string | null;
  lines: InvoiceLineInput[];
  file?: File | null;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  client_id?: number;
  voucher_type?: VoucherType;
  date_from?: string;
  date_to?: string;
  budget_id?: number;
  project_id?: number;
}

export interface BillableFilters {
  client_id?: number;
  billing_status?: BillingStatus;
  has_pending_payment?: boolean;
  q?: string;
}

export interface InvoiceProjectOption { id: number; code: string; name: string; is_additional?: boolean; parent?: { id: number; code: string; name: string } | null }

export interface InvoiceClientOption { id: number; razonSocial: string; cuit?: string | null; tax_condition?: TaxCondition | null; is_active: boolean }

export class InvoiceService {
  private static buildFormData(input: InvoiceInput): FormData {
    const formData = new FormData();
    const append = (key: string, value: unknown) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, String(value));
    };
    append('voucher_type', input.voucher_type);
    append('pos_number', input.pos_number);
    append('number', input.number);
    append('issue_date', input.issue_date);
    append('due_date', input.due_date);
    append('currency', input.currency);
    append('exchange_rate', input.exchange_rate);
    append('iva_rate', input.iva_rate);
    append('budget_id', input.budget_id);
    append('client_id', input.client_id);
    append('project_id', input.project_id);
    append('notes', input.notes);
    append('paid_at', input.paid_at);
    formData.append('lines', JSON.stringify(input.lines));
    if (input.file) formData.append('file', input.file);
    return formData;
  }

  private static async parse<T>(response: Response, fallback: string): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || fallback);
    }
    const data = await response.json();
    return data.data;
  }

  private static query(params?: object): string {
    const search = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.append(key, String(value));
    });
    const text = search.toString();
    return text ? `?${text}` : '';
  }

  static async getBillables(filters?: BillableFilters): Promise<{ data: BillableBudget[]; iva: IvaInfo }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/billables${this.query(filters)}`);
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Error al obtener los presupuestos a facturar');
    return response.json();
  }

  static async getBillable(budgetId: number): Promise<BudgetBillingDetail> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/billables/${budgetId}`);
    return this.parse(response, 'Error al obtener el detalle de facturación');
  }

  static async getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices${this.query(filters)}`);
    return this.parse(response, 'Error al obtener las facturas');
  }

  static async get(id: number): Promise<Invoice> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`);
    return this.parse(response, 'Error al obtener la factura');
  }

  // Clientes para el filtro y la factura libre: cuelga de /invoices, no requiere clients_read.
  static async getClientOptions(): Promise<InvoiceClientOption[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/client-options`);
    return this.parse(response, 'Error al obtener los clientes');
  }

  static async getProjectOptions(clientId: number): Promise<InvoiceProjectOption[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/project-options?client_id=${clientId}`);
    return this.parse(response, 'Error al obtener los proyectos del cliente');
  }

  static async create(input: InvoiceInput): Promise<Invoice> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: this.buildFormData(input),
    });
    return this.parse(response, 'Error al registrar la factura');
  }

  // Corrección de una factura mal cargada (requiere invoices_correct).
  static async update(id: number, input: InvoiceInput): Promise<Invoice> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: this.buildFormData(input),
    });
    return this.parse(response, 'Error al corregir la factura');
  }

  // `receipt`: comprobante de pago, opcional.
  static async pay(id: number, paidAt: string, receipt?: File | null): Promise<Invoice> {
    const formData = new FormData();
    formData.append('paid_at', paidAt);
    if (receipt) formData.append('file', receipt);
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/pay`, {
      method: 'PUT',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: formData,
    });
    return this.parse(response, 'Error al marcar la factura como cobrada');
  }

  static async cancel(id: number, reason: string): Promise<Invoice> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/invoices/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return this.parse(response, 'Error al anular la factura');
  }
}

// --- PAYROLL ADJUSTMENTS ---
export interface PayrollAdjustment {
  id: number;
  payroll_entry_id: number;
  type: 'bonus' | 'deduction';
  label: string;
  amount: number;
  is_auto: boolean;
  created_by?: number;
  updated_by?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollAdjustmentData {
  payroll_entry_id: number;
  type: 'bonus' | 'deduction';
  label: string;
  amount: number;
}

export class PayrollAdjustmentService {
  static async getByPayrollEntry(payrollEntryId: number): Promise<PayrollAdjustment[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-adjustments?payroll_entry_id=${payrollEntryId}`);
    if (!response.ok) throw new Error('Error al obtener ajustes');
    return response.json();
  }

  static async create(data: CreatePayrollAdjustmentData): Promise<PayrollAdjustment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear ajuste');
    return response.json();
  }

  static async update(id: number, data: Partial<CreatePayrollAdjustmentData>): Promise<PayrollAdjustment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-adjustments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar ajuste');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/payroll-adjustments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar ajuste');
  }
}

// --- RATE CHANGES (RETROACTIVES) ---
export interface RateChange {
  id: number;
  guild_id: number;
  concept_id?: number | null;
  percentage: number;
  applies_from_period: number;
  applied_in_period: number;
  status: 'pending' | 'applied' | 'cancelled' | 'confirmed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  guild?: Guild;
  concept?: PayrollConcept;
  appliesFromPeriod?: PayPeriod;
  appliedInPeriod?: PayPeriod;
}

export interface CreateRateChangeData {
  guild_id: number;
  concept_id?: number | null;
  percentage: number;
  applies_from_period: number;
  applied_in_period: number;
  notes?: string;
}

export class RateChangeService {
  static async getByAppliedPeriod(periodId: number): Promise<RateChange[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/rate-changes?applied_in_period=${periodId}`);
    if (!response.ok) throw new Error('Error al obtener retroactivos');
    return response.json();
  }

  static async create(data: CreateRateChangeData): Promise<RateChange> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/rate-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear retroactivo');
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/rate-changes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar retroactivo');
  }
}

// --- EXPENSE SUMMARY ---
export interface ExpenseSummaryMonthly {
  year: number;
  month: number;
  expenses: {
    payroll_gross: {
      label: string;
      total: number;
      detail: {
        first_half: number;
        second_half: number;
        entry_count: number;
      };
    };
    employer_costs: {
      label: string;
      total: number;
      breakdown: { category: string; amount: number }[];
    };
  };
  grand_total: number;
  info: {
    advances: {
      label: string;
      total: number;
      count: number;
      note: string;
    };
  };
}

export interface ExpenseSummaryAnnual {
  year: number;
  months: {
    month: number;
    payroll_gross: number;
    employer_costs: number;
    total: number;
  }[];
  annual_totals: {
    payroll_gross: number;
    employer_costs: number;
    total: number;
  };
}

export class ExpenseSummaryService {
  static async getMonthly(year: number, month: number): Promise<ExpenseSummaryMonthly> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/expense-summary/monthly?year=${year}&month=${month}`);
    if (!response.ok) throw new Error('Error al obtener el resumen mensual');
    return response.json();
  }

  static async getAnnual(year: number): Promise<ExpenseSummaryAnnual> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/expense-summary/annual?year=${year}`);
    if (!response.ok) throw new Error('Error al obtener el resumen anual');
    return response.json();
  }
}

// ==================== VEHICLES, SUPERVISORS & OCAS MODULES ====================

export type ClientSupervisorType = 'obra' | 'administracion';

export interface ClientSupervisor {
  id: number;
  client_id: number;
  name: string;
  lastname: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  type: ClientSupervisorType;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateClientSupervisorData {
  client_id: number;
  name: string;
  lastname: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  type?: ClientSupervisorType;
}

// Independiente de is_active a propósito — is_active sigue gateando los selects de carga de
// horas/OCAs, status es el ciclo de vida de asignación del pañol. Sin "lost": no aplica a un
// vehículo patentado (a diferencia de Tool.status).
export type VehicleStatus = 'available' | 'reserved' | 'delivered' | 'in_repair' | 'retired';

export interface Vehicle {
  id: number;
  brand?: string;
  model?: string;
  plate: string;
  type: 'crane' | 'truck' | 'other';
  is_active: boolean;
  status: VehicleStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateVehicleData {
  brand?: string;
  model?: string;
  plate: string;
  type: 'crane' | 'truck' | 'other';
  is_active?: boolean;
  status?: VehicleStatus;
}

export interface VehicleStatusLogEntry {
  id: number;
  vehicle_id: number;
  from_status?: string;
  to_status: string;
  changed_by: number;
  changed_at: string;
  notes?: string;
  changedByUser?: { id: number; name: string; lastname: string };
}

export interface OcaLine {
  id: number;
  oca_id: number;
  time_entry_id?: number;
  employee_id?: number;
  project_id: number;
  vehicle_id?: number;
  date: string;
  check_in?: string;
  check_out?: string;
  regular_hours: number;
  overtime_50_hours: number;
  overtime_100_hours: number;
  type: 'man_hours' | 'crane_hours';
  task?: string;
  notes?: string;
  hourly_rate?: number | null;
  employee?: { id: number; name: string; lastname: string };
  vehicle?: { id: number; brand: string; model: string; plate: string; type: string };
  project?: { id: number; name: string; code: string; plant?: { id: number; name: string } };
}

// Material cargado a una OCA de horas hombre — sin precio, es un registro tipo remito
// (material + cantidad) que se imprime como sección aparte al final de "Imprimir Remito".
export interface OcaMaterialItem {
  id: number;
  oca_id: number;
  material_id?: number | null;
  description: string;
  quantity: number;
  material_unit_id: number;
  notes?: string | null;
  material?: { id: number; description: string };
  materialUnit?: { id: number; label: string };
}

export interface OcaStatusLog {
  id: number;
  oca_id: number;
  from_status?: string;
  to_status: string;
  changed_by: number;
  changed_at: string;
  notes?: string;
  changedByUser?: { id: number; name: string; lastname: string };
}

export interface Oca {
  id: number;
  number: string;
  type: 'man_hours' | 'crane_hours';
  date: string;
  client_id: number;
  supervisor_id?: number;
  project_id?: number;
  status: 'pendiente' | 'presentado' | 'aprobado' | 'rechazado' | 'anulado';
  source_oca_id?: number;
  sourceOca?: { id: number; number: string };
  approved_img_url?: string;
  approved_at?: string;
  approved_by?: number;
  rejected_at?: string;
  rejected_by?: number;
  rejection_reason?: string;
  notes?: string;
  hourly_rate?: number | null;
  requires_budget: boolean;
  budget_status?: 'pendiente' | 'presentado' | 'aprobado' | null;
  budget_approved_at?: string | null;
  budget_approved_by?: number | null;
  budget_approved_by_supervisor_id?: number | null;
  budgetApprovedBySupervisor?: { id: number; name: string; lastname: string };
  client?: { id: number; razonSocial: string };
  supervisor?: { id: number; name: string; lastname: string; email?: string; phone?: string };
  project?: { id: number; name: string; code: string; plant_id?: number; plant?: { id: number; name: string; address?: string } };
  lines?: OcaLine[];
  logs?: OcaStatusLog[];
  materialItems?: OcaMaterialItem[];
}

// Valor de referencia de la hora por cliente para presupuestos de OCA (man_hours y crane_hours,
// discriminado por oca_type) — deliberadamente separado de ClientItemRate (tarifas de
// Presupuestos de obra): es un concepto de precio distinto, no debe mezclarse ni aparecer como
// rubro seleccionable en Presupuestos.
export interface OcaClientRate {
  id: number;
  client_id: number;
  oca_type: Oca['type'];
  vehicle_id?: number | null;
  hourly_rate: number;
  updated_by: number;
  updatedAt: string;
}

export interface OcaClientRateHistoryEntry {
  id: number;
  client_id: number;
  oca_type: Oca['type'];
  vehicle_id?: number | null;
  hourly_rate: number;
  changed_by: number;
  changedBy?: { id: number; name: string; lastname: string };
  createdAt: string;
}

export class OcaClientRateService {
  static async getByClient(clientId: number, ocaType: Oca['type'], vehicleId?: number): Promise<OcaClientRate | null> {
    const qs = vehicleId ? `&vehicle_id=${vehicleId}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/client-rate/${clientId}?oca_type=${ocaType}${qs}`);
    if (!response.ok) throw new Error('Error al obtener el valor de referencia del cliente');
    const data = await response.json();
    return data.data || null;
  }

  static async getHistory(clientId: number, ocaType: Oca['type'], vehicleId?: number): Promise<OcaClientRateHistoryEntry[]> {
    const qs = vehicleId ? `&vehicle_id=${vehicleId}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/client-rate/${clientId}/history?oca_type=${ocaType}${qs}`);
    if (!response.ok) throw new Error('Error al obtener el historial del valor de referencia');
    const data = await response.json();
    return data.data || [];
  }
}

export class ClientSupervisorService {
  static async getAll(clientId?: number, type?: ClientSupervisorType): Promise<ClientSupervisor[]> {
    let url = `${API_BASE_URL}/client-supervisors`;
    const qs = new URLSearchParams();
    if (clientId) qs.append('client_id', String(clientId));
    if (type) qs.append('type', type);
    if (qs.toString()) url += `?${qs.toString()}`;
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener los supervisores del cliente');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<ClientSupervisor> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/client-supervisors/${id}`);
    if (!response.ok) throw new Error('Error al obtener el supervisor');
    const data = await response.json();
    return data.data || data;
  }

  static async create(supervisorData: CreateClientSupervisorData): Promise<ClientSupervisor> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/client-supervisors`, {
      method: 'POST',
      body: JSON.stringify(supervisorData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el supervisor');
    }
    const data = await response.json();
    return data.supervisor || data.data || data;
  }

  static async update(id: number, supervisorData: Partial<CreateClientSupervisorData>): Promise<ClientSupervisor> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/client-supervisors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supervisorData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el supervisor');
    }
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/client-supervisors/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el supervisor');
    }
  }
}

export class VehicleService {
  static async getAll(params?: { type?: string; is_active?: boolean }): Promise<Vehicle[]> {
    let url = `${API_BASE_URL}/vehicles`;
    const qs = new URLSearchParams();
    if (params) {
      if (params.type) qs.append('type', params.type);
      if (params.is_active !== undefined) qs.append('is_active', params.is_active.toString());
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener la flota de vehículos');
    const data = await response.json();
    return data.data || [];
  }

  static async getById(id: number): Promise<Vehicle> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles/${id}`);
    if (!response.ok) throw new Error('Error al obtener el vehículo');
    const data = await response.json();
    return data.data || data;
  }

  static async create(vehicleData: CreateVehicleData): Promise<Vehicle> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el vehículo');
    }
    const data = await response.json();
    return data.vehicle || data.data || data;
  }

  static async update(id: number, vehicleData: Partial<CreateVehicleData>): Promise<Vehicle> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar el vehículo');
    }
    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el vehículo');
    }
  }

  static async changeStatus(id: number, status: VehicleStatus, notes?: string): Promise<Vehicle> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cambiar el estado');
    }
    const data = await response.json();
    return data.data;
  }

  static async getStatusHistory(id: number): Promise<VehicleStatusLogEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/vehicles/${id}/status-history`);
    if (!response.ok) throw new Error('Error al obtener el historial de estados');
    const data = await response.json();
    return data.data || [];
  }
}

// Pañol — Asignaciones de herramientas/grúas a proyecto + responsable. Tabla compartida entre
// Tool y Vehicle (exactamente uno de tool_id/vehicle_id viene seteado).
export type AssetAssignmentStatus = 'reserved' | 'delivered' | 'returned';
export type AssetCondition = 'bueno' | 'regular' | 'malo';
export type AssetCompleteness = 'completo' | 'faltante';

export interface AssetAssignment {
  id: number;
  tool_id?: number | null;
  vehicle_id?: number | null;
  project_id?: number | null;
  employee_id?: number | null;
  status: AssetAssignmentStatus;
  delivered_date?: string | null;
  returned_date?: string | null;
  delivery_condition?: AssetCondition | null;
  delivery_completeness?: AssetCompleteness | null;
  delivery_notes?: string | null;
  return_condition?: AssetCondition | null;
  return_completeness?: AssetCompleteness | null;
  return_notes?: string | null;
  tool?: Tool;
  vehicle?: Vehicle;
  project?: { id: number; name: string; code: string };
  employee?: { id: number; name: string; lastname: string };
  deliveredBy?: { id: number; name: string; lastname: string };
  receivedBy?: { id: number; name: string; lastname: string };
}

export interface CreateAssetAssignmentData {
  tool_id?: number;
  vehicle_id?: number;
  project_id?: number;
  employee_id?: number;
  delivered_date?: string;
  delivery_condition?: AssetCondition;
  delivery_completeness?: AssetCompleteness;
  delivery_notes?: string;
}

export interface DeliverAssignmentData {
  delivered_date?: string;
  delivery_condition: AssetCondition;
  delivery_completeness: AssetCompleteness;
  delivery_notes?: string;
}

export interface ReturnAssignmentData {
  returned_date?: string;
  return_condition: AssetCondition;
  return_completeness: AssetCompleteness;
  return_notes?: string;
  resulting_status?: 'available' | 'in_repair';
  responsible_employee_id?: number;
}

export class AssetAssignmentService {
  static async getAll(params?: {
    tool_id?: number; vehicle_id?: number; employee_id?: number; project_id?: number;
    status?: AssetAssignmentStatus; active?: boolean;
  }): Promise<AssetAssignment[]> {
    let url = `${API_BASE_URL}/asset-assignments`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.tool_id) qs.append('tool_id', params.tool_id.toString());
      if (params.vehicle_id) qs.append('vehicle_id', params.vehicle_id.toString());
      if (params.employee_id) qs.append('employee_id', params.employee_id.toString());
      if (params.project_id) qs.append('project_id', params.project_id.toString());
      if (params.status) qs.append('status', params.status);
      if (params.active) qs.append('active', 'true');
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener las asignaciones');
    const data = await response.json();
    return data.data || [];
  }

  static async create(body: CreateAssetAssignmentData): Promise<AssetAssignment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/asset-assignments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear la asignación');
    }
    const data = await response.json();
    return data.data;
  }

  static async deliver(id: number, body: DeliverAssignmentData): Promise<AssetAssignment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/asset-assignments/${id}/deliver`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al confirmar la entrega');
    }
    const data = await response.json();
    return data.data;
  }

  static async returnAssignment(id: number, body: ReturnAssignmentData): Promise<AssetAssignment> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/asset-assignments/${id}/return`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrar la devolución');
    }
    const data = await response.json();
    return data.data;
  }

  static async cancel(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/asset-assignments/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al cancelar la reserva');
    }
  }
}

export class OcaService {
  static async getAll(params?: { client_id?: number; supervisor_id?: number; project_id?: number; status?: string; type?: string; include_anuladas?: boolean }): Promise<Oca[]> {
    let url = `${API_BASE_URL}/ocas`;
    if (params) {
      const qs = new URLSearchParams();
      if (params.client_id) qs.append('client_id', params.client_id.toString());
      if (params.supervisor_id) qs.append('supervisor_id', params.supervisor_id.toString());
      if (params.project_id) qs.append('project_id', params.project_id.toString());
      if (params.status) qs.append('status', params.status);
      if (params.type) qs.append('type', params.type);
      if (params.include_anuladas) qs.append('include_anuladas', 'true');
      if (qs.toString()) url += `?${qs.toString()}`;
    }
    const response = await TokenManager.authenticatedFetch(url);
    if (!response.ok) throw new Error('Error al obtener los remitos / OCAs');
    const data = await response.json();
    return data.data || [];
  }

  static async getPendingEntries(clientId: number, type: 'man_hours' | 'crane_hours'): Promise<TimeEntry[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/pending-entries?client_id=${clientId}&type=${type}`);
    if (!response.ok) throw new Error('Error al obtener registros de horas pendientes de remito');
    const data = await response.json();
    return data.data || [];
  }

  static async create(ocaData: { type: 'man_hours' | 'crane_hours'; client_id: number; time_entry_ids: number[]; notes?: string; project_id?: number; supervisor_id?: number }): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas`, {
      method: 'POST',
      body: JSON.stringify(ocaData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al generar la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async present(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/present`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al presentar la OCA');
    }
  }

  static async approve(id: number, file?: File, requiresBudget?: boolean): Promise<void> {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (requiresBudget !== undefined) {
      formData.append('requires_budget', String(requiresBudget));
    }
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/approve`, {
      method: 'PUT',
      headers: {
        // Dejar que fetch ponga el header Content-Type correcto para FormData
        'Content-Type': 'SKIP_MULTIPART_HEADER',
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aprobar la OCA');
    }
  }

  static async setRequiresBudget(id: number, requires_budget: boolean): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/requires-budget`, {
      method: 'PUT',
      body: JSON.stringify({ requires_budget }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar si requiere presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async presentBudget(id: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/budget/present`, {
      method: 'PUT',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al presentar el presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async approveBudget(id: number, approvedBySupervisorId?: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/budget/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved_by_supervisor_id: approvedBySupervisorId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al aprobar el presupuesto');
    }
    const data = await response.json();
    return data.data;
  }

  static async reject(id: number, reason: string): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al rechazar la OCA');
    }
  }

  static async correct(id: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/correct`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al corregir la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async setHourlyRate(id: number, hourly_rate: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/hourly-rate`, {
      method: 'PUT',
      body: JSON.stringify({ hourly_rate }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar el valor de referencia');
    }
    const data = await response.json();
    return data.data || data;
  }

  // OCAs de grúa: un valor de referencia por vehículo, no uno solo para toda la OCA.
  static async setVehicleRates(id: number, rates: { vehicle_id: number; hourly_rate: number }[]): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/hourly-rate`, {
      method: 'PUT',
      body: JSON.stringify({ rates }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar el valor de referencia');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async annul(id: number, reason?: string): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/annul`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al anular la OCA');
    }
  }

  static async updateLines(id: number, lines: Partial<OcaLine>[]): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/lines`, {
      method: 'PUT',
      body: JSON.stringify({ lines }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar las líneas de la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async addEntries(id: number, timeEntryIds: number[]): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/add-entries`, {
      method: 'PUT',
      body: JSON.stringify({ time_entry_ids: timeEntryIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar registros a la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async removeEntries(id: number, timeEntryIds: number[]): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/remove-entries`, {
      method: 'PUT',
      body: JSON.stringify({ time_entry_ids: timeEntryIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al remover registros de la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async addLine(id: number, lineData: Partial<OcaLine>): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/lines`, {
      method: 'POST',
      body: JSON.stringify(lineData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar línea manual a la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async removeLine(id: number, lineId: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/lines/${lineId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar la línea de la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async replaceLine(id: number, lineId: number, lineData: Partial<OcaLine>): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/lines/${lineId}/replace`, {
      method: 'PUT',
      body: JSON.stringify(lineData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al editar la línea de la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async addMaterialItem(id: number, itemData: Partial<OcaMaterialItem>): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/materials`, {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar el material a la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }

  static async removeMaterialItem(id: number, itemId: number): Promise<Oca> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/ocas/${id}/materials/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar el material de la OCA');
    }
    const data = await response.json();
    return data.data || data;
  }
}


// Web Push — suscripciones de dispositivo. `getVapidPublicKey` es pública (fetch crudo, mismo
// patrón que PublicInvitationService); subscribe/unsubscribe van por el token porque identifican
// AL USUARIO dueño del dispositivo (ver FLOWS.md flujo 28).
export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export class PushSubscriptionService {
  // El service worker vive en un scope sin DOM (no puede leer window.__ENV__) y corre en un
  // origen distinto al de la API — necesita este valor para la reconciliación best-effort de
  // `pushsubscriptionchange` (capa 2, ver FLOWS.md flujo 28). Se guarda en IndexedDB al
  // suscribirse, no se hardcodea en el SW.
  static getApiBaseUrl(): string {
    return API_BASE_URL;
  }

  static async getVapidPublicKey(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/public/push/vapid-public-key`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al obtener la clave de notificaciones push');
    }
    const data = await response.json();
    return data.publicKey;
  }

  static async subscribe(subscription: PushSubscriptionPayload): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/push-subscriptions`, {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al activar las notificaciones');
    }
  }

  static async unsubscribe(endpoint: string): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/push-subscriptions/unsubscribe`, {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al desactivar las notificaciones');
    }
  }

  // Estado segun el SERVIDOR. El diálogo lo cruza con el estado del browser: tener una
  // suscripción local viva no significa que el servidor la tenga registrada, y esa diferencia
  // es justamente el caso en el que "dice activado y no llega nada".
  static async status(endpoint?: string): Promise<PushServerStatus> {
    const qs = endpoint ? `?endpoint=${encodeURIComponent(endpoint)}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/push-subscriptions${qs}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al consultar el estado de las notificaciones');
    }
    const data = await response.json();
    return data.data;
  }

  static async sendTest(): Promise<{ sent: number; devices: number }> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/me/push-subscriptions/test`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al enviar la notificación de prueba');
    }
    const data = await response.json();
    return data.data;
  }
}

export interface PushServerStatus {
  devices: number;
  thisDeviceRegistered: boolean | null;
  vapidConfigured: boolean;
}

// ============== Adicionales ==============
// Un adicional es un proyecto urgente (Project.is_additional) que nace con su presupuesto en
// borrador, con o sin proyecto padre. Los materiales se cargan acá pero viven en el presupuesto
// vigente; el margen y el precio al cliente nunca se ven ni se editan desde este módulo.

export interface AdditionalBudgetSummary {
  id: number;
  number: string;
  status: Budget['status'];
  currency?: BudgetCurrency;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  sent_at?: string | null;
  // Solo en budget_history
  created_at?: string;
}

// Línea de material de un adicional: sin margen ni precio. El costo solo viene con material_costs_read.
export interface AdditionalMaterialItem {
  id?: number;
  material_id: number | null;
  provider_id?: number | null;
  provider?: MaterialProvider | null;
  description: string;
  quantity: number;
  material_unit_id: number;
  materialUnit?: MaterialUnit;
  material?: { id: number; description: string } | null;
  material_cost_snapshot?: number | null;
  material_cost_currency?: BudgetCurrency | null;
}

export interface Additional extends Project {
  // Presupuesto vigente: el último no rechazado o, si todos están rechazados, el último rechazado.
  current_budget: AdditionalBudgetSummary | null;
  current_budget_items?: AdditionalMaterialItem[];
  budget_history?: AdditionalBudgetSummary[];
  consumed_hours_own: number;
}

export interface CreateAdditionalData {
  name: string;
  client_id?: number;
  plant_id?: number | null;
  parent_id?: number | null;
  description?: string;
  start_date?: string;
  currency?: BudgetCurrency;
}

export interface UpdateAdditionalData {
  name?: string;
  description?: string | null;
  plant_id?: number | null;
  // null quita el padre
  parent_id?: number | null;
  status?: Project['status'];
  start_date?: string | null;
  end_date?: string | null;
}

export interface AdditionalParentOption {
  id: number;
  code: string;
  name: string;
  client_id: number;
  plant_id?: number | null;
  plant?: { id: number; name: string } | null;
}

export interface AdditionalClientOption { id: number; razonSocial: string }
export interface AdditionalPlantOption { id: number; name: string; client_id: number }

export class AdditionalService {
  private static async parse<T>(response: Response, fallback: string): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || fallback);
    }
    const data = await response.json();
    return data.data;
  }

  static async getAll(params?: { client_id?: number; status?: string; has_parent?: boolean; q?: string }): Promise<Additional[]> {
    const qs = new URLSearchParams();
    if (params?.client_id) qs.append('client_id', String(params.client_id));
    if (params?.status) qs.append('status', params.status);
    if (params?.has_parent !== undefined) qs.append('has_parent', String(params.has_parent));
    if (params?.q) qs.append('q', params.q);
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals${qs.toString() ? `?${qs}` : ''}`);
    return (await this.parse<Additional[]>(response, 'Error al obtener adicionales')) || [];
  }

  static async get(id: number): Promise<Additional> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/${id}`);
    return this.parse<Additional>(response, 'Error al obtener el adicional');
  }

  static async create(body: CreateAdditionalData): Promise<Additional> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals`, { method: 'POST', body: JSON.stringify(body) });
    return this.parse<Additional>(response, 'Error al crear el adicional');
  }

  static async update(id: number, body: UpdateAdditionalData): Promise<Additional> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    return this.parse<Additional>(response, 'Error al actualizar el adicional');
  }

  // Materiales del presupuesto vigente (solo en borrador; 409 si ya se envió).
  static async updateMaterials(id: number, items: AdditionalMaterialItem[]): Promise<AdditionalMaterialItem[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/${id}/materials`, { method: 'PUT', body: JSON.stringify({ items }) });
    return this.parse<AdditionalMaterialItem[]>(response, 'Error al guardar los materiales');
  }

  // "Nuevo presupuesto" a partir del rechazado, vinculado al mismo adicional.
  static async newBudget(id: number): Promise<Additional> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/${id}/budgets`, { method: 'POST' });
    return this.parse<Additional>(response, 'Error al crear el presupuesto nuevo');
  }

  static async delete(id: number): Promise<void> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al eliminar el adicional');
    }
  }

  static async getParentOptions(clientId: number): Promise<AdditionalParentOption[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/parent-options?client_id=${clientId}`);
    return (await this.parse<AdditionalParentOption[]>(response, 'Error al obtener los proyectos padre')) || [];
  }

  // Listas mínimas (id + nombre) de clientes y plantas, para que alcance con additionals_*.
  static async getCatalogClients(): Promise<AdditionalClientOption[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/clients`);
    return (await this.parse<AdditionalClientOption[]>(response, 'Error al obtener clientes')) || [];
  }

  static async getCatalogPlants(): Promise<AdditionalPlantOption[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/plants`);
    return (await this.parse<AdditionalPlantOption[]>(response, 'Error al obtener plantas')) || [];
  }

  // Catálogo para cargar materiales: mismos handlers que Materiales, pero bajo /additionals para
  // que alcance con los permisos additionals_* (el costo sigue gateado por material_costs_read).
  static async getCatalogMaterials(): Promise<Material[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/materials?is_active=true`);
    return (await this.parse<Material[]>(response, 'Error al obtener materiales')) || [];
  }

  static async getCatalogUnits(): Promise<MaterialUnit[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/units?is_active=true`);
    return (await this.parse<MaterialUnit[]>(response, 'Error al obtener unidades')) || [];
  }

  static async getCatalogProviders(): Promise<MaterialProvider[]> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/providers`);
    return (await this.parse<MaterialProvider[]>(response, 'Error al obtener proveedores')) || [];
  }

  static async createCatalogMaterial(body: CreateMaterialData): Promise<Material> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/materials`, { method: 'POST', body: JSON.stringify(body) });
    return this.parse<Material>(response, 'Error al crear el material');
  }

  static async createCatalogUnit(label: string): Promise<MaterialUnit> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/units`, { method: 'POST', body: JSON.stringify({ label }) });
    return this.parse<MaterialUnit>(response, 'Error al crear la unidad');
  }

  static async createCatalogProvider(razonSocial: string): Promise<MaterialProvider> {
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/additionals/catalog/providers`, { method: 'POST', body: JSON.stringify({ razonSocial }) });
    return this.parse<MaterialProvider>(response, 'Error al crear el proveedor');
  }
}

// ============== Seguimiento de proyectos/adicionales ==============
// Notas de seguimiento con fecha, autor y fotos opcionales. Registro de solo agregar: no hay
// edición ni borrado — una nota equivocada se corrige con otra nueva. La fecha la pone el servidor.

export interface ProjectLogFile {
  id: number;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
}

export interface ProjectLogEntry {
  id: number;
  project_id: number;
  user_id: number;
  note: string | null;
  createdAt: string;
  author?: { id: number; name: string; lastname: string };
  files: ProjectLogFile[];
}

export class ProjectLogService {
  // Más nuevas primero. beforeId trae las anteriores a esa entrada ("cargar más").
  static async list(projectId: number, beforeId?: number): Promise<{ data: ProjectLogEntry[]; has_more: boolean }> {
    const qs = beforeId ? `?before_id=${beforeId}` : '';
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/project-logs/${projectId}${qs}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al obtener el seguimiento');
    }
    return response.json();
  }

  static async create(projectId: number, note: string, photos: File[]): Promise<ProjectLogEntry> {
    const formData = new FormData();
    if (note.trim()) formData.append('note', note.trim());
    photos.forEach((photo) => formData.append('files', photo));
    const response = await TokenManager.authenticatedFetch(`${API_BASE_URL}/project-logs/${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'SKIP_MULTIPART_HEADER' },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Error al agregar la nota');
    }
    const data = await response.json();
    return data.data;
  }
}
