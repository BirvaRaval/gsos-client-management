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
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  Tooltip,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  VpnKey as VpnKeyIcon,
  Schedule as ScheduleIcon,
  Code as CodeIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { Client, ClientFormData } from '../types';
import { clientsApi } from '../utils/api';
import { notificationManager } from '../utils/notifications';

interface ModernClientModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
}

const ModernClientModal: React.FC<ModernClientModalProps> = ({ open, onClose, client, onSuccess }) => {
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
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Basic Info', 'Authentication', 'Version Details'];

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
    setActiveStep(0);
  }, [client, open]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        await clientsApi.update(client.id, formData);
        notificationManager.addNotification('client_edited', formData.client_name);
      } else {
        await clientsApi.create(formData);
        notificationManager.addNotification('client_created', formData.client_name);
      }
      onSuccess();
      onClose();
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleNext = () => {
    console.log('Current step:', activeStep, 'Is valid:', isStepValid(activeStep));
    
    // Validate current step before proceeding (except for step 2 which is optional)
    if (activeStep === 0 || activeStep === 1) {
      if (!isStepValid(activeStep)) {
        return;
      }
    }
    
    // Move to next step
    const nextStep = activeStep + 1;
    console.log('Moving to step:', nextStep);
    setActiveStep(nextStep);
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.client_name.trim() !== '' && formData.domain_url.trim() !== '';
      case 1:
        return formData.client_id.trim() !== '' && (client ? true : formData.password.trim() !== '');
      case 2:
        return true; // Version step is optional
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    const fadeProps = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.3 }
    };

    switch (step) {
      case 0:
        return (
          <motion.div {...fadeProps}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Tooltip title="Enter the client's company or organization name">
                <TextField
                  fullWidth
                  label="Client Name"
                  value={formData.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  required
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
              <Tooltip title="Enter the client's website URL (e.g., https://example.com)">
                <TextField
                  fullWidth
                  label="Domain URL"
                  value={formData.domain_url}
                  onChange={(e) => handleChange('domain_url', e.target.value)}
                  required
                  placeholder="https://example.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LanguageIcon color="primary" />
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
          </motion.div>
        );
      case 1:
        return (
          <motion.div {...fadeProps}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Tooltip title="Unique identifier for this client (e.g., ACME001)">
                <TextField
                  fullWidth
                  label="Client ID"
                  value={formData.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                  required
                  placeholder="e.g., ACME001"
                  helperText="Enter a unique identifier for this client"
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
              <Tooltip title={client ? "Leave blank to keep current password" : "Set a secure password for this client"}>
                <TextField
                  fullWidth
                  label={client ? 'New Password (optional)' : 'Password'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required={!client}
                  placeholder={client ? "Leave blank to keep current" : "Enter a secure password"}
                  helperText={client ? "Leave blank to keep current password" : "This password will be used for client authentication"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon color="primary" />
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
          </motion.div>
        );
      case 2:
        return (
          <motion.div {...fadeProps}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Tooltip title="When was the last pull performed">
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Latest Pull Date"
                    value={formData.latest_pull_date ? new Date(formData.latest_pull_date) : null}
                    onChange={(newValue) => {
                      if (newValue && !isNaN(newValue.getTime())) {
                        handleChange('latest_pull_date', newValue.toISOString().slice(0, 16));
                      } else {
                        handleChange('latest_pull_date', '');
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Select when the last pull was performed (optional)',
                        onKeyDown: handleKeyDown,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <ScheduleIcon color="primary" />
                            </InputAdornment>
                          )
                        },
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Tooltip>
              <Tooltip title="Who performed the latest pull">
                <TextField
                  fullWidth
                  label="Latest Pull Taken By"
                  value={formData.latest_pull_by}
                  onChange={(e) => handleChange('latest_pull_by', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter username or name"
                  helperText="Name of the person who performed the last pull (optional)"
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
              <Tooltip title="Current GSOS version (e.g., v2.1.3)">
                <TextField
                  fullWidth
                  label="GSOS Version"
                  value={formData.gsos_version}
                  onChange={(e) => handleChange('gsos_version', e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="v2.1.3"
                  helperText="Enter the current GSOS version (optional)"
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
          </motion.div>
        );
      default:
        return null;
    }
  };

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
            {client ? 'Edit Client' : 'Add New Client'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {client ? 'Update client information' : 'Create a new GSOS client entry'}
          </Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Box>
        <DialogContent sx={{ px: 3 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: activeStep === index ? 600 : 400
                    }
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ minHeight: 200, border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Current Step: {activeStep + 1} of {steps.length} - {steps[activeStep]}
            </Typography>
            <AnimatePresence mode="wait">
              {renderStepContent(activeStep)}
            </AnimatePresence>
          </Box>

          {/* Step Info */}
          {activeStep === 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold">Step 1 of 3 - Basic Information</Typography>
              Enter the basic information about your client organization.
            </Alert>
          )}
          {activeStep === 1 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold">Step 2 of 3 - Authentication Setup</Typography>
              Set up the client ID and password for secure access. Both fields are required to proceed.
            </Alert>
          )}
          {activeStep === 2 && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2" fontWeight="bold">Step 3 of 3 - Version Details (Optional)</Typography>
              Set the initial GSOS version for this client. This information is optional and can be added later.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button 
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={onClose} variant="outlined">
                Cancel
              </Button>
              
              {activeStep === 2 ? (
                <Button 
                  onClick={(e) => handleSubmit(e)}
                  variant="contained" 
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minWidth: 120
                  }}
                >
                  {loading ? 'Creating...' : (client ? 'Update Client' : 'Create Client')}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={!isStepValid(activeStep)}
                  sx={{
                    background: !isStepValid(activeStep)
                      ? 'rgba(0,0,0,0.12)' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: !isStepValid(activeStep)
                        ? 'rgba(0,0,0,0.12)' 
                        : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                    }
                  }}
                >
                  {activeStep === 0 ? 'Next: Authentication' : 'Next: Version Details'}
                </Button>
              )}
            </Box>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ModernClientModal;