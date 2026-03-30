import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, Box, Divider, Grid,
} from "@mui/material";
import { AccessTime, People } from "@mui/icons-material";

export default function RecipeDetail({ recipe, onClose, onEdit }) {
  if (!recipe) return null;
  return (
    <Dialog open={!!recipe} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "primary.main" }}>{recipe.title}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
          {recipe.servings && <Chip icon={<People />} label={`Serves ${recipe.servings}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
          {recipe.prepTime && <Chip icon={<AccessTime />} label={`Prep: ${recipe.prepTime}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
          {recipe.cookTime && <Chip icon={<AccessTime />} label={`Cook: ${recipe.cookTime}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
          {recipe.date && <Chip label={recipe.date} size="small" variant="outlined" />}
        </Box>

        {recipe.tags?.length > 0 && (
          <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
            {recipe.tags.map((t) => <Chip key={t} label={t} size="small" color="primary" variant="outlined" />)}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="h6" gutterBottom>Ingredients</Typography>
        {recipe.ingredients?.map((ing, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
            • {ing.name} — {ing.amount}
          </Typography>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>Directions</Typography>
        {recipe.directions?.map((dir, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 1 }}>
            {i + 1}. {dir}
          </Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onEdit} color="primary" variant="outlined">Edit</Button>
        <Button onClick={onClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
