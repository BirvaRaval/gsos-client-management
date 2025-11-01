import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Palette,
  Notifications,
  Refresh,
  Language,
  Security,
  TableRows,
  Delete
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { clientsApi } from '../utils/api';

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  tablePageSize: number;
  language: string;
  themeColor: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: false,
    notifications: true,
    tablePageSize: 10,
    language: 'en',
    themeColor: 'blue'
  });
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('gsos-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    
    // Load client count
    fetchClientCount();
  }, []);

  const fetchClientCount = async () => {
    try {
      const response = await clientsApi.getAll();
      setClientCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch client count:', error);
    }
  };

  const saveSettings = (newSettings: SettingsState) => {
    try {
      localStorage.setItem('gsos-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    
    // Special handling for theme
    if (key === 'darkMode') {
      localStorage.setItem('darkMode', value.toString());
      toast.success(`${value ? 'Dark' : 'Light'} theme applied. Refresh to see changes.`);
    } else if (key === 'themeColor') {
      localStorage.setItem('themeColor', value);
      toast.success(`${value.charAt(0).toUpperCase() + value.slice(1)} theme color applied. Refresh to see changes.`);
    } else {
      const settingName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      toast.success(`${settingName.charAt(0).toUpperCase() + settingName.slice(1)} updated`);
    }
  };



  const handleClearCache = () => {
    try {
      localStorage.removeItem('gsos-settings');
      sessionStorage.clear();
      toast.success('Cache cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  };

  const handleResetSettings = () => {
    const defaultSettings: SettingsState = {
      darkMode: false,
      notifications: true,
      tablePageSize: 10,
      language: 'en',
      themeColor: 'blue'
    };
    saveSettings(defaultSettings);
    localStorage.removeItem('themeColor');
    toast.success('Settings reset to defaults');
  };

  const themeColors = [
    { name: 'blue', color: '#1976d2', label: 'Blue' },
    { name: 'purple', color: '#9c27b0', label: 'Purple' },
    { name: 'green', color: '#388e3c', label: 'Green' },
    { name: 'orange', color: '#f57c00', label: 'Orange' },
    { name: 'red', color: '#d32f2f', label: 'Red' },
    { name: 'teal', color: '#00796b', label: 'Teal' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
          <SettingsIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Settings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Customize your GSOS Manager experience
          </Typography>
        </Box>
      </Box>

      {/* Appearance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🎨 Appearance & Theme
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Customize the look and feel of your dashboard
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText
                primary="Dark Mode"
                secondary="Switch between light and dark themes"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.darkMode}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Language />
              </ListItemIcon>
              <ListItemText
                primary="Language"
                secondary="Select your preferred language"
              />
              <ListItemSecondaryAction>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Español</MenuItem>
                    <MenuItem value="fr">Français</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Palette />
              </ListItemIcon>
              <ListItemText
                primary="Theme Color"
                secondary="Choose your preferred accent color"
              />
              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                {themeColors.map((theme) => (
                  <Box
                    key={theme.name}
                    onClick={() => handleSettingChange('themeColor', theme.name)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: theme.color,
                      cursor: 'pointer',
                      border: settings.themeColor === theme.name ? '3px solid #000' : '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        transition: 'transform 0.2s'
                      }
                    }}
                    title={theme.label}
                  />
                ))}
              </Box>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Performance & Behavior */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            ⚡ Performance & Behavior
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Configure application behavior and performance
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Notifications />
              </ListItemIcon>
              <ListItemText
                primary="Push Notifications"
                secondary="Get notified about important events"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <TableRows />
              </ListItemIcon>
              <ListItemText
                primary="Table Page Size"
                secondary="Number of rows per page in data tables"
              />
              <ListItemSecondaryAction>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={settings.tablePageSize}
                    onChange={(e) => handleSettingChange('tablePageSize', e.target.value)}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>



      {/* System & Maintenance */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🔧 System & Maintenance
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            System information and maintenance tools
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip icon={<Security />} label="Version 1.0.0" variant="outlined" />
            <Chip label={`${clientCount} Clients`} color="primary" variant="outlined" />
            <Chip label="Database Connected" color="success" variant="outlined" />
          </Box>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Theme: {settings.darkMode ? 'Dark' : 'Light'} • 
              Language: {settings.language.toUpperCase()} • 
              Page Size: {settings.tablePageSize} rows
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={handleClearCache}
              size="small"
            >
              Clear Cache
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Refresh />}
              onClick={handleResetSettings}
              size="small"
            >
              Reset Settings
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;