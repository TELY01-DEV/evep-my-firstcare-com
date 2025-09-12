#!/bin/bash

# Script to convert HTML files to PDF using macOS built-in tools
# This script opens the HTML files in Safari and prints them to PDF

echo "🔄 Converting HTML files to PDF..."

# Function to convert HTML to PDF
convert_to_pdf() {
    local html_file="$1"
    local pdf_file="${html_file%.html}.pdf"
    
    echo "📄 Converting: $html_file"
    
    # Use macOS built-in tools to convert HTML to PDF
    # This uses the 'cupsfilter' command which is available on macOS
    if command -v cupsfilter >/dev/null 2>&1; then
        cupsfilter "$html_file" > "$pdf_file" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Successfully converted: $pdf_file"
            return 0
        else
            echo "❌ Failed to convert: $html_file"
            return 1
        fi
    else
        echo "⚠️  cupsfilter not available, trying alternative method..."
        
        # Alternative method using textutil (macOS built-in)
        if command -v textutil >/dev/null 2>&1; then
            textutil -convert pdf "$html_file" -output "$pdf_file" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ Successfully converted: $pdf_file"
                return 0
            else
                echo "❌ Failed to convert: $html_file"
                return 1
            fi
        else
            echo "❌ No suitable conversion tool found"
            return 1
        fi
    fi
}

# Get the documents directory
DOCS_DIR="documents"

# List of HTML files to convert (print-friendly versions)
HTML_FILES=(
    "EVEP_WORKFLOW_DIAGRAMS_PRINT.html"
    "EVEP_SCREENING_COMPONENT_COMPARISON_PRINT.html"
)

# Convert each HTML file
success_count=0
total_count=${#HTML_FILES[@]}

for html_file in "${HTML_FILES[@]}"; do
    html_path="$DOCS_DIR/$html_file"
    
    if [ -f "$html_path" ]; then
        if convert_to_pdf "$html_path"; then
            ((success_count++))
        fi
    else
        echo "⚠️  HTML file not found: $html_path"
    fi
done

echo ""
echo "📊 Conversion Summary:"
echo "   Total files: $total_count"
echo "   Successful: $success_count"
echo "   Failed: $((total_count - success_count))"

if [ $success_count -gt 0 ]; then
    echo ""
    echo "📁 PDF files created in the 'documents' directory:"
    for html_file in "${HTML_FILES[@]}"; do
        pdf_file="${html_file%.html}.pdf"
        pdf_path="$DOCS_DIR/$pdf_file"
        if [ -f "$pdf_path" ]; then
            echo "   ✅ $pdf_file"
        fi
    done
    
    echo ""
    echo "💡 To open PDF files:"
    echo "   open documents/EVEP_WORKFLOW_DIAGRAMS_PRINT.pdf"
    echo "   open documents/EVEP_SCREENING_COMPONENT_COMPARISON_PRINT.pdf"
else
    echo ""
    echo "❌ No PDF files were created successfully."
    echo "💡 Alternative: Open the HTML files in a web browser and use 'Print to PDF'"
    echo "   open documents/EVEP_WORKFLOW_DIAGRAMS_PRINT.html"
    echo "   open documents/EVEP_SCREENING_COMPONENT_COMPARISON_PRINT.html"
fi
