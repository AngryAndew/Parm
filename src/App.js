import React, { useState } from "react";
import { Container, Typography, Tabs, Tab, Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import theme from "./theme";
import RecipeForm from "./RecipeForm";
import RecipesPage from "./RecipesPage";

export default function App() {
  const [tab, setTab] = useState(0);
  const [editRecipe, setEditRecipe] = useState(null);

  const handleEdit = (recipe) => {
    setEditRecipe(recipe);
    setTab(0);
  };

  const handleSaved = () => {
    setEditRecipe(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" align="center" sx={{ color: "primary.main", mt: 3, mb: 1 }}>
            Recipe Creator
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); if (v === 0 && tab !== 0) setEditRecipe(null); }}
            textColor="primary"
            indicatorColor="primary"
            centered
            sx={{ mb: 2 }}
          >
            <Tab label={editRecipe ? "Edit Recipe" : "Create Recipe"} />
            <Tab label="All Recipes" />
          </Tabs>

          <Box hidden={tab !== 0}>
            <RecipeForm editRecipe={editRecipe} onSaved={handleSaved} />
          </Box>
          <Box hidden={tab !== 1}>
            <RecipesPage onEdit={handleEdit} />
          </Box>
        </Container>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
