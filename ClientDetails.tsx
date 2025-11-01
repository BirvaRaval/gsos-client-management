import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Domain as DomainIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Client } from '../types';
import { clientsApi } from '../utils/api';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClient(parseInt(id));
    }
  }, [id]);

  const fetchClient = async (clientId: number) => {
    try {
      const response = await clientsApi.getDetails(clientId);
      setClient(response.data);
    } catch (error) {
      toast.error('Failed to fetch client details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Client not found</Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {client.client_name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Client Details & Authentication
            </Typography>
          </Box>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Edit Client
          </Button>
        </Box>

        {/* Client Details Card */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <PersonIcon color="primary" />
              Client Details
            </Typography>
            <Divider sx={{ mb: 4 }} />
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Client Name
                    </Typography>
                    <Typography variant="h6" fontWeight="500">
                      {client.client_name}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Domain URL
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DomainIcon fontSize="small" color="action" />
                      <Typography variant="body1">
                        {client.domain_url}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Client ID
                    </Typography>
                    <Chip 
                      label={client.client_id} 
                      variant="outlined" 
                      sx={{ fontFamily: 'monospace' }}
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Created Date
                    </Typography>
                    <Typography variant="body1">
                      {client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Password
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                        {showPassword ? (client.original_password || client.password) : '•'.repeat((client.original_password || client.password)?.length || 12)}
                      </Typography>
                      <Tooltip title={showPassword ? 'Hide' : 'Show'}>
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};

export default ClientDetails;