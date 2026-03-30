import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Typography, Card, CardContent, CardActions,
  Grid, CircularProgress, Alert, Box, Chip, TextField,
  IconButton, Button, InputAdornment, Tooltip,
} from "@mui/material";
import { Delete, Edit, Search, MenuBook, Refresh } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { apiGetRecipes, apiDeleteRecipe } from "./api";
import RecipeDetail from "./RecipeDetail";

export default function RecipesPage({ onEdit }) {
  const { enqueueSnackbar } = useSnackbar();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetRecipes();
      setRecipes(data);
    } catch (err) {
      setError("Failed to load recipes. Check REACT_APP_GET_RECIPES_LAMBDA_URL.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return;
    try {
      await apiDeleteRecipe(recipe.userId, recipe.recipeId);
      setRecipes((prev) => prev.filter((r) => r.recipeId !== recipe.recipeId));
      enqueueSnackbar("Recipe deleted.", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to delete recipe.", { variant: "error" });
    }
  };

  const allTags = [...new Set(recipes.flatMap((r) => r.tags || []))];

  const filtered = recipes.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.ingredients?.some((i) => i.name.toLowerCase().includes(q)) ||
      r.tags?.some((t) => t.toLowerCase().includes(q));
    const matchesTag = !activeTag || r.tags?.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <MenuBook sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: "primary.main" }}>All Recipes</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchRecipes} color="primary"><Refresh /></IconButton>
        </Tooltip>
      </Box>

      <TextField
        fullWidth size="small" placeholder="Search by title, ingredient, or tag..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        sx={{ mb: 2 }}
      />

      {allTags.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {allTags.map((tag) => (
            <Chip key={tag} label={tag} size="small" color="primary"
              variant={activeTag === tag ? "filled" : "outlined"}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              sx={{ cursor: "pointer" }} />
          ))}
        </Box>
      )}

      {loading && <Box display="flex" justifyContent="center" mt={6}><CircularProgress color="primary" /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && filtered.length === 0 && (
        <Typography color="text.secondary">No recipes found.</Typography>
      )}

      <Grid container spacing={2}>
        {filtered.map((recipe) => (
          <Grid item xs={12} sm={6} key={`${recipe.userId}-${recipe.recipeId}`}>
            <Card variant="outlined" sx={{ borderColor: "primary.main", height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ color: "primary.main" }} gutterBottom>
                  {recipe.title}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  {recipe.servings && <Chip label={`Serves ${recipe.servings}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
                  {recipe.prepTime && <Chip label={`Prep: ${recipe.prepTime}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
                  {recipe.cookTime && <Chip label={`Cook: ${recipe.cookTime}`} size="small" sx={{ backgroundColor: "#e8f5e9" }} />}
                </Box>
                {recipe.tags?.length > 0 && (
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {recipe.tags.map((t) => <Chip key={t} label={t} size="small" color="primary" variant="outlined" />)}
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {recipe.ingredients?.length ?? 0} ingredients · {recipe.directions?.length ?? 0} steps
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 1 }}>
                <Button size="small" color="primary" onClick={() => setSelected(recipe)}>View</Button>
                <Box>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => onEdit(recipe)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(recipe)}><Delete fontSize="small" /></IconButton>
                  </Tooltip>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <RecipeDetail
        recipe={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { onEdit(selected); setSelected(null); }}
      />
    </Container>
  );
}
