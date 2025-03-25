import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme
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
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
  const theme = useTheme();
  
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Sentiment Score',
        data: data,
        fill: true,
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        borderColor: '#6f42c1',
        tension: 0.4,
        pointBackgroundColor: '#6f42c1',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#6f42c1',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: {
          weight: '500',
        },
        padding: 12,
        borderColor: 'rgba(111, 66, 193, 0.2)',
        borderWidth: 1,
        boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            return `Sentiment: ${context.parsed.y}%`;
          },
          title: function(context: any) {
            return context[0].label;
          }
        },
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          }
        },
        title: {
          display: true,
          text: 'Positive Sentiment',
          color: theme.palette.text.primary,
          font: {
            weight: '500',
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          }
        }
      }
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
    elements: {
      line: {
        borderWidth: 2
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  return (
    <Card sx={{ 
      borderRadius: 4, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      height: '100%',
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
      }
    }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight="600" color="text.primary">
              Sentiment Trend
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer feedback sentiment over time
            </Typography>
          </Box>
          <FormControl size="small" sx={{ width: 120 }}>
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              sx={{ 
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(111, 66, 193, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(111, 66, 193, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6f42c1',
                }
              }}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <Line data={chartData} options={chartOptions as any} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SentimentTrendChart;