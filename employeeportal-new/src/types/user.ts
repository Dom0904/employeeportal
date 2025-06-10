export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MANAGER = 'manager',
  REGULAR = 'regular'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: string;
  updatedAt: string;
} 