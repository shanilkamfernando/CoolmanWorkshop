// Authentication Types
export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserPermissions {
  portals: PortalId[];
  canManageUsers?: boolean;
}

export type PortalId =
  | "customers"
  | "purchasing"
  | "stores"
  | "workshop"
  | "documents"
  | "worklist"
  | "meetings"
  | "followup"
  | "staff";

export interface Portal {
  id: PortalId;
  name: string;
  icon: string;
  path: string;
}

export interface SignUpData {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  username: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UpdatePermissionsData {
  permissions: UserPermissions;
  isActive: boolean;
}

export interface PermissionTemplate {
  id: number;
  name: string;
  description: string;
  permissions: UserPermissions;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface JWTPayload {
  id: number;
  username: string;
  role: "admin" | "user";
  permissions: UserPermissions;
  iat?: number;
  exp?: number;
}
