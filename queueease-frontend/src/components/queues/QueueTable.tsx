import React from 'react';
import { 
  TableContainer, Paper, Table, TableHead, TableRow, 
  TableCell, TableBody, Chip, IconButton,Tooltip
} from '@mui/material';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { TableSkeleton } from '../skeletons/LoadingSkeletons';
import { QueueTableProps } from 'types/queueTypes';

const QueueTable: React.FC<QueueTableProps> = ({ queues, loading, onToggleQueueStatus }) => {
  return (
    <>
      {loading ? (
        <TableSkeleton rows={3} />
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Queue ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Queue Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customers</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.length > 0 ? (
                queues.map((queue) => {
                  const isActive = queue.status === 'Active' || queue.is_active === true;
                  return (
                    <TableRow key={queue.id} hover>
                      <TableCell>#{queue.sequence_number || queue.id}</TableCell>
                      <TableCell>{queue.name}</TableCell>
                      <TableCell>{queue.department}</TableCell>
                      <TableCell>
                        <Chip 
                          label={isActive ? 'Active' : 'Inactive'}
                          color={isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{queue.customers}</TableCell>
                      <TableCell>
                        <Tooltip title={isActive ? "Deactivate Queue" : "Activate Queue"}>
                          <IconButton 
                            size="small" 
                            color={isActive ? "primary" : "default"}
                            onClick={() => onToggleQueueStatus(queue.id, !isActive)}
                          >
                            {isActive ? <ToggleOnIcon /> : <ToggleOffIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No queues found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default QueueTable;