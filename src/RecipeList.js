import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import api from "./api";

// Function URL printed as "GetRecipesUrl" after `cdk deploy ApiStack`
const getRecipesUrl = process.env.REACT_APP_GET_RECIPES_URL || "";

function RecipeDetail({ recipe, onClose }) {
  if (!recipe) return null;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ color: "primary.main" }}>{recipe.title}</DialogTitle>
      <DialogContent dividers>
        {recipe.imageUrl && (
          <Box textAlign="center" mb={2}>
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 10 }}
            />
          </Box>
        )}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {recipe.date}
          {recipe.sourceUrl && (
            <>
              {" · "}
              <Link href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                Original recipe
              </Link>
            </>
          )}
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>Ingredients</Typography>
        <ul>
          {recipe.ingredients?.map((ingredient, index) => (
            <li key={index}>
              {ingredient.amount ? <strong>{ingredient.amount}</strong> : null} {ingredient.name}
            </li>
          ))}
        </ul>
        <Typography variant="h6">Directions</Typography>
        <ol>
          {recipe.directions?.map((step, index) => (
            <li key={index} style={{ marginBottom: 8 }}>{step}</li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!getRecipesUrl) {
      setError("REACT_APP_GET_RECIPES_URL isn't set in .env yet.");
      setLoading(false);
      return;
    }
    api
      .get(getRecipesUrl)
      .then(({ data }) => setRecipes(data.recipes ?? []))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load recipes."))
      .finally(() => setLoading(false));
  }, []);

  const term = search.trim().toLowerCase();
  const visible = term
    ? recipes.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.ingredients?.some((i) => i.name?.toLowerCase().includes(term))
      )
    : recipes;

  if (loading) {
    return (
      <Box textAlign="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>;

  return (
    <Box mt={2}>
      <TextField
        fullWidth
        size="small"
        label="Search by name or ingredient"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />
      {visible.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          {recipes.length ? "No recipes match that search." : "No recipes yet. Add your first one!"}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {visible.map((recipe) => (
            <Grid item xs={12} sm={6} key={recipe.recipeId}>
              <Card>
                <CardActionArea onClick={() => setSelected(recipe)}>
                  {recipe.imageUrl && (
                    <CardMedia component="img" height="140" image={recipe.imageUrl} alt={recipe.title} />
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">{recipe.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recipe.date} · {recipe.ingredients?.length ?? 0} ingredients
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <RecipeDetail recipe={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}

export default RecipeList;
