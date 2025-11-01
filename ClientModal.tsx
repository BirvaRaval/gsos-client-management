import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Domain as DomainIcon,
  Key as KeyIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import toast from 'react-hot-toast';
import { Client, ClientFormData } from '../types';
import { clientsApi } from '../utils/api';

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ open, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState<ClientFormData>({
    client_name: '',
    domain_url: '',
    client_id: '',
    password: '',
    latest_pull_date: '',
    latest_pull_by: '',
    gsos_version: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name,
        domain_url: client.domain_url,
        client_id: client.client_id,
        password: '',
        latest_pull_date: client.latest_pull_date || '',
        latest_pull_by: client.latest_pull_by || '',
        gsos_version: client.gsos_version || ''
      });
    } else {
      setFormData({
        client_name: '',
        domain_url: '',
        client_id: '',
        password: '',
        latest_pull_date: '',
        latest_pull_by: '',
        gsos_version: ''
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        await clientsApi.update(client.id, formData);
        toast.success('Client updated successfully');
      } else {
        await clientsApi.create(formData);
        toast.success('Client created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(client ? 'Failed to update client' : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6">
              {client ? 'Edit Client' : 'Add New Client'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {client ? 'Update client information' : 'Create a new client entry'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <PersonIcon color="action" />
                  <TextField
                    fullWidth
                    label="Client Name"
                    value={formData.client_name}
                    onChange={(e) => handleChange('client_name', e.target.value)}
                    required
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <DomainIcon color="action" />
                  <TextField
                    fullWidth
                    label="Domain URL"
                    value={formData.domain_url}
                    onChange={(e) => handleChange('domain_url', e.target.value)}
                    required
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <BadgeIcon color="action" />
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={formData.client_id}
                    onChange={(e) => handleChange('client_id', e.target.value)}
                    required
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <KeyIcon color="action" />
                  <TextField
                    fullWidth
                    label={client ? 'New Password (leave blank to keep current)' : 'Password'}
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required={!client}
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {client && (
                <>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Pull Information (Read Only)
                    </Typography>
                  </Divider>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <TextField
                      fullWidth
                      label="Latest Pull Date"
                      value={client.latest_pull_date ? new Date(client.latest_pull_date).toLocaleString() : 'Never'}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Latest Pull By"
                      value={client.latest_pull_by || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="GSOS Version"
                      value={client.gsos_version || 'N/A'}
                      InputProps={{ readOnly: true }}
                      variant="filled"
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ 
                minWidth: 100,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {loading ? 'Saving...' : (client ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </motion.div>
    </Dialog>
  );
};

export default ClientModal;