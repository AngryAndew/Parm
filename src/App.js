import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  Grid,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
import jsPDF from "jspdf";

// Custom emerald green theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#50C878", // Emerald green
    },
    secondary: {
      main: "#388E3C", // A complementary shade of green
    },
    error: {
      main: "#D32F2F", // Standard red for errors
    },
  },
});

function App() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const [ingredients, setIngredients] = useState([{ name: "", amount: "" }]);
  const [directions, setDirections] = useState([""]);

  const handleIngredientChange = (index, event) => {
    const newIngredients = [...ingredients];
    newIngredients[index][event.target.name] = event.target.value;
    setIngredients(newIngredients);
  };

  const handleDirectionChange = (index, event) => {
    const newDirections = [...directions];
    newDirections[index] = event.target.value;
    setDirections(newDirections);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "" }]);
  };

  const addDirection = () => {
    setDirections([...directions, ""]);
  };

  const removeIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const removeDirection = (index) => {
    const newDirections = directions.filter((_, i) => i !== index);
    setDirections(newDirections);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result); // Base64 image for PDF
        setImagePreview(reader.result); // Base64 image for preview
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageHeight = 297; // A4 page height in mm
    const marginTop = 20; // Top margin in mm
    const lineSpacing = 10; // Spacing between lines
    const contentWidth = 180; // Content width in mm (15mm margins on each side)
    let cursorY = marginTop;

    // Function to add new pages if needed
    const checkPageHeight = (increment) => {
      if (cursorY + increment > pageHeight - marginTop) {
        doc.addPage();
        cursorY = marginTop;
      }
    };

    // Cover page
    doc.setFillColor(80, 200, 120); // Emerald green background
    doc.rect(0, 0, 210, 297, "F"); // Full-page background (A4 size in mm)
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text(title || "Untitled Recipe", 105, 50, { align: "center" });
    doc.setFontSize(16);
    doc.text(`Date: ${date || "N/A"}`, 105, 70, { align: "center" });

    if (image) {
      doc.addImage(image, "JPEG", 55, 90, 100, 100); // Centered image
    }

    doc.addPage(); // Start a new page for content
    cursorY = marginTop;

    // Ingredients section
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "italic");
    doc.setFontSize(18);
    doc.text("Ingredients", 20, cursorY);
    cursorY += lineSpacing;

    doc.setFont("times", "normal");
    doc.setFontSize(14);

    ingredients.forEach((ingredient, index) => {
      checkPageHeight(lineSpacing);
      doc.text(`${index + 1}. ${ingredient.name} - ${ingredient.amount}`, 20, cursorY);
      cursorY += lineSpacing;
    });

    // Directions section
    cursorY += lineSpacing; // Add spacing before starting directions
    checkPageHeight(lineSpacing);
    doc.setFont("times", "italic");
    doc.setFontSize(18);
    doc.text("Directions", 20, cursorY);
    cursorY += lineSpacing;

    doc.setFont("times", "normal");
    doc.setFontSize(14);

    directions.forEach((direction, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${direction}`, contentWidth); // Split long text
      lines.forEach((line) => {
        checkPageHeight(lineSpacing);
        doc.text(line, 20, cursorY);
        cursorY += lineSpacing;
      });
    });

    // Footer
    checkPageHeight(lineSpacing);
    doc.setFont("times", "italic");
    doc.setFontSize(12);
    doc.text("Created with Recipe Creator", 105, pageHeight - 10, { align: "center" });

    return doc;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const doc = generatePDF();
    doc.save("recipe.pdf");
    alert("Recipe PDF has been generated and downloaded!");
  };

  const handlePreview = () => {
    const doc = generatePDF();
    const pdfDataUri = doc.output("datauristring");
    const previewWindow = window.open();
    previewWindow.document.write(
      `<iframe width="100%" height="100%" src="${pdfDataUri}"></iframe>`
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ color: "primary.main" }}
        >
          Recipe Creator
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Recipe Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
            color="primary"
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            required
            color="primary"
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            color="primary"
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
          {/* Image Preview */}
          {imagePreview && (
            <Box mt={2} textAlign="center">
              <img
                src={imagePreview}
                alt="Recipe Preview"
                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10 }}
              />
            </Box>
          )}
          {/* Ingredients Section */}
          <Typography variant="h6" sx={{ mt: 3 }}>
            Ingredients
          </Typography>
          {ingredients.map((ingredient, index) => (
            <Grid container spacing={2} alignItems="center" key={index}>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Ingredient"
                  name="name"
                  value={ingredient.name}
                  onChange={(e) => handleIngredientChange(index, e)}
                  required
                  color="primary"
                  multiline
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  value={ingredient.amount}
                  onChange={(e) => handleIngredientChange(index, e)}
                  required
                  color="primary"
                  multiline
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  color="error"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length === 1}
                >
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box mt={2} textAlign="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddCircle />}
              onClick={addIngredient}
            >
              Add Ingredient
            </Button>
          </Box>

          {/* Directions Section */}
          <Typography variant="h6" sx={{ mt: 3 }}>
            Directions
          </Typography>
          {directions.map((direction, index) => (
            <Grid container spacing={2} alignItems="center" key={index}>
              <Grid item xs={10}>
                <TextField
                  fullWidth
                  label={`Step ${index + 1}`}
                  value={direction}
                  onChange={(e) => handleDirectionChange(index, e)}
                  required
                  color="primary"
                  multiline
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  color="error"
                  onClick={() => removeDirection(index)}
                  disabled={directions.length === 1}
                >
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box mt={2} textAlign="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddCircle />}
              onClick={addDirection}
            >
              Add Step
            </Button>
          </Box>

          <Box mt={4} textAlign="center">
            <Button type="submit" variant="contained" color="primary" sx={{ mr: 2 }}>
              Submit & Download PDF
            </Button>
            <Button variant="outlined" color="secondary" onClick={handlePreview}>
              Preview PDF
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
