import jsPDF from "jspdf";

export const generatePDF = ({ title, date, image, ingredients, directions }) => {
  const doc = new jsPDF();
  const pageHeight = 297;
  const marginTop = 20;
  const lineSpacing = 10;
  const contentWidth = 180;
  let cursorY = marginTop;

  const checkPageHeight = (increment) => {
    if (cursorY + increment > pageHeight - marginTop) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  // Cover page
  doc.setFillColor(80, 200, 120);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  doc.text(title || "Untitled Recipe", 105, 50, { align: "center" });
  doc.setFontSize(16);
  doc.text(`Date: ${date || "N/A"}`, 105, 70, { align: "center" });
  if (image) doc.addImage(image, "JPEG", 55, 90, 100, 100);

  doc.addPage();
  cursorY = marginTop;

  // Ingredients
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Ingredients", 20, cursorY);
  cursorY += lineSpacing;
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  ingredients.forEach((ing, i) => {
    checkPageHeight(lineSpacing);
    doc.text(`${i + 1}. ${ing.name} - ${ing.amount}`, 20, cursorY);
    cursorY += lineSpacing;
  });

  // Directions
  cursorY += lineSpacing;
  checkPageHeight(lineSpacing);
  doc.setFont("times", "italic");
  doc.setFontSize(18);
  doc.text("Directions", 20, cursorY);
  cursorY += lineSpacing;
  doc.setFont("times", "normal");
  doc.setFontSize(14);
  directions.forEach((dir, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${dir}`, contentWidth);
    lines.forEach((line) => {
      checkPageHeight(lineSpacing);
      doc.text(line, 20, cursorY);
      cursorY += lineSpacing;
    });
  });

  checkPageHeight(lineSpacing);
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.text("Created with Recipe Creator", 105, pageHeight - 10, { align: "center" });

  return doc;
};
