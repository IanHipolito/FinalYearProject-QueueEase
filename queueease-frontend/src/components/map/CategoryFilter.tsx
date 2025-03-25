import React from 'react';
import { 
  Box, 
  Chip, 
  useTheme,
  Paper
} from '@mui/material';
import { CATEGORIES } from '../../utils/mapUtils';
import { getCategoryIcon } from './mapUtils';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 0.75,
          '&::-webkit-scrollbar': {
            height: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 4,
          }
        }}
      >
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            icon={category.id !== "All" ? getCategoryIcon(category.id) : undefined}
            label={category.label}
            clickable
            color={selectedCategory === category.id ? "primary" : "default"}
            onClick={() => onCategoryChange(category.id)}
            size="small"
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: selectedCategory === category.id ? 'primary.main' : 'rgba(0,0,0,0.08)',
              '&.MuiChip-colorPrimary': {
                bgcolor: theme.palette.primary.main,
                color: 'white',
              },
              '&.MuiChip-root': {
                height: 28,
              },
              '&.MuiChip-label': {
                px: 1,
              }
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default CategoryFilter;