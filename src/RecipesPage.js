import React, { useEffect, useState, useCallback } from "react";
import {
  Container, Typography, Card, CardContent, CardActions, CardMedia,
  Grid, CircularProgress, Alert, Box, Chip, TextField,
  IconButton, Button, InputAdornment, Tooltip, Select, MenuItem,
  FormControl, InputLabel, Pagination,
} from "@mui/material";
import { Delete, Edit, Search, MenuBook, Refresh } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { apiGetRecipes, apiDeleteRecipe } from "./api";
import { useAuth } from "./AuthContext";
import RecipeDetail from "./RecipeDetail";

const PAGE_SIZE = 6;

const sortRecipes = (recipes, sortBy) => {
  const copy = [...recipes];
  if (sortBy === "newest") return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sortBy === "oldest") return copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sortBy === "alpha") return copy.sort((a, b) => a.title?.localeCompare(b.title));
  if (sortBy === "cookTime") {
    const mins = (t) => parseInt(t) || 999;
    return copy.sort((a, b) => mins(a.cookTime) - mins(b.cookTime));
  }
  return copy;
};

export default function RecipesPage({ onEdit }) {
  const { enqueueSnackbar } = useSnackbar();
  const { getToken } = useAuth() || {};
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken ? await getToken() : null;
      const data = await apiGetRecipes(token);
      setRecipes(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load recipes. Check REACT_APP_GET_RECIPES_LAMBDA_URL.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleDelete = async (recipe) => {
    if (!window.confirm(`Delete "${recipe.title}"?`)) return;
    try {
      const token = getToken ? await getToken() : null;
      await apiDeleteRecipe(recipe.userId, recipe.recipeId, token);
      setRecipes((prev) => prev.filter((r) => r.recipeId !== recipe.recipeId));
      enqueueSnackbar("Recipe deleted.", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to delete recipe.", { variant: "error" });
    }
  };

  const allTags = [...new Set((recipes || []).flatMap((r) => r.tags || []))];

  const filtered = sortRecipes(
    recipes.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.ingredients?.some((i) => i.name.toLowerCase().includes(q)) ||
        r.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !activeTag || r.tags?.includes(activeTag);
      return matchesSearch && matchesTag;
    }),
    sortBy
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleTagClick = (tag) => { setActiveTag(activeTag === tag ? null : tag); setPage(1); };

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

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small" placeholder="Search by title, ingredient, or tag..."
          value={search} onChange={handleSearchChange} sx={{ flexGrow: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sortBy} label="Sort by" onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            <MenuItem value="newest">Newest first</MenuItem>
            <MenuItem value="oldest">Oldest first</MenuItem>
            <MenuItem value="alpha">Alphabetical</MenuItem>
            <MenuItem value="cookTime">Cook time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {allTags.length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
          {allTags.map((tag) => (
            <Chip key={tag} label={tag} size="small" color="primary"
              variant={activeTag === tag ? "filled" : "outlined"}
              onClick={() => handleTagClick(tag)} sx={{ cursor: "pointer" }} />
          ))}
        </Box>
      )}

      {loading && <Box display="flex" justifyContent="center" mt={6}><CircularProgress color="primary" /></Box>}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && filtered.length === 0 && (
        <Typography color="text.secondary">No recipes found.</Typography>
      )}

      <Grid container spacing={2}>
        {paginated.map((recipe) => (
          <Grid item xs={12} sm={6} key={`${recipe.userId}-${recipe.recipeId}`}>
            <Card variant="outlined" sx={{ borderColor: "primary.main", height: "100%", display: "flex", flexDirection: "column" }}>
              {recipe.imageKey && (
                <CardMedia component="img" height="160" image={recipe.imageKey} alt={recipe.title}
                  sx={{ objectFit: "cover" }} />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ color: "primary.main" }} gutterBottom>{recipe.title}</Typography>
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

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      <RecipeDetail
        recipe={selected}
        onClose={() => setSelected(null)}
        onEdit={() => { onEdit(selected); setSelected(null); }}
      />
    </Container>
  );
}
