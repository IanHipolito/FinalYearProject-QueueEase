import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { CATEGORIES } from '../../utils/mapUtils';
import { getCategoryIcon } from '../map/mapUtils';

interface CategoryFilterProps {
  selectedCategory: string;
  onChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onChange
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
        Filter by category
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        {CATEGORIES.map((category) => (
          <Chip
            key={category.id}
            icon={category.id !== "All" ? getCategoryIcon(category.id) : undefined}
            label={category.label}
            clickable
            color={selectedCategory === category.id ? "primary" : "default"}
            onClick={() => onChange(category.id)}
            sx={{
              borderRadius: 2,
              '&.MuiChip-colorPrimary': {
                fontWeight: 500
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default CategoryFilter;