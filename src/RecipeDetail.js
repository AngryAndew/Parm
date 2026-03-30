import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Chip, Box, Divider,
} from "@mui/material";
import { AccessTime, People, Print } from "@mui/icons-material";

export default function RecipeDetail({ recipe, onClose, onEdit }) {
  if (!recipe) return null;

  const handlePrint = () => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>${recipe.title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #222; }
            h1 { color: #50C878; }
            h2 { color: #388E3C; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
            .meta { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; font-size: 14px; color: #555; }
            .tags { margin-bottom: 16px; }
            .tag { display: inline-block; border: 1px solid #50C878; color: #50C878; border-radius: 12px; padding: 2px 10px; margin-right: 6px; font-size: 13px; }
            img { max-width: 100%; border-radius: 8px; margin-bottom: 16px; }
            li { margin-bottom: 6px; }
            footer { margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${recipe.title}</h1>
          ${recipe.imageKey ? `<img src="${recipe.imageKey}" alt="${recipe.title}" />` : ""}
          <div class="meta">
            ${recipe.date ? `<span>📅 ${recipe.date}</span>` : ""}
            ${recipe.servings ? `<span>👥 Serves ${recipe.servings}</span>` : ""}
            ${recipe.prepTime ? `<span>⏱ Prep: ${recipe.prepTime}</span>` : ""}
            ${recipe.cookTime ? `<span>🍳 Cook: ${recipe.cookTime}</span>` : ""}
          </div>
          ${recipe.tags?.length ? `<div class="tags">${recipe.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
          <h2>Ingredients</h2>
          <ul>${(recipe.ingredients || []).map((i) => `<li>${i.name} — ${i.amount}</li>`).join("")}</ul>
          <h2>Directions</h2>
          <ol>${(recipe.directions || []).map((d) => `<li>${d}</li>`).join("")}</ol>
          <footer>Created with Recipe Creator</footer>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <Dialog open={!!recipe} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ color: "primary.main" }}>{recipe.title}</DialogTitle>
      <DialogContent dividers>
        {recipe.imageKey && (
          <Box mb={2}>
            <img src={recipe.imageKey} alt={recipe.title}
              style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 8 }} />
          </Box>
        )}
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
          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {ing.name} — {ing.amount}</Typography>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>Directions</Typography>
        {recipe.directions?.map((dir, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 1 }}>{i + 1}. {dir}</Typography>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handlePrint} color="primary" startIcon={<Print />}>Print</Button>
        <Button onClick={onEdit} color="primary" variant="outlined">Edit</Button>
        <Button onClick={onClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
