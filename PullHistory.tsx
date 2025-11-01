import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  Tooltip,
  Fab
} from '@mui/material';
import {
  DataGrid,
  GridColDef
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PullHistory as PullHistoryType, Client, PullEntryData } from '../types';
import { clientsApi } from '../utils/api';
import PullEntryModal from './PullEntryModal';

const PullHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<PullHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pullEntryModalOpen, setPullEntryModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    pull_date: new Date().toISOString().slice(0, 16),
    pull_by: ''
  });

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    try {
      const [historyResponse, clientsResponse] = await Promise.all([
        clientsApi.getHistory(Number(id)),
        clientsApi.getAll()
      ]);
      
      setHistory(historyResponse.data);
      const currentClient = clientsResponse.data.find(c => c.id === Number(id));
      setClient(currentClient || null);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch pull history');
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.pull_by.trim()) {
      toast.error('Please enter who performed the pull');
      return;
    }

    try {
      await clientsApi.addHistory(Number(id), newEntry);
      toast.success('Pull history entry added successfully! ✨');
      setModalOpen(false);
      setNewEntry({
        pull_date: new Date().toISOString().slice(0, 16),
        pull_by: ''
      });
      fetchHistory();
    } catch (error) {
      toast.error('Failed to add pull history entry');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'pull_date',
      headerName: 'Pull Date',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          <Typography variant="body2">
            {new Date(params.value).toLocaleString()}
          </Typography>
        </Box>
      )
    },
    {
      field: 'pull_by',
      headerName: 'Pull Taken By',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'primary.main' }}>
            {params.value.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'created_at',
      headerName: 'Recorded At',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(params.value).toLocaleString()}
        </Typography>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>Loading pull history...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">Client not found</Typography>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
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
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/')}
            sx={{ textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary" fontWeight={500}>Pull History</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white'
        }}>
          <IconButton 
            onClick={() => navigate('/')} 
            sx={{ 
              mr: 3,
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <BackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 48, height: 48 }}>
            <HistoryIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Pull History
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={client.client_name} 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {client.domain_url}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Client Info Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s ease' }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CodeIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Client ID
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {client.client_id}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s ease' }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Latest Pull
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {client.latest_pull_date 
                      ? new Date(client.latest_pull_date).toLocaleDateString()
                      : 'Never'
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 152, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s ease' }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pull By
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {client.latest_pull_by || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Card sx={{ 
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(156, 39, 176, 0.05) 100%)',
              border: '1px solid rgba(156, 39, 176, 0.2)',
              '&:hover': { transform: 'translateY(-2px)', transition: 'all 0.2s ease' }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <CodeIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {client.gsos_version || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Tooltip title="Add new pull entry">
                    <IconButton
                      onClick={() => setPullEntryModalOpen(true)}
                      sx={{
                        bgcolor: 'secondary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'secondary.dark',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* History Table Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Pull History Records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {history.length} total entries • Use the floating + button to add new entries
            </Typography>
          </Box>
        </Box>

        {/* History Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <DataGrid
              rows={history}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              sx={{ 
                height: 500,
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)'
                }
              }}
            />
          </Card>
        </motion.div>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease'
            }
          }}
          onClick={() => setPullEntryModalOpen(true)}
        >
          <AddIcon />
        </Fab>

        {/* Add Entry Modal */}
        <Dialog 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Add Pull History Entry
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Record a new pull activity for {client.client_name}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Pull Date & Time"
                type="datetime-local"
                value={newEntry.pull_date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, pull_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <TextField
                fullWidth
                label="Pull Taken By"
                value={newEntry.pull_by}
                onChange={(e) => setNewEntry(prev => ({ ...prev, pull_by: e.target.value }))}
                required
                placeholder="Enter name or username"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={() => setModalOpen(false)} variant="outlined">
              Cancel
            </Button>
            <Button 
              onClick={handleAddEntry} 
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Add Entry
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pull Entry Modal */}
        <PullEntryModal
          open={pullEntryModalOpen}
          onClose={() => setPullEntryModalOpen(false)}
          client={client}
          onSuccess={fetchHistory}
        />
      </motion.div>
    </Box>
  );
};

export default PullHistory;