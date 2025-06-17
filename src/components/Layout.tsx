import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  CssBaseline,
  Badge,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  Announcement as AnnouncementIcon,
  EventNote as EventNoteIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  AccessTime as AccessTimeIcon,
  Work as WorkIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ExpandLess,
  ExpandMore,
  Build as BuildIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth, UserRole } from '../contexts/AuthContext';

console.log('Layout component loaded.'); // Added for debugging 404

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

// Navigation items with their routes and access control organized by groups
const navigationGroups = [
  {
    groupName: 'Personal Information',
    icon: <PersonIcon />,
    items: [
      { text: 'Personal Info', icon: <PersonIcon />, path: '/profile', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
      { text: 'Time Tracking', icon: <AccessTimeIcon />, path: '/time-tracking', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
      { text: 'Leave Requests', icon: <EventNoteIcon />, path: '/leave-requests', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
    ]
  },
  {
    groupName: 'Tools',
    icon: <BuildIcon />,
    items: [
      { text: 'Cost Estimation', icon: <AttachMoneyIcon />, path: '/cost-estimation', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER] },
      { text: 'Bill of Materials', icon: <ReceiptIcon />, path: '/bill-of-material', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
      { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
    ]
  },
  {
    groupName: 'Assignment',
    icon: <AssignmentIcon />,
    items: [
      { text: 'Job Acknowledgement', icon: <WorkIcon />, path: '/job-acknowledgement', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
      { text: 'Job Assignments', icon: <AssignmentIcon />, path: '/job-assignments', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER] },
      { text: 'Job Schedule', icon: <CalendarIcon />, path: '/job-schedule', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
    ]
  },
  {
    groupName: 'HR',
    icon: <BusinessIcon />,
    items: [
      { text: 'Employee List', icon: <PeopleIcon />, path: '/employees', roles: [UserRole.ADMIN] },
      { text: 'Employee Status', icon: <AssignmentIcon />, path: '/employee-status', roles: [UserRole.ADMIN, UserRole.MODERATOR] },
      { text: 'Announcements', icon: <AnnouncementIcon />, path: '/announcements', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
    ]
  },
  {
    groupName: 'Settings',
    icon: <SettingsIcon />,
    items: [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] },
    ]
  }
];

// Dashboard is kept separate as it's not part of any group
const dashboardItem = { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.MANAGER, UserRole.REGULAR] };

// New top-level item for Project Management
const projectManagementItem = { text: 'Project Management', icon: <AssignmentIcon />, path: '/projects', roles: [UserRole.ADMIN, UserRole.MANAGER] };

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationMenuAnchorEl, setNotificationMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Mock notifications
  const notifications = [
    { id: 1, message: "New announcement posted" },
    { id: 2, message: "Leave request approved" },
    { id: 3, message: "New job assignment" }
  ];

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleNavigation = (path: string) => {
    console.log('Navigating from:', router.pathname, 'to:', path);
    if (router.pathname !== path) {
      router.push(path, undefined, { shallow: true });
    }
  };

  const handleGroupToggle = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Filter navigation items based on user role
  const filteredNavigationGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => user && item.roles.includes(user.role))
  })).filter(group => group.items.length > 0);

  const showDashboard = user && dashboardItem.roles.includes(user.role);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <img src="/images/logo.png" alt="EdgeTech Logo" style={{ height: 40, marginRight: 16 }} />
            <Typography variant="h6" noWrap component="div">
              Employee Portal
            </Typography>
          </Box>
          
          {/* Notifications */}
          <IconButton 
            size="large" 
            color="inherit" 
            onClick={handleNotificationMenuOpen}
          >
            <Badge badgeContent={notifications.length} color="secondary">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notificationMenuAnchorEl}
            open={Boolean(notificationMenuAnchorEl)}
            onClose={handleNotificationMenuClose}
            PaperProps={{
              style: { width: '320px' }
            }}
          >
            {notifications.map((notification) => (
              <MenuItem key={notification.id} onClick={handleNotificationMenuClose}>
                {notification.message}
              </MenuItem>
            ))}
          </Menu>
          
          {/* User profile menu */}
          <IconButton
            size="large"
            edge="end"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              alt={user?.name} 
              src={user?.profilePicture} 
              sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
            />
          </IconButton>
          <Menu
            anchorEl={profileMenuAnchorEl}
            open={Boolean(profileMenuAnchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); handleNavigation('/profile'); }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={() => { handleProfileMenuClose(); handleNavigation('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 8px'
        }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="EdgeTech Logo"
            sx={{
              height: 50,
              width: 'auto',
              ml: 1
            }}
          />
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {/* Dashboard item */}
          {showDashboard && (
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => handleNavigation(dashboardItem.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {dashboardItem.icon}
                </ListItemIcon>
                <ListItemText primary={dashboardItem.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          )}

          {/* Project Management - Top Level */}
          {user && projectManagementItem.roles.includes(user.role) && (
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => handleNavigation(projectManagementItem.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {projectManagementItem.icon}
                </ListItemIcon>
                <ListItemText primary={projectManagementItem.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          )}

          <Divider />

          {/* Navigation groups */}
          {filteredNavigationGroups.map((group) => (
            <React.Fragment key={group.groupName}>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleGroupToggle(group.groupName)}>
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText primary={group.groupName} />
                  {expandedGroups[group.groupName] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={expandedGroups[group.groupName]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {group.items.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton 
                        selected={router.pathname === item.path}
                        onClick={() => handleNavigation(item.path)}
                        sx={{
                          pl: 4,
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'white',
                            '& .MuiListItemIcon-root': {
                              color: 'white',
                            },
                          },
                          '&.Mui-selected:hover': {
                            backgroundColor: 'primary.main',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: router.pathname === item.path ? 'white' : 'primary.main' 
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={item.text} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
};

export default Layout;