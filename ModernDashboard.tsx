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
  InputAdornment,
  Skeleton,
  Tooltip,
  LinearProgress
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
  TrendingUp,
  Schedule,
  Verified,
  FilterList,
  Refresh,
  PostAdd as PullIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { Client } from '../types';
import { clientsApi } from '../utils/api';
import { exportToExcel, exportToCSV, exportToPDF } from '../utils/export';
import ClientModal from './ModernClientModal';
import PullEntryModal from './PullEntryModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { notificationManager } from '../utils/notifications';

const ModernDashboard: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullModalOpen, setPullModalOpen] = useState(false);
  const [selectedPullClient, setSelectedPullClient] = useState<Client | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    version: '',
    pullStatus: 'all', // all, recent, outdated, never
    healthStatus: 'all' // all, healthy, warning, critical
  });
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    let filtered = clients.filter(client =>
      client.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.domain_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.latest_pull_by && client.latest_pull_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.gsos_version && client.gsos_version.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply version filter
    if (filters.version) {
      filtered = filtered.filter(client => 
        client.gsos_version && client.gsos_version.toLowerCase().includes(filters.version.toLowerCase())
      );
    }

    // Apply pull status filter
    if (filters.pullStatus !== 'all') {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(client => {
        const lastPull = client.latest_pull_date ? new Date(client.latest_pull_date) : null;
        
        switch (filters.pullStatus) {
          case 'recent':
            return lastPull && lastPull > sevenDaysAgo;
          case 'outdated':
            return !lastPull || lastPull < thirtyDaysAgo;
          case 'never':
            return !lastPull;
          default:
            return true;
        }
      });
    }

    // Apply health status filter
    if (filters.healthStatus !== 'all') {
      filtered = filtered.filter(client => {
        const health = getHealthScore(client);
        switch (filters.healthStatus) {
          case 'healthy':
            return health.value >= 70;
          case 'warning':
            return health.value >= 30 && health.value < 70;
          case 'critical':
            return health.value < 30;
          default:
            return true;
        }
      });
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, filters]);

  const fetchClients = async () => {
    try {
      setRefreshing(true);
      const response = await clientsApi.getAll();
      setClients(response.data);
      setLoading(false);

    } catch (error: any) {

      setLoading(false);
      setClients([]);
    } finally {
      setRefreshing(false);
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
      notificationManager.addNotification('client_deleted', clientToDelete.client_name);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (error) {

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

  const handleAddPull = (client: Client) => {
    setSelectedPullClient(client);
    setPullModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      return;
    }

    const selectedClients = clients.filter(c => selectedRows.includes(c.id));
    setClientToDelete(null);
    setDeleteDialogOpen(true);
    // Store selected clients for bulk delete
    (window as any).bulkDeleteClients = selectedClients;
  };

  const handleBulkDeleteConfirm = async () => {
    const bulkClients = (window as any).bulkDeleteClients || [];
    if (bulkClients.length === 0) return;
    
    setDeleteLoading(true);
    try {
      await Promise.all(bulkClients.map((c: Client) => clientsApi.delete(c.id)));

      setSelectedRows([]);
      setBulkActionsOpen(false);
      setDeleteDialogOpen(false);
      delete (window as any).bulkDeleteClients;
      fetchClients();
    } catch (error) {

    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectionChange = (newSelection: number[]) => {
    setSelectedRows(newSelection);
    setBulkActionsOpen(newSelection.length > 0);
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

  };

  const getHealthScore = (client: Client) => {
    const daysSinceLastPull = client.latest_pull_date 
      ? Math.floor((Date.now() - new Date(client.latest_pull_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysSinceLastPull <= 7) return { score: 'Excellent', color: '#4caf50', value: 90 };
    if (daysSinceLastPull <= 30) return { score: 'Good', color: '#ff9800', value: 70 };
    return { score: 'Needs Attention', color: '#f44336', value: 30 };
  };

  const columns: GridColDef[] = [
    {
      field: 'serial',
      headerName: 'S.No',
      width: 80,
      renderCell: (params) => {
        const index = filteredClients.findIndex(client => client.id === params.row.id);
        return (
          <Typography variant="body2" fontWeight={500}>
            {index + 1}
          </Typography>
        );
      },
      sortable: false,
      filterable: false
    },
    { 
      field: 'client_name', 
      headerName: 'Client Name', 
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: getHealthScore(params.row).color
            }}
          />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { field: 'domain_url', headerName: 'Domain URL', width: 250 },
    { field: 'client_id', headerName: 'Client ID', width: 150 },
    {
      field: 'latest_pull_date',
      headerName: 'Latest Pull',
      width: 180,
      renderCell: (params) => {
        const date = params.value ? new Date(params.value) : null;
        const isRecent = date && (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isRecent && <Verified sx={{ fontSize: 16, color: 'success.main' }} />}
            <Typography variant="body2">
              {date ? date.toLocaleDateString() : 'Never'}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'latest_pull_by', 
      headerName: 'Pull By', 
      width: 150,
      renderCell: (params) => params.value || 'N/A'
    },
    {
      field: 'gsos_version',
      headerName: 'Version',
      width: 130,
      renderCell: (params) => 
        params.value ? (
          <Chip 
            label={params.value} 
            size="small" 
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        ) : 'N/A'
    },
    {
      field: 'health',
      headerName: 'Health',
      width: 120,
      renderCell: (params) => {
        const health = getHealthScore(params.row);
        return (
          <Tooltip title={`${health.score} - ${health.value}%`}>
            <Box sx={{ width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={health.value}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: health.color,
                    borderRadius: 3
                  }
                }}
              />
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="Record a new pull entry for this client">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: 'white',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                },
                transition: 'all 0.2s ease'
              }}>
                <PullIcon fontSize="small" />
              </Box>
            </Tooltip>
          }
          label="Record Pull"
          onClick={() => handleAddPull(params.row)}
        />,
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="View Details"
          onClick={() => handleViewDetails(params.row.id)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit Client"
          onClick={() => handleEdit(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<HistoryIcon />}
          label="View History"
          onClick={() => handleViewHistory(params.row.id)}
          showInMenu
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete Client"
          onClick={() => handleDelete(params.row.id)}
          showInMenu
        />
      ]
    }
  ];

  const stats = {
    total: clients.length,
    recentPulls: clients.filter(c => 
      c.latest_pull_date && 
      new Date(c.latest_pull_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    versions: Array.from(new Set(clients.map(c => c.gsos_version).filter(Boolean))).length,
    healthyClients: clients.filter(c => getHealthScore(c).value >= 70).length
  };

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}20`,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 25px ${color}25`
      }
    }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={color}>
                {loading ? <Skeleton width={60} /> : value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: `${color}15`,
              color: color
            }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={120} sx={{ flex: 1, borderRadius: 2 }} />
          ))}
        </Box>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Client Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage and monitor your GSOS client versions
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <StatCard
              title="Total Clients"
              value={stats.total}
              icon={<TrendingUp />}
              color="#1976d2"
              subtitle="Active clients"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <StatCard
              title="Recent Pulls"
              value={stats.recentPulls}
              icon={<Schedule />}
              color="#4caf50"
              subtitle="Last 7 days"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <StatCard
              title="GSOS Versions"
              value={stats.versions}
              icon={<Verified />}
              color="#ff9800"
              subtitle="In use"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <StatCard
              title="Healthy Clients"
              value={stats.healthyClients}
              icon={<Verified />}
              color="#4caf50"
              subtitle="Good status"
            />
          </Box>
        </Box>

        {/* Search and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search clients, domains, versions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 300, flex: 1, maxWidth: 500 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedRows.length > 0 && (
              <Button
                startIcon={<DeleteIcon />}
                variant="contained"
                onClick={handleBulkDelete}
                sx={{
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)'
                  }
                }}
              >
                Delete ({selectedRows.length})
              </Button>
            )}
            <Button
              startIcon={<FilterList />}
              variant={Object.values(filters).some(f => f !== 'all' && f !== '') ? 'contained' : 'outlined'}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{
                ...(Object.values(filters).some(f => f !== 'all' && f !== '') && {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                })
              }}
            >
              Filters {Object.values(filters).some(f => f !== 'all' && f !== '') && '(Active)'}
            </Button>
            <Button
              startIcon={<ExportIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              variant="outlined"
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        {filtersOpen && (
          <Card sx={{ mb: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter Options
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, alignItems: 'end' }}>
              <TextField
                label="GSOS Version"
                value={filters.version}
                onChange={(e) => setFilters(prev => ({ ...prev, version: e.target.value }))}
                placeholder="e.g., v2.1"
                size="small"
              />
              <TextField
                select
                label="Pull Status"
                value={filters.pullStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, pullStatus: e.target.value }))}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="all">All Clients</option>
                <option value="recent">Recent Pulls (7 days)</option>
                <option value="outdated">Outdated (30+ days)</option>
                <option value="never">Never Pulled</option>
              </TextField>
              <TextField
                select
                label="Health Status"
                value={filters.healthStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, healthStatus: e.target.value }))}
                size="small"
                SelectProps={{ native: true }}
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy (70%+)</option>
                <option value="warning">Warning (30-70%)</option>
                <option value="critical">Critical (Below 30%)</option>
              </TextField>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setFilters({ version: '', pullStatus: 'all', healthStatus: 'all' });
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setFiltersOpen(false);
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filters.version && (
                <Chip
                  label={`Version: ${filters.version}`}
                  onDelete={() => setFilters(prev => ({ ...prev, version: '' }))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {filters.pullStatus !== 'all' && (
                <Chip
                  label={`Pull Status: ${filters.pullStatus}`}
                  onDelete={() => setFilters(prev => ({ ...prev, pullStatus: 'all' }))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {filters.healthStatus !== 'all' && (
                <Chip
                  label={`Health: ${filters.healthStatus}`}
                  onDelete={() => setFilters(prev => ({ ...prev, healthStatus: 'all' }))}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Card>
        )}

        {/* Results Summary */}
        {(searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredClients.length} of {clients.length} clients
              {searchTerm && ` matching "${searchTerm}"`}
            </Typography>
          </Box>
        )}

        {/* Data Grid */}
        <Card sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
            <DataGrid
              rows={filteredClients}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }
              }}
              checkboxSelection
              rowSelectionModel={selectedRows}
              onRowSelectionModelChange={(newSelection) => handleSelectionChange(newSelection as number[])}
              sx={{ 
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(0,0,0,0.05)'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                },
                '& .MuiDataGrid-row.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                },
                '& .MuiDataGrid-overlay': {
                  display: 'none'
                },
                '& .MuiDataGrid-noRowsOverlay': {
                  display: 'none'
                }
              }}
            />
        </Card>

        {/* Empty State */}
        {!loading && clients.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            color: 'white',
            mt: 3
          }}>
                <Typography variant="h5" gutterBottom>
                  Welcome to GSOS Manager! 🚀
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                  Start by adding your first client to track GSOS versions
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => setModalOpen(true)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  Add First Client
                </Button>
          </Box>
        )}

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
          onClick={() => {
            setSelectedClient(null);
            setModalOpen(true);
          }}
        >
          <AddIcon />
        </Fab>

        {/* Export Menu */}
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
        >
          <MenuItem onClick={() => handleExport('excel')}>
            📊 Export to Excel
          </MenuItem>
          <MenuItem onClick={() => handleExport('csv')}>
            📄 Export to CSV
          </MenuItem>
          <MenuItem onClick={() => handleExport('pdf')}>
            📋 Export to PDF
          </MenuItem>
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
            delete (window as any).bulkDeleteClients;
          }}
          onConfirm={clientToDelete ? handleDeleteConfirm : handleBulkDeleteConfirm}
          client={clientToDelete}
          clients={(window as any).bulkDeleteClients || []}
          loading={deleteLoading}
          isBulk={!clientToDelete && !!(window as any).bulkDeleteClients}
        />
      </Box>
    </motion.div>
  );
};

export default ModernDashboard;