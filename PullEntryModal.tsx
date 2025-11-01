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
  IconButton,
  InputAdornment,
  Tooltip,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  PostAdd as PullIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { Client, PullEntryData } from '../types';
import { clientsApi } from '../utils/api';
import { notificationManager } from '../utils/notifications';

interface PullEntryModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

const PullEntryModal: React.FC<PullEntryModalProps> = ({ open, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState<PullEntryData>({
    pull_date: new Date().toISOString().slice(0, 16),
    pull_by: '',
    version: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        pull_date: new Date().toISOString().slice(0, 16),
        pull_by: '',
        version: client?.gsos_version || ''
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    
    if (!formData.pull_by.trim()) {
      toast.error('Please enter who performed the pull');
      return;
    }

    setLoading(true);
    try {
      await clientsApi.addHistory(client.id, formData);
      notificationManager.addNotification('pull_recorded', client.client_name);
      toast.success(`New pull recorded in ${client.client_name} client`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to record pull entry');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PullEntryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!client) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Record Pull Entry
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add a new pull record for {client.client_name}
          </Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3 }}>
          {/* Client Info Banner */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: 2,
            mb: 3
          }}>
            <PullIcon />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {client.client_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip 
                  label={client.client_id} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
                <Chip 
                  label={client.gsos_version || 'No Version'} 
                  size="small" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Tooltip title="Enter the name or username of the person who performed the pull">
              <TextField
                fullWidth
                label="Pull Taken By"
                value={formData.pull_by}
                onChange={(e) => handleChange('pull_by', e.target.value)}
                required
                placeholder="Enter your name or username"
                helperText="Name of the person who performed this pull"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Tooltip>

            <Tooltip title="Select when the pull was performed">
              <TextField
                fullWidth
                label="Pull Date & Time"
                type="datetime-local"
                value={formData.pull_date}
                onChange={(e) => handleChange('pull_date', e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="When was this pull performed"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon color="primary" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Tooltip>

            <Tooltip title="Enter the new GSOS version after this pull (e.g., v2.1.4)">
              <TextField
                fullWidth
                label="New GSOS Version"
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                placeholder="v2.1.4"
                helperText="Enter the version after this pull (optional)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CodeIcon color="primary" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Tooltip>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              This will add a new entry to the pull history and update the client's latest pull information.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !formData.pull_by.trim()}
              sx={{
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                minWidth: 120
              }}
            >
              {loading ? 'Recording...' : 'Record Pull'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PullEntryModal;