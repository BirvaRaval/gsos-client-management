import React, { useState, useEffect } from 'react';
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
  Switch,
  Tooltip,
  Badge,
  Popover,
  Paper,
  Button,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Brightness4,
  Brightness7,
  Notifications,
  Clear,
  DoneAll
} from '@mui/icons-material';
import { notificationManager, Notification } from '../utils/notifications';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onThemeToggle: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, darkMode, onThemeToggle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const [themeColor, setThemeColor] = useState('#1976d2');
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setNotifications(notificationManager.getNotifications());
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const savedThemeColor = localStorage.getItem('themeColor');
    if (savedThemeColor) {
      const themeColors: Record<string, string> = {
        blue: '#1976d2',
        purple: '#9c27b0',
        green: '#388e3c',
        orange: '#f57c00',
        red: '#d32f2f',
        teal: '#00796b'
      };
      setThemeColor(themeColors[savedThemeColor] || '#1976d2');
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllRead = () => {
    notificationManager.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationManager.clearAll();
  };

  const unreadCount = notificationManager.getUnreadCount();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
          GSOS Manager
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Client Version Control
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                backgroundColor: location.pathname === item.path ? theme.palette.primary.main + '15' : 'transparent',
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '10',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                minWidth: 40 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Theme Toggle */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 1.5,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {darkMode ? <Brightness4 /> : <Brightness7 />}
            <Typography variant="body2">
              {darkMode ? 'Dark' : 'Light'} Mode
            </Typography>
          </Box>
          <Switch
            checked={darkMode}
            onChange={onThemeToggle}
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          color: theme.palette.text.primary
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationClick}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Popover
              open={Boolean(notificationAnchor)}
              anchorEl={notificationAnchor}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <Paper sx={{ width: 350, maxHeight: 400 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Notifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllRead} startIcon={<DoneAll />}>
                          Mark All Read
                        </Button>
                      )}
                      <Button size="small" onClick={handleClearAll} startIcon={<Clear />}>
                        Clear
                      </Button>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        No notifications yet
                      </Typography>
                    </Box>
                  ) : (
                    notifications.map((notification) => (
                      <ListItem
                        key={notification.id}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          backgroundColor: notification.read ? 'transparent' : 'action.hover'
                        }}
                      >
                        <ListItemText
                          primary={notification.message}
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              <Typography variant="caption" color="textSecondary">
                                {notification.timestamp.toLocaleString()}
                              </Typography>
                              <Chip
                                label={
                                  notification.type === 'client_created' ? 'Added' :
                                  notification.type === 'client_deleted' ? 'Deleted' :
                                  notification.type === 'client_edited' ? 'Updated' :
                                  'Pull Recorded'
                                }
                                size="small"
                                color={
                                  notification.type === 'client_created' ? 'success' :
                                  notification.type === 'client_deleted' ? 'error' :
                                  notification.type === 'client_edited' ? 'warning' :
                                  'primary'
                                }
                                variant="outlined"
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </Box>
              </Paper>
            </Popover>
            
            <Avatar sx={{ 
              width: 36, 
              height: 36,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            }}>
              A
            </Avatar>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;