export type ProjectStatus = 'pending' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  budget: number | null;
  assigned_manager: string | null; // UUID of the user
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project_id: string; // UUID of the project
  name: string;
  description: string | null;
  due_date: string | null;
  assigned_to: string | null; // UUID of the user
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
}

export interface ProjectContextType {
  projects: Project[];
  tasks: Task[];
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'assigned_manager'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'assigned_manager'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByProjectId: (projectId: string) => Task[];
} 