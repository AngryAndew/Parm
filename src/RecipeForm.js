import React, { useState, useEffect } from "react";
import {
  Box, TextField, Button, Typography, Grid, IconButton,
  Chip, CircularProgress,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import { apiPutRecipe, apiUpdateRecipe } from "./api";
import { generatePDF } from "./pdfGenerator";

const emptyForm = {
  title: "", date: "", servings: "", prepTime: "", cookTime: "",
  ingredients: [{ name: "", amount: "" }],
  directions: [""],
  tags: [],
  description: "",
};

export default function RecipeForm({ editRecipe, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editRecipe) {
      setForm({
        title: editRecipe.title || "",
        date: editRecipe.date || "",
        servings: editRecipe.servings || "",
        prepTime: editRecipe.prepTime || "",
        cookTime: editRecipe.cookTime || "",
        ingredients: editRecipe.ingredients?.length ? editRecipe.ingredients : [{ name: "", amount: "" }],
        directions: editRecipe.directions?.length ? editRecipe.directions : [""],
        tags: editRecipe.tags || [],
        description: editRecipe.description || "",
      });
    } else {
      setForm(emptyForm);
      setImage(null);
      setImagePreview(null);
    }
  }, [editRecipe]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleIngredientChange = (index, e) => {
    const updated = [...form.ingredients];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setForm((f) => ({ ...f, ingredients: updated }));
  };

  const handleDirectionChange = (index, e) => {
    const updated = [...form.directions];
    updated[index] = e.target.value;
    setForm((f) => ({ ...f, directions: updated }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result); setImagePreview(reader.result); };
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.ingredients.some((i) => !i.name || !i.amount)) {
      enqueueSnackbar("All ingredients need a name and amount.", { variant: "warning" });
      return;
    }
    if (form.directions.some((d) => !d.trim())) {
      enqueueSnackbar("All direction steps must be filled in.", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const recipe = {
        recipeId: editRecipe?.recipeId ?? `${form.title}-${form.date}`.toLowerCase().replace(/\s+/g, "-"),
        userId: editRecipe?.userId ?? "default",
        ...form,
        createdAt: editRecipe?.createdAt ?? new Date().toISOString(),
      };
      if (editRecipe) {
        await apiUpdateRecipe(recipe);
        enqueueSnackbar("Recipe updated!", { variant: "success" });
      } else {
        await apiPutRecipe(recipe);
        enqueueSnackbar("Recipe saved!", { variant: "success" });
      }
      const doc = generatePDF({ ...form, image });
      doc.save(`${form.title || "recipe"}.pdf`);
      onSaved?.();
      if (!editRecipe) { setForm(emptyForm); setImage(null); setImagePreview(null); }
    } catch (err) {
      enqueueSnackbar("Failed to save recipe. Check your Lambda URL.", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = () => {
    const doc = generatePDF({ ...form, image });
    const uri = doc.output("datauristring");
    const w = window.open();
    w.document.write(`<iframe width="100%" height="100%" src="${uri}"></iframe>`);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <TextField fullWidth required label="Recipe Title" value={form.title} onChange={set("title")} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth required label="Date" type="date" value={form.date} onChange={set("date")} InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Servings" value={form.servings} onChange={set("servings")} placeholder="e.g. 4" />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth label="Prep Time" value={form.prepTime} onChange={set("prepTime")} placeholder="e.g. 15 min" />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField fullWidth label="Cook Time" value={form.cookTime} onChange={set("cookTime")} placeholder="e.g. 30 min" />
        </Grid>
      </Grid>

      {/* Image */}
      <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }} color="primary">
        Upload Image
        <input type="file" accept="image/*" hidden onChange={handleImageChange} />
      </Button>
      {imagePreview && (
        <Box mt={1} textAlign="center">
          <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 8 }} />
        </Box>
      )}

      {/* Tags */}
      <Typography variant="h6" sx={{ mt: 3 }}>Tags</Typography>
      <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
        {form.tags.map((tag) => (
          <Chip key={tag} label={tag} onDelete={() => removeTag(tag)} color="primary" variant="outlined" size="small" />
        ))}
      </Box>
      <Box display="flex" gap={1} mt={1}>
        <TextField size="small" label="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
        <Button variant="outlined" onClick={addTag} size="small">Add</Button>
      </Box>

      {/* Ingredients */}
      <Typography variant="h6" sx={{ mt: 3 }}>Ingredients</Typography>
      {form.ingredients.map((ing, i) => (
        <Grid container spacing={1} alignItems="center" key={i} sx={{ mt: 0.5 }}>
          <Grid item xs={5}>
            <TextField fullWidth required label="Ingredient" name="name" value={ing.name} onChange={(e) => handleIngredientChange(i, e)} />
          </Grid>
          <Grid item xs={5}>
            <TextField fullWidth required label="Amount" name="amount" value={ing.amount} onChange={(e) => handleIngredientChange(i, e)} />
          </Grid>
          <Grid item xs={2}>
            <IconButton color="error" onClick={() => setForm((f) => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))}
              disabled={form.ingredients.length === 1}>
              <RemoveCircle />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Box mt={1} textAlign="center">
        <Button variant="outlined" color="primary" startIcon={<AddCircle />}
          onClick={() => setForm((f) => ({ ...f, ingredients: [...f.ingredients, { name: "", amount: "" }] }))}>
          Add Ingredient
        </Button>
      </Box>

      {/* Directions */}
      <Typography variant="h6" sx={{ mt: 3 }}>Directions</Typography>
      {form.directions.map((dir, i) => (
        <Grid container spacing={1} alignItems="center" key={i} sx={{ mt: 0.5 }}>
          <Grid item xs={10}>
            <TextField fullWidth required multiline label={`Step ${i + 1}`} value={dir} onChange={(e) => handleDirectionChange(i, e)} />
          </Grid>
          <Grid item xs={2}>
            <IconButton color="error" onClick={() => setForm((f) => ({ ...f, directions: f.directions.filter((_, idx) => idx !== i) }))}
              disabled={form.directions.length === 1}>
              <RemoveCircle />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Box mt={1} textAlign="center">
        <Button variant="outlined" color="primary" startIcon={<AddCircle />}
          onClick={() => setForm((f) => ({ ...f, directions: [...f.directions, ""] }))}>
          Add Step
        </Button>
      </Box>

      <Box mt={4} textAlign="center" display="flex" justifyContent="center" gap={2}>
        <Button type="submit" variant="contained" color="primary" disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}>
          {submitting ? "Saving..." : editRecipe ? "Update & Download PDF" : "Save & Download PDF"}
        </Button>
        <Button variant="outlined" color="secondary" onClick={handlePreview}>Preview PDF</Button>
      </Box>
    </Box>
  );
}
