#!/bin/bash

# EVEP Mobile Reflection Unit - HTML to Image Converter
# This script converts HTML documentation to PNG/SVG format for printing and sharing

echo "🏥 EVEP Mobile Reflection Unit - HTML to Image Converter"
echo "========================================================"

# Check if wkhtmltopdf is installed
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "❌ wkhtmltopdf is not installed. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt-get install wkhtmltopdf"
    echo "   macOS: brew install wkhtmltopdf"
    echo "   Windows: Download from https://wkhtmltopdf.org/"
    exit 1
fi

# Create output directory
mkdir -p images

# Base URL for the documents
BASE_URL="http://103.22.182.146:8084"

# List of documents to convert
DOCUMENTS=(
    "EVEP_ER_Diagram_Complete.html"
    "EVEP_Clinical_Pathway_Flowchart.html"
    "EVEP_Data_Flow_Diagram.html"
    "EVEP_System_Diagram.html"
    "EVEP_Workflow_Diagrams_Documentation.html"
    "EVEP_ER_FLOWCHART_PRINT.html"
    "EVEP_Medical_Staff_ER_Diagram_Print.html"
)

echo "📋 Converting HTML documents to PNG/SVG format..."
echo ""

for doc in "${DOCUMENTS[@]}"; do
    echo "🔄 Converting: $doc"
    
    # Extract base name without extension
    base_name=$(basename "$doc" .html)
    
    # Convert to PNG
    echo "   📷 Creating PNG..."
    wkhtmltopdf --page-size A4 --orientation Landscape --margin-top 10 --margin-bottom 10 --margin-left 10 --margin-right 10 "$BASE_URL/$doc" "images/${base_name}.pdf"
    
    # Convert PDF to PNG (requires ImageMagick)
    if command -v convert &> /dev/null; then
        convert -density 300 "images/${base_name}.pdf" "images/${base_name}.png"
        echo "   ✅ PNG created: images/${base_name}.png"
    else
        echo "   ⚠️  ImageMagick not found. PNG conversion skipped."
        echo "   📄 PDF created: images/${base_name}.pdf"
    fi
    
    # Convert to SVG (requires rsvg-convert)
    if command -v rsvg-convert &> /dev/null; then
        rsvg-convert -f svg "images/${base_name}.pdf" > "images/${base_name}.svg"
        echo "   ✅ SVG created: images/${base_name}.svg"
    else
        echo "   ⚠️  rsvg-convert not found. SVG conversion skipped."
    fi
    
    echo ""
done

echo "🎉 Conversion completed!"
echo ""
echo "📁 Output files are in the 'images' directory:"
ls -la images/
echo ""
echo "📋 Available formats:"
echo "   • PNG: High-resolution images for printing"
echo "   • SVG: Scalable vector graphics for web use"
echo "   • PDF: Print-ready documents"
echo ""
echo "🌐 Live documents available at:"
echo "   • Content Index: $BASE_URL/index.html"
echo "   • ER Diagram: $BASE_URL/EVEP_ER_Diagram_Complete.html"
echo "   • Clinical Flowchart: $BASE_URL/EVEP_Clinical_Pathway_Flowchart.html"
echo "   • Data Flow Diagram: $BASE_URL/EVEP_Data_Flow_Diagram.html"
echo "   • System Architecture: $BASE_URL/EVEP_System_Diagram.html"
