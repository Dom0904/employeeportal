import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { Project, Task, ProjectContextType } from '../types/Project';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { generateUUID } from '../utils/uuid';

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // Fetch Projects and their Tasks
  const fetchProjects = useCallback(async () => {
    try {
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        showNotification({ type: 'error', message: 'Failed to fetch projects' });
        return;
      }

      // Fetch all tasks with specific columns
      console.log('Fetching tasks from Supabase...');
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          project_id,
          name,
          description,
          due_date,
          assigned_to,
          status,
          priority,
          created_at,
          updated_at
        `);

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        showNotification({ type: 'error', message: 'Failed to fetch tasks' });
        return;
      }

      console.log('Raw tasks data from Supabase:', tasksData);
      setProjects(projectsData || []);
      setTasks(tasksData || []);
      console.log('Fetched projects:', projectsData);
      console.log('Fetched tasks:', tasksData);
    } catch (error) {
      console.error('Unexpected error in fetchProjects:', error);
      showNotification({ type: 'error', message: 'An unexpected error occurred' });
    }
  }, [showNotification]);

  // Add Project
  const addProject = useCallback(async (newProject: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'assigned_manager'>) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to add a project' });
      return;
    }

    const projectToInsert = {
      ...newProject,
      assigned_manager: user.id,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert([projectToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      showNotification({ type: 'error', message: `Failed to add project: ${error.message}` });
      return;
    }

    if (data) {
      setProjects(prev => [...prev, data]);
      showNotification({ type: 'success', message: 'Project added successfully!' });
    }
  }, [user, showNotification]);

  // Update Project
  const updateProject = useCallback(async (id: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at' | 'assigned_manager'>>) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to update a project' });
      return;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      showNotification({ type: 'error', message: `Failed to update project: ${error.message}` });
      return;
    }

    if (data) {
      setProjects(prev => prev.map(p => (p.id === id ? data : p)));
      showNotification({ type: 'success', message: 'Project updated successfully!' });
    }
  }, [user, showNotification]);

  // Delete Project
  const deleteProject = useCallback(async (id: string) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to delete a project' });
      return;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      showNotification({ type: 'error', message: `Failed to delete project: ${error.message}` });
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.project_id !== id)); // Also remove associated tasks
    showNotification({ type: 'success', message: 'Project deleted successfully!' });
  }, [user, showNotification]);

  // Add Task
  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to add a task' });
      return;
    }

    try {
      const taskToInsert = {
        ...newTask,
        assigned_to: newTask.assigned_to || user.id, // Default to current user if not specified
        project_id: newTask.project_id, // Ensure project_id is included
      };

      console.log('Inserting task:', taskToInsert); // Debug log

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        showNotification({ type: 'error', message: `Failed to add task: ${error.message}` });
        return;
      }

      if (data) {
        setTasks(prev => [...prev, data]);
        showNotification({ type: 'success', message: 'Task added successfully!' });
      }
    } catch (error) {
      console.error('Unexpected error in addTask:', error);
      showNotification({ type: 'error', message: 'An unexpected error occurred while adding task' });
    }
  }, [user, showNotification]);

  // Update Task
  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to update a task' });
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      showNotification({ type: 'error', message: `Failed to update task: ${error.message}` });
      return;
    }

    if (data) {
      setTasks(prev => prev.map(t => (t.id === id ? data : t)));
      showNotification({ type: 'success', message: 'Task updated successfully!' });
    }
  }, [user, showNotification]);

  // Delete Task
  const deleteTask = useCallback(async (id: string) => {
    if (!user) {
      showNotification({ type: 'error', message: 'You must be logged in to delete a task' });
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      showNotification({ type: 'error', message: `Failed to delete task: ${error.message}` });
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    showNotification({ type: 'success', message: 'Task deleted successfully!' });
  }, [user, showNotification]);

  // Get Tasks by Project ID
  const getTasksByProjectId = useCallback((projectId: string) => {
    return tasks.filter(task => task.project_id === projectId);
  }, [tasks]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const contextValue = useMemo(() => ({
    projects,
    tasks,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getTasksByProjectId,
  }), [
    projects,
    tasks,
    fetchProjects,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getTasksByProjectId,
  ]);

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}; 