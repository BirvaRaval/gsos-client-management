import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Fab,
  Tooltip,
  Zoom,
  Grow,
  Slide
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams
} from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  FileDownload as ExportIcon,
  Search as SearchIcon,
  GetApp as PullIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Update as UpdateIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Client } from '../types';
import { clientsApi } from '../utils/api';
import { exportToExcel, exportToCSV, exportToPDF } from '../utils/export';
import ClientModal from './ClientModal';
import PullEntryModal from './PullEntryModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const Dashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [selectedPullClient, setSelectedPullClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.domain_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    try {
      console.log('Fetching clients from API...');
      const response = await clientsApi.getAll();
      console.log('API Response:', response.data);
      setClients(response.data);
      setLoading(false);
      if (response.data.length === 0) {
        toast('No clients found. Click the + button to add your first client!', {
          icon: '📝',
          duration: 4000
        });
      }
    } catch (error: any) {
      console.error('API Error:', error);
      toast.error(`Failed to fetch clients: ${error.response?.data?.error || error.message}`);
      setLoading(false);
      // Set empty array so UI still works
      setClients([]);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientToDelete(client);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    
    setDeleteLoading(true);
    try {
      await clientsApi.delete(clientToDelete.id);
      toast.success(`"${clientToDelete.client_name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewHistory = (id: number) => {
    navigate(`/client/${id}/history`);
  };

  const handleViewDetails = (id: number) => {
    navigate(`/client/${id}`);
  };

  const handlePullEntry = (client: Client) => {
    setSelectedPullClient(client);
    setPullModalOpen(true);
  };

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `gsos-clients-${timestamp}`;
    
    switch (format) {
      case 'excel':
        exportToExcel(filteredClients, filename);
        break;
      case 'csv':
        exportToCSV(filteredClients, filename);
        break;
      case 'pdf':
        exportToPDF(filteredClients, filename);
        break;
    }
    
    setExportAnchor(null);
    toast.success(`Data exported as ${format.toUpperCase()}`);
  };

  const columns: GridColDef[] = [
    { field: 'client_name', headerName: 'Client Name', width: 200 },
    { field: 'domain_url', headerName: 'Domain URL', width: 250 },
    { field: 'client_id', headerName: 'Client ID', width: 150 },
    {
      field: 'latest_pull_date',
      headerName: 'Latest Pull Date',
      width: 180,
      renderCell: (params) => 
        params.value ? new Date(params.value).toLocaleDateString() : 'Never'
    },
    { field: 'latest_pull_by', headerName: 'Latest Pull By', width: 150 },
    {
      field: 'gsos_version',
      headerName: 'GSOS Version',
      width: 130,
      renderCell: (params) => 
        params.value ? <Chip label={params.value} size="small" /> : 'N/A'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: GridRowParams) => [
        <Tooltip title="View Details" arrow TransitionComponent={Zoom}>
          <GridActionsCellItem
            icon={<ViewIcon />}
            label="View"
            onClick={() => handleViewDetails(params.row.id)}
            sx={{ 
              '&:hover': { 
                color: '#4caf50',
                transform: 'scale(1.2)',
                transition: 'all 0.2s ease'
              }
            }}
          />
        </Tooltip>,
        <Tooltip title="Edit Client" arrow TransitionComponent={Zoom}>
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleEdit(params.row)}
            sx={{ 
              '&:hover': { 
                color: '#667eea',
                transform: 'scale(1.2)',
                transition: 'all 0.2s ease'
              }
            }}
          />
        </Tooltip>,
        <Tooltip title="Delete Client" arrow TransitionComponent={Zoom}>
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDelete(params.row.id)}
            sx={{ 
              '&:hover': { 
                color: '#f5576c',
                transform: 'scale(1.2)',
                transition: 'all 0.2s ease'
              }
            }}
          />
        </Tooltip>,
        <Tooltip title="Add Pull Entry" arrow TransitionComponent={Zoom}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PullIcon />}
            onClick={() => handlePullEntry(params.row)}
            sx={{
              minWidth: 'auto',
              px: 1,
              py: 0.5,
              fontSize: '0.75rem',
              borderColor: '#4facfe',
              color: '#4facfe',
              '&:hover': {
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(79, 172, 254, 0.1)',
                transform: 'scale(1.05)'
              }
            }}
          >
            Pull
          </Button>
        </Tooltip>,
        <Tooltip title="View Pull History" arrow TransitionComponent={Zoom}>
          <GridActionsCellItem
            icon={<HistoryIcon />}
            label="History"
            onClick={() => handleViewHistory(params.row.id)}
            sx={{ 
              '&:hover': { 
                color: '#764ba2',
                transform: 'scale(1.2)',
                transition: 'all 0.2s ease'
              }
            }}
          />
        </Tooltip>
      ]
    }
  ];

  const stats = {
    total: clients.length,
    recentPulls: clients.filter(c => 
      c.latest_pull_date && 
      new Date(c.latest_pull_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    versions: Array.from(new Set(clients.map(c => c.gsos_version).filter(Boolean))).length
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            GSOS Client Management
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Manage your client versions and pull history
          </Typography>
        </Box>

        {/* Interactive Stats Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Tooltip title="Total number of registered clients" arrow placement="top">
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover::before': {
                  left: '100%'
                }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', zIndex: 1 }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <GroupIcon sx={{ fontSize: 50, opacity: 0.9 }} />
                  </motion.div>
                  <Box>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    >
                      <Typography variant="h2" sx={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                        {stats.total}
                      </Typography>
                    </motion.div>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      Total Clients
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Tooltip>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Tooltip title="Clients with pulls in the last 7 days" arrow placement="top">
              <Card sx={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover::before': {
                  left: '100%'
                }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', zIndex: 1 }}>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 50, opacity: 0.9 }} />
                  </motion.div>
                  <Box>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    >
                      <Typography variant="h2" sx={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                        {stats.recentPulls}
                      </Typography>
                    </motion.div>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      Recent Pulls (7d)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Tooltip>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: 1, minWidth: 200 }}
          >
            <Tooltip title="Number of different GSOS versions in use" arrow placement="top">
              <Card sx={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                height: '140px',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s'
                },
                '&:hover::before': {
                  left: '100%'
                }
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', zIndex: 1 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <UpdateIcon sx={{ fontSize: 50, opacity: 0.9 }} />
                  </motion.div>
                  <Box>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    >
                      <Typography variant="h2" sx={{ fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                        {stats.versions}
                      </Typography>
                    </motion.div>
                    <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                      GSOS Versions
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Tooltip>
          </motion.div>
        </Box>

        {/* Interactive Search and Export */}
        <Slide direction="down" in={true} timeout={800}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ flex: 1, maxWidth: 400 }}
            >
              <Tooltip title="Search by client name, domain, or client ID" arrow placement="top">
                <TextField
                  placeholder="🔍 Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <motion.div
                        animate={{ rotate: searchTerm ? 360 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      </motion.div>
                    )
                  }}
                  sx={{ 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                        borderWidth: 2
                      }
                    }
                  }}
                />
              </Tooltip>
            </motion.div>
            
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Tooltip title="Export client data in various formats" arrow placement="top">
                <Button
                  startIcon={
                    <motion.div
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ExportIcon />
                    </motion.div>
                  }
                  onClick={(e) => setExportAnchor(e.currentTarget)}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor: '#667eea',
                    color: '#667eea',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#5a6fd8',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                >
                  Export Data
                </Button>
              </Tooltip>
            </motion.div>
          </Box>
        </Slide>

        {/* Enhanced Data Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <DataGrid
              rows={filteredClients}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              sx={{ 
                height: 600,
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderBottom: '2px solid #e0e0e0'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f0f0f0'
                }
              }}
            />
          </Card>
        </motion.div>

        {/* Interactive Add Client FAB */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <Tooltip title="Add New Client" arrow placement="left">
            <Fab
              aria-label="add client"
              sx={{ 
                position: 'fixed', 
                bottom: 24, 
                right: 24,
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 12px 35px rgba(102, 126, 234, 0.6)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover::before': {
                  opacity: 1
                }
              }}
              onClick={() => {
                setSelectedClient(null);
                setModalOpen(true);
              }}
            >
              <motion.div
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <AddIcon sx={{ fontSize: 28 }} />
              </motion.div>
            </Fab>
          </Tooltip>
        </motion.div>

        {/* Enhanced Export Menu */}
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
          TransitionComponent={Grow}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid rgba(102, 126, 234, 0.1)',
              minWidth: 200
            }
          }}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
              📊 Export Options
            </Typography>
            
            <Tooltip title="Excel file with multiple sheets including summary and version breakdown" placement="right" arrow>
              <MenuItem 
                onClick={() => handleExport('excel')}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 1, 
                    backgroundColor: '#4CAF50', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>XLS</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Excel Report</Typography>
                    <Typography variant="caption" color="text.secondary">Multi-sheet workbook</Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Tooltip>
            
            <Tooltip title="Comma-separated values file with metadata header" placement="right" arrow>
              <MenuItem 
                onClick={() => handleExport('csv')}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 1, 
                    backgroundColor: '#FF9800', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>CSV</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>CSV Export</Typography>
                    <Typography variant="caption" color="text.secondary">Raw data format</Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Tooltip>
            
            <Tooltip title="Professional PDF report with statistics and formatted tables" placement="right" arrow>
              <MenuItem 
                onClick={() => handleExport('pdf')}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 1, 
                    backgroundColor: '#F44336', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}>PDF</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>PDF Report</Typography>
                    <Typography variant="caption" color="text.secondary">Professional format</Typography>
                  </Box>
                </Box>
              </MenuItem>
            </Tooltip>
          </Box>
        </Menu>

        {/* Client Modal */}
        <ClientModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          client={selectedClient}
          onSuccess={fetchClients}
        />

        {/* Pull Entry Modal */}
        <PullEntryModal
          open={pullModalOpen}
          onClose={() => setPullModalOpen(false)}
          client={selectedPullClient}
          onSuccess={fetchClients}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setClientToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          client={clientToDelete}
          loading={deleteLoading}
        />
      </motion.div>
    </Box>
  );
};

export default Dashboard;