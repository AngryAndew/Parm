import React, { useState } from "react";
import { Container, Typography, Tabs, Tab, Box, Button, Chip } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Logout } from "@mui/icons-material";
import theme from "./theme";
import RecipeForm from "./RecipeForm";
import RecipesPage from "./RecipesPage";
import AuthPage from "./AuthPage";
import { AuthProvider, useAuth } from "./AuthContext";

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState(0);
  const [editRecipe, setEditRecipe] = useState(null);

  const handleEdit = (recipe) => { setEditRecipe(recipe); setTab(0); };
  const handleSaved = () => setEditRecipe(null);

  if (loading) return null;

  return (
    <Container maxWidth="md">
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 3, mb: 1 }}>
        <Typography variant="h4" sx={{ color: "primary.main" }}>Recipe Creator</Typography>
        {user && (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={user.email || user.username} size="small" sx={{ backgroundColor: "#e8f5e9" }} />
            <Button size="small" color="secondary" startIcon={<Logout />} onClick={signOut}>Sign out</Button>
          </Box>
        )}
      </Box>

      {!user ? (
        <AuthPage />
      ) : (
        <>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 0 && tab !== 0) setEditRecipe(null); }}
            textColor="primary" indicatorColor="primary" centered sx={{ mb: 2 }}>
            <Tab label={editRecipe ? "Edit Recipe" : "Create Recipe"} />
            <Tab label="All Recipes" />
          </Tabs>
          <Box hidden={tab !== 0}><RecipeForm editRecipe={editRecipe} onSaved={handleSaved} /></Box>
          <Box hidden={tab !== 1}><RecipesPage onEdit={handleEdit} /></Box>
        </>
      )}
    </Container>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}
