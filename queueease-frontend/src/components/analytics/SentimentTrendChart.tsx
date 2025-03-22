import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SentimentTrendChartProps {
  data: number[];
  timeLabels: string[];
  timeRange: string;
  onTimeRangeChange: (event: SelectChangeEvent) => void;
}

const SentimentTrendChart: React.FC<SentimentTrendChartProps> = ({
  data,
  timeLabels,
  timeRange,
  onTimeRangeChange
}) => {
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Sentiment Score',
        data: data,
        fill: false,
        backgroundColor: '#6f42c1',
        borderColor: '#6f42c1',
        tension: 0.3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Sentiment: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Positive Sentiment %'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Period'
        }
      }
    }
  };

  return (
    <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="500">
            Sentiment Trend
          </Typography>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ height: 300 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SentimentTrendChart;