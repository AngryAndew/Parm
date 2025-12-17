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
  Slider,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";
import jsPDF from "jspdf";
import axios from 'axios';

const cookingTimeIcon = '/cooking_time.png';
const ratingIcon = '/rating.png';
const servingSizeIcon = '/serving_size.png';
const theme = createTheme({
  palette: {
    primary: { main: "#228B22" },
    secondary: { main: "#388E3C" },
    error: { main: "#D32F2F" },
  },
});

function App() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [rating, setRating] = useState(5.0); // Default rating is 5.0
  const [servingSize, setServingSize] = useState(""); // New serving size state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredients, setIngredients] = useState([{ name: "", amount: "" }]);
  const [directions, setDirections] = useState([""]);
  const lambdaUrl = '';
  const postRecipe = async (recipe) => {
    try {
      const response = await axios.post(lambdaUrl, recipe, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error posting recipe:', error.response?.data || error.message);
      throw error;
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = (customMargins = {}) => {
    const defaultMargins = {
      top: 10,
      bottom: 10,
      left: 25,
      right: 10,
    };

    const margins = { ...defaultMargins, ...customMargins };
    const doc = new jsPDF({ format: "a5" });
    const pageHeight = 210; // A5 page height in mm
    const pageWidth = 148.5; // A5 page width in mm
    const contentWidth = pageWidth - margins.left - margins.right;
    const lineSpacing = 8;

    let cursorY = margins.top;

    const checkPageHeight = (increment) => {
      if (cursorY + increment > pageHeight - margins.bottom) {
        doc.addPage();
        cursorY = margins.top;
      }
    };

    // Cover page
    doc.setFillColor(220, 220, 220); // White background
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setLineWidth(1);

    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(title || "Untitled Recipe", margins.left, 20);

    // Add image below the title
    let imageHeight = 0;
    const imageWidth = 60;
    if (image) {
      imageHeight = 60;
      doc.addImage(image, "JPEG", margins.left, 25, imageWidth, imageHeight);
    }

    cursorY = 25 + imageHeight + 10; // Move cursor below the image

    // Set position for the icons and text to align on the same Y-axis
    const detailsX = margins.left + imageWidth + 10; // Position after the image
    const iconSize = 10; // Icon size
    const verticalSpacing = 3; // Vertical spacing between icon and text

    // Top of the image Y position
    const topOfImageY = 25;
    const textX = detailsX + iconSize + 5; // Text slightly to the right of the icons

    // Cooking Time Icon and Text
    const cookingTimeText = `Cook Time: ${cookTime || ""}`;
    const cookingTimeIconX = detailsX; // Position of the icon

    doc.addImage(cookingTimeIcon, "PNG", cookingTimeIconX, topOfImageY, iconSize, iconSize); // Cooking Time icon
    doc.setFontSize(8); // Smaller text size for details

    // Adjust the Y-position for the text to center it with the icon
    const cookingTimeTextY = topOfImageY + iconSize / 2;
    doc.text(cookingTimeText, textX, cookingTimeTextY); // Text centered with the icon
    cursorY = topOfImageY + iconSize + verticalSpacing + lineSpacing; // Update cursorY

    // Rating Icon and Text
    const ratingText = `Rating: ${rating || ""}`;
    const ratingIconX = detailsX; // Position of the icon

    doc.addImage(ratingIcon, "PNG", ratingIconX, cursorY, iconSize, iconSize); // Rating icon

    // Adjust the Y-position for the text to center it with the icon
    const ratingTextY = cursorY + iconSize / 2;
    doc.text(ratingText, textX, ratingTextY); // Text centered with the icon
    cursorY += lineSpacing + iconSize + verticalSpacing; // Update cursorY

    // Serving Size Icon and Text
    const servingSizeText = `Serving Size: ${servingSize || "N/A"}`;
    const servingSizeIconX = detailsX; // Position of the icon

    doc.addImage(servingSizeIcon, "PNG", servingSizeIconX, cursorY, iconSize, iconSize); // Serving Size icon

    // Adjust the Y-position for the text to center it with the icon
    const servingSizeTextY = cursorY + iconSize / 2;
    doc.text(servingSizeText, textX, servingSizeTextY); // Text centered with the icon
    cursorY += lineSpacing + iconSize + verticalSpacing; // Update cursorY

    // Move the ingredients section down a bit
    cursorY += 10; // Add extra space before the ingredients section

    // Ingredients Section
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("Ingredients", margins.left, cursorY);
    cursorY += lineSpacing;
    let cursorY2 = cursorY + lineSpacing;
    const totalIngredients = ingredients.length;
    const midIndex = Math.ceil(totalIngredients / 2); // Find the mid-point to divide into two columns
    const columnWidth = (contentWidth - 10) / 2; // Half of the content width for the two columns

    // Column 1: First half of the ingredients
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    ingredients.slice(0, midIndex).forEach((ingredient, index) => {
      checkPageHeight(lineSpacing);
      const text = `${ingredient.name} - ${ingredient.amount}`;

      // Add the text in the first column
      doc.text(text, margins.left, cursorY);
      cursorY += lineSpacing;
    });

    // Reset cursorY to the starting point of the second column
    let secondColumnStartY = cursorY2 - lineSpacing; // Align second column vertically with the first column

    // Column 2: Second half of the ingredients
    ingredients.slice(midIndex).forEach((ingredient) => {
      checkPageHeight(lineSpacing);
      const text = `${ingredient.name} - ${ingredient.amount}`;

      // Add the text in the second column, aligned with the first column
      doc.text(text, margins.left + columnWidth + 10, secondColumnStartY);
      secondColumnStartY += lineSpacing;
    });

    // Add Date at the bottom of the page
    doc.setFontSize(10);
    doc.text(`Date: ${date || "N/A"}`, margins.left, pageHeight - margins.bottom);
    margins.left = 10
    margins.right = 25
    // New page for directions
    doc.addPage();
    cursorY = margins.top;

    // Directions Section
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Directions", margins.left, cursorY);
    cursorY += lineSpacing;

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const indentWidth = 4; // Width of the indent for subsequent lines

    directions.forEach((direction, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${direction}`, contentWidth);
      lines.forEach((line, lineIndex) => {
        checkPageHeight(lineSpacing);

        // Apply indent for lines after the first
        const textX = lineIndex === 0 ? margins.left : margins.left + indentWidth;

        doc.text(line, textX, cursorY);
        cursorY += lineSpacing / 2;
      });
      cursorY += lineSpacing / 2;
    });

    // Footer
    doc.setFont("times", "italic");
    doc.setFontSize(10);

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
  const capitalizeFirstWord = (text) => {
    return text.replace(/^\s*\w/, (c) => c.toUpperCase());
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Typography variant="h4" align="center" gutterBottom sx={{ color: "primary.main" }}>
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
            InputLabelProps={{ shrink: true }}
            required
            color="primary"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cook Time (e.g., 45 mins)"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                margin="normal"
                required
                color="primary"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Serving Size"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                margin="normal"
                required
                color="primary"
              />
            </Grid>
          </Grid>
          <Typography variant="subtitle1" sx={{ mt: 3 }}>
            Rating: {rating.toFixed(1)} / 10.0
          </Typography>
          <Slider
            value={rating}
            onChange={(e, value) => setRating(value)}
            step={0.1}
            min={0}
            max={10}
            valueLabelDisplay="auto"
            sx={{ color: "primary.main", mb: 3 }}
          />
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2, mb: 2 }} color="primary">
            Upload Image
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </Button>
          {imagePreview && (
            <Box mt={2} textAlign="center">
              <img src={imagePreview} alt="Recipe Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 10 }} />
            </Box>
          )}
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
                  onChange={(e) => {
                    const newIngredients = [...ingredients];
                    newIngredients[index].name = capitalizeFirstWord(e.target.value);
                    setIngredients(newIngredients);
                  }}
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
                  onChange={(e) => {
                    const newIngredients = [...ingredients];
                    newIngredients[index].amount = e.target.value;
                    setIngredients(newIngredients);
                  }}
                  required
                  color="primary"
                  multiline
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  color="error"
                  onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                  disabled={ingredients.length === 1}
                >
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box mt={2} textAlign="center">
            <Button variant="outlined" color="primary" startIcon={<AddCircle />} onClick={() => setIngredients([...ingredients, { name: "", amount: "" }])}>
              Add Ingredient
            </Button>
          </Box>
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
                  onChange={(e) => {
                    const newDirections = [...directions];
                    newDirections[index] = e.target.value;
                    setDirections(newDirections);
                  }}
                  required
                  color="primary"
                  multiline
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={2}>
                <IconButton
                  color="error"
                  onClick={() => setDirections(directions.filter((_, i) => i !== index))}
                  disabled={directions.length === 1}
                >
                  <RemoveCircle />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Box mt={2} textAlign="center">
            <Button variant="outlined" color="primary" startIcon={<AddCircle />} onClick={() => setDirections([...directions, ""])}>
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
