import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Client } from '../types';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  client?: Client | null;
  clients?: Client[];
  loading?: boolean;
  isBulk?: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  client,
  clients = [],
  loading = false,
  isBulk = false
}) => {
  const clientCount = isBulk ? clients.length : 1;
  const clientName = isBulk 
    ? `${clientCount} clients` 
    : client?.client_name || 'this client';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <WarningIcon color="error" />
        <Typography variant="h6">
          Delete {isBulk ? 'Clients' : 'Client'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to delete {clientName}?
        </Typography>
        
        {isBulk && clients.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Clients to be deleted:
            </Typography>
            {clients.slice(0, 5).map((c) => (
              <Typography key={c.id} variant="body2">
                • {c.client_name}
              </Typography>
            ))}
            {clients.length > 5 && (
              <Typography variant="body2" color="text.secondary">
                ... and {clients.length - 5} more
              </Typography>
            )}
          </Box>
        )}
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This will permanently remove all client data and pull history. This action cannot be undone.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={loading}
        >
          {loading ? 'Deleting...' : `Delete ${isBulk ? 'All' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;