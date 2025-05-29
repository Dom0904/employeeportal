import React, { useState } from 'react';
import { Badge, IconButton, Popover, List, ListItem, Typography, Divider, Button, Box, Avatar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    handleClose();
    // Navigation would be handled by the link in the notification
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        aria-label="show notifications"
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 360, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </Box>
          
          <Divider />
          
          {recentNotifications.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">No notifications</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {recentNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  {notification.link ? (
                    <React.Fragment>
                      <ListItem key={notification.id} 
                        button
                        component="a"
                        href={notification.link}
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                        sx={{
                          bgcolor: !notification.read ? 'action.hover' : 'transparent',
                          '&:hover': { bgcolor: 'action.selected' },
                          px: 2,
                          py: 1.5,
                          textDecoration: 'none',
                          color: 'inherit'
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Avatar 
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                              }}
                            >
                              {notification.type === 'success' ? '✓' : 
                               notification.type === 'error' ? '!' : 
                               notification.type === 'warning' ? '⚠' : 'i'}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{
                                  fontWeight: notification.read ? 'normal' : 'bold',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </Typography>
                            </Box>
                            {!notification.read && (
                              <Box 
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1,
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                      <Divider />
                  ) : (
                    <ListItem key={notification.id} 
                        button
                        onClick={() => handleNotificationClick(notification.id)}
                        sx={{
                          bgcolor: !notification.read ? 'action.hover' : 'transparent',
                          '&:hover': { bgcolor: 'action.selected' },
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Avatar 
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                              }}
                            >
                              {notification.type === 'success' ? '✓' : 
                               notification.type === 'error' ? '!' : 
                               notification.type === 'warning' ? '⚠' : 'i'}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                sx={{
                                  fontWeight: notification.read ? 'normal' : 'bold',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {notification.message}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </Typography>
                            </Box>
                            {!notification.read && (
                              <Box 
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  ml: 1,
                                }}
                              />
                          </Box>
                          {!notification.read && (
                            <Box 
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                ml: 1,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                    <Divider />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
          
          {notifications.length > 0 && (
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button 
                component="a"
                href="/announcements"
                size="small"
                onClick={handleClose}
              >
                View all notifications
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default NotificationBell;
