import React from 'react';
import { 
  TableContainer, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Chip, 
  IconButton 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { TableSkeleton } from '../skeletons/LoadingSkeletons';

interface Queue {
  id: number;
  name: string;
  department: string;
  status: string;
  customers: number;
  description?: string;
  max_capacity?: number;
}

interface QueueTableProps {
  queues: Queue[];
  loading: boolean;
  onToggleStatus: (queueId: number, currentStatus: string) => void;
}

const QueueTable: React.FC<QueueTableProps> = ({ queues, loading, onToggleStatus }) => {
  return (
    <>
      {loading ? (
        <TableSkeleton rows={3} />
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fb' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Queue Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customers</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.length > 0 ? (
                queues.map((queue) => (
                  <TableRow key={queue.id} hover>
                    <TableCell>{queue.name}</TableCell>
                    <TableCell>{queue.department}</TableCell>
                    <TableCell>
                      <Chip 
                        label={queue.status}
                        color={queue.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{queue.customers}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color={queue.status === 'Active' ? 'warning' : 'success'}
                        onClick={() => onToggleStatus(queue.id, queue.status)}
                      >
                        {queue.status === 'Active' ? <PauseIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
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