import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useProject } from '../contexts/ProjectContext';
import { Project, Task, ProjectStatus, TaskStatus, TaskPriority } from '../types/Project';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import { Chart } from 'react-google-charts';
import { useNotifications } from '../contexts/NotificationContext';
import { useJobs } from '../contexts/JobContext';
import { format } from 'date-fns';
import type { User } from '../contexts/AuthContext'; // Import User type

const Projects = () => {
  const { projects, tasks, addProject, updateProject, deleteProject, addTask, updateTask, deleteTask, getTasksByProjectId } = useProject();
  const { jobs, getJobsByProject } = useJobs();
  const { user, getAllUsers } = useAuth(); // Destructure getAllUsers
  const { showNotification } = useNotifications();

  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null); // To associate tasks with projects

  // New state for all users
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setAllUsers(fetchedUsers);
    };
    fetchUsers();
  }, [getAllUsers]);

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStartDate, setProjectStartDate] = useState('');
  const [projectEndDate, setProjectEndDate] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('pending');
  const [projectBudget, setProjectBudget] = useState<number>(0);

  // Task Form State
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('To Do');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');

  const handleOpenProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectDescription(project.description || '');
      setProjectStartDate(project.start_date || '');
      setProjectEndDate(project.end_date || '');
      setProjectStatus(project.status);
      setProjectBudget(project.budget || 0);
    } else {
      setEditingProject(null);
      setProjectName('');
      setProjectDescription('');
      setProjectStartDate('');
      setProjectEndDate('');
      setProjectStatus('pending');
      setProjectBudget(0);
    }
    setIsProjectDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = async () => {
    const projectData = {
      name: projectName,
      description: projectDescription || null,
      start_date: projectStartDate || null,
      end_date: projectEndDate || null,
      status: projectStatus,
      budget: projectBudget || null,
    };

    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
    handleCloseProjectDialog();
  };

  const handleOpenTaskDialog = (projectId: string, task?: Task) => {
    setCurrentProjectId(projectId);
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskDescription(task.description || '');
      setTaskDueDate(task.due_date || '');
      setTaskAssignedTo(task.assigned_to || '');
      setTaskStatus(task.status);
      setTaskPriority(task.priority);
    } else {
      setEditingTask(null);
      setTaskName('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskAssignedTo('');
      setTaskStatus('To Do');
      setTaskPriority('medium');
    }
    setIsTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setIsTaskDialogOpen(false);
    setEditingTask(null);
    setCurrentProjectId(null);
  };

  const handleSaveTask = async () => {
    if (!currentProjectId) {
      showNotification({ type: 'error', message: 'No project selected for the task' });
      return;
    }

    try {
      const taskData = {
        project_id: currentProjectId,
        name: taskName,
        description: taskDescription || null,
        due_date: taskDueDate || null,
        assigned_to: taskAssignedTo || user?.id || null,
        status: taskStatus,
        priority: taskPriority,
      };

      console.log('Saving task with data:', taskData); // Debug log

      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      handleCloseTaskDialog();
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification({ type: 'error', message: 'Failed to save task' });
    }
  };

  const handleProjectDelete = async (id: string) => {
    await deleteProject(id);
  };

  const handleTaskDelete = async (id: string) => {
    await deleteTask(id);
  };

  // Group tasks by status for Kanban columns
  const groupedTasks = (projectTasks: Task[]) => {
    console.log('Tasks passed to groupedTasks:', projectTasks); // Debugging
    const groups: { [key: string]: Task[] } = {
      'To Do': [],
      'In Progress': [],
      'Done': [],
    };
    projectTasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    return groups;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  // Helper function to convert days to milliseconds for Gantt chart
  const daysToMilliseconds = (days: number) => {
    return days * 24 * 60 * 60 * 1000;
  };

  // Function to prepare data for Gantt chart
  const generateGanttData = (project: Project, projectTasks: Task[]) => {
    console.log('Generating Gantt data for project:', project.name, 'with tasks:', projectTasks); // Debugging
    const columns = [
      { type: 'string', label: 'Task ID' },
      { type: 'string', label: 'Task Name' },
      { type: 'date', label: 'Start Date' },
      { type: 'date', label: 'End Date' },
      { type: 'number', label: 'Duration' },
      { type: 'number', label: 'Percent Complete' },
      { type: 'string', label: 'Dependencies' },
    ];

    const rows = projectTasks.map(task => {
      const startDate = task.due_date ? new Date(task.due_date) : new Date(project.start_date || new Date());
      // For simplicity, let's assume tasks start on project start or today if no due date, and end on due date or project end date
      const endDate = task.due_date ? new Date(task.due_date) : (project.end_date ? new Date(project.end_date) : new Date(Date.now() + daysToMilliseconds(7))); // Default to 7 days from now if no end date
      
      const duration = endDate.getTime() - startDate.getTime();

      let percentComplete = 0;
      if (task.status === 'Done') {
        percentComplete = 100;
      } else if (task.status === 'In Progress') {
        percentComplete = 50; // Arbitrary for now
      } else {
        percentComplete = 0;
      }

      return [
        task.id,
        task.name,
        startDate,
        endDate,
        duration > 0 ? duration : daysToMilliseconds(1), // Ensure duration is at least 1 day
        percentComplete,
        null, // No dependencies implemented yet
      ];
    });

    // Add project row as a summary if desired, or just tasks.
    // For now, let's just show tasks related to the project.

    return [columns, ...rows];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Project Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenProjectDialog()}
          disabled={!user || ![UserRole.ADMIN, UserRole.MANAGER].includes(user.role)}
        >
          Add New Project
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} key={project.id}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" component="div">
                    {project.name} <Chip label={project.status} color={project.status === 'completed' ? 'success' : project.status === 'in-progress' ? 'info' : 'default'} size="small" />
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleOpenProjectDialog(project)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleProjectDelete(project.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {project.description || 'No description.'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start Date: {formatDate(project.start_date)} | End Date: {formatDate(project.end_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Budget: {project.budget ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.budget) : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manager: {project.assigned_manager || 'N/A'}
                </Typography>

                {/* Related Jobs Section */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon /> Related Jobs
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      // Navigate to job creation with project ID
                      window.location.href = `/jobs/new?projectId=${project.id}`;
                    }}
                  >
                    Add Job
                  </Button>
                </Box>
                {getJobsByProject(project.id).length > 0 ? (
                  <Grid container spacing={2}>
                    {getJobsByProject(project.id).map((job) => (
                      <Grid item xs={12} md={6} key={job.id}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1">{job.title}</Typography>
                            <Chip 
                              label={job.status} 
                              color={
                                job.status === 'completed' ? 'success' :
                                job.status === 'in-progress' ? 'info' :
                                job.status === 'acknowledged' ? 'warning' :
                                'default'
                              } 
                              size="small" 
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {job.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {format(new Date(job.timeStart), 'MMM d, yyyy h:mm a')} - {format(new Date(job.timeEnd), 'MMM d, yyyy h:mm a')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Location: {job.siteAddress}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No jobs assigned to this project yet.
                  </Typography>
                )}

                {/* Gantt Chart for this Project */}
                {getTasksByProjectId(project.id).length > 0 && (() => {
                  const ganttData = generateGanttData(project, getTasksByProjectId(project.id));
                  console.log('Gantt data for project', project.name, ':', ganttData); // Debugging
                  return (
                    <Box sx={{ mt: 3, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>Project Timeline</Typography>
                      <Chart
                        chartType="Gantt"
                        width="100%"
                        height="250px"
                        data={ganttData}
                        options={{
                          height: getTasksByProjectId(project.id).length * 41 + 50, // Adjust height dynamically
                          gantt: {
                            trackHeight: 30,
                            arrow: { angle: 100, width: 3, color: '#5E2E8E', length: 10 },
                            palette: [
                              { color: '#f44336', dark: '#d32f2f' }, // To Do
                              { color: '#ff9800', dark: '#f57c00' }, // In Progress
                              { color: '#4caf50', dark: '#388e3c' }, // Done
                            ],
                          },
                        }}
                      />
                    </Box>
                  );
                })()}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTaskDialog(project.id)}
                  sx={{ mt: 2 }}
                >
                  Add Task
                </Button>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {Object.keys(groupedTasks(getTasksByProjectId(project.id))).map((status) => (
                    <Grid item xs={12} md={4} key={status}>
                      <Paper elevation={1} sx={{ p: 2, height: '100%', minHeight: 200, backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom>{status}</Typography>
                        {groupedTasks(getTasksByProjectId(project.id))[status].map((task) => (
                          <Card key={task.id} variant="outlined" sx={{ mb: 1, backgroundColor: '#fff', borderLeft: `4px solid ${task.status === 'To Do' ? '#f44336' : task.status === 'In Progress' ? '#ff9800' : '#4caf50'}` }}>
                            <CardContent sx={{ pb: '8px !important' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">{task.name}</Typography>
                                <IconButton size="small" onClick={() => handleOpenTaskDialog(project.id, task)}><EditIcon fontSize="small" /></IconButton>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Due: {formatDate(task.due_date)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Priority: <Chip label={task.priority} size="small" color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'} />
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Assigned To: {task.assigned_to ? (
                                  allUsers.find(u => u.id === task.assigned_to)?.id_number || task.assigned_to
                                ) : 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Status: {task.status}
                              </Typography>
                            </CardContent>
                            <CardActions sx={{ pt: 0 }}>
                              <Button size="small" onClick={() => handleTaskDelete(task.id)}>Delete</Button>
                            </CardActions>
                          </Card>
                        ))}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onClose={handleCloseProjectDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            value={projectStartDate}
            onChange={(e) => setProjectStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            value={projectEndDate}
            onChange={(e) => setProjectEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={projectStatus}
              label="Status"
              onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Budget"
            type="number"
            fullWidth
            value={projectBudget}
            onChange={(e) => setProjectBudget(Number(e.target.value))}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₱</Typography>,
            }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectDialog}>Cancel</Button>
          <Button onClick={handleSaveProject} variant="contained">{editingProject ? 'Save Changes' : 'Add Project'}</Button>
        </DialogActions>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={handleCloseTaskDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            type="text"
            fullWidth
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={taskAssignedTo}
              label="Assigned To"
              required
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {allUsers.map(person => (
                <MenuItem key={person.id} value={person.id}>
                  {`${person.name} (${person.id_number})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={taskStatus}
              label="Status"
              onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={taskPriority}
              label="Priority"
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained">{editingTask ? 'Save Changes' : 'Add Task'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects; 