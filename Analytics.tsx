import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  Schedule,
  People,
  Code,
  Timeline,
  Assessment,
  Star,
  Warning
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Client, PullHistory } from '../types';
import { clientsApi } from '../utils/api';

const Analytics: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await clientsApi.getAll();
      setClients(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getAnalytics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentPulls = clients.filter(c => 
      c.latest_pull_date && new Date(c.latest_pull_date) > sevenDaysAgo
    );

    const outdatedClients = clients.filter(c => 
      !c.latest_pull_date || new Date(c.latest_pull_date) < thirtyDaysAgo
    );

    const versionDistribution = clients.reduce((acc, client) => {
      const version = client.gsos_version || 'Unknown';
      acc[version] = (acc[version] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUsers = clients.reduce((acc, client) => {
      if (client.latest_pull_by) {
        acc[client.latest_pull_by] = (acc[client.latest_pull_by] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClients: clients.length,
      recentPulls: recentPulls.length,
      outdatedClients: outdatedClients.length,
      healthScore: clients.length > 0 ? Math.round((recentPulls.length / clients.length) * 100) : 0,
      versionDistribution: Object.entries(versionDistribution).sort((a, b) => b[1] - a[1]),
      topUsers: Object.entries(topUsers).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  };

  const analytics = getAnalytics();

  const MetricCard = ({ title, value, icon, color, subtitle, progress }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${color}25`
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography color="textSecondary" variant="body2">
                {title}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={color}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          </Box>
          {progress !== undefined && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: `${color}10`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: color,
                    borderRadius: 4
                  }
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {progress}% Health Score
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Insights and metrics for your GSOS client management
        </Typography>

        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Total Clients"
              value={analytics.totalClients}
              icon={<People />}
              color="#1976d2"
              subtitle="Active clients"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Recent Activity"
              value={analytics.recentPulls}
              icon={<Schedule />}
              color="#4caf50"
              subtitle="Pulls in last 7 days"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Outdated Clients"
              value={analytics.outdatedClients}
              icon={<Warning />}
              color="#ff9800"
              subtitle="No pulls in 30+ days"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <MetricCard
              title="Health Score"
              value={`${analytics.healthScore}%`}
              icon={<Assessment />}
              color="#9c27b0"
              subtitle="Overall system health"
            />
          </Grid>
        </Grid>

        {/* Detailed Analytics */}
        <Grid container spacing={3}>
          {/* Version Distribution */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Code />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Version Distribution
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        GSOS versions across clients
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List>
                    {analytics.versionDistribution.map(([version, count], index) => (
                      <ListItem key={version} sx={{ px: 0, py: 1.5 }}>
                        <Box sx={{ minWidth: 100, mr: 2 }}>
                          <Chip 
                            label={version} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </Box>
                        <ListItemText
                          primary={`${count} clients`}
                          secondary={`${Math.round((count / analytics.totalClients) * 100)}% of total`}
                          sx={{ ml: 1 }}
                        />
                        <Box sx={{ width: 60, ml: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={(count / analytics.totalClients) * 100}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Top Contributors */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <Star />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        Top Contributors
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Most active pull performers
                      </Typography>
                    </Box>
                  </Box>
                  
                  <List>
                    {analytics.topUsers.map(([user, count], index) => (
                      <ListItem key={user} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32',
                            color: 'white',
                            width: 32,
                            height: 32
                          }}>
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user}
                          secondary={`${count} pulls performed`}
                        />
                        <Chip 
                          label={count} 
                          size="small" 
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </ListItem>
                    ))}
                    {analytics.topUsers.length === 0 && (
                      <ListItem>
                        <ListItemText
                          primary="No pull data available"
                          secondary="Start recording pulls to see contributor statistics"
                        />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default Analytics;