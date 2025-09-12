#!/usr/bin/env python3
"""
Script to convert HTML files to PDF using weasyprint
"""

import os
import sys
from pathlib import Path

try:
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration
except ImportError:
    print("Installing weasyprint...")
    os.system("pip install weasyprint")
    from weasyprint import HTML, CSS
    from weasyprint.text.fonts import FontConfiguration

def convert_html_to_pdf(html_file, pdf_file):
    """Convert HTML file to PDF"""
    try:
        # Read the HTML file
        html_content = HTML(filename=html_file)
        
        # Configure fonts
        font_config = FontConfiguration()
        
        # Create PDF
        html_content.write_pdf(pdf_file, font_config=font_config)
        print(f"✅ Successfully converted {html_file} to {pdf_file}")
        return True
    except Exception as e:
        print(f"❌ Error converting {html_file}: {e}")
        return False

def main():
    """Main function"""
    # Get the documents directory
    docs_dir = Path("documents")
    
    # List of HTML files to convert
    html_files = [
        "EVEP_WORKFLOW_DIAGRAMS.html",
        "EVEP_SCREENING_COMPONENT_COMPARISON.html"
    ]
    
    print("🔄 Converting HTML files to PDF...")
    
    success_count = 0
    for html_file in html_files:
        html_path = docs_dir / html_file
        pdf_file = html_file.replace('.html', '.pdf')
        pdf_path = docs_dir / pdf_file
        
        if html_path.exists():
            if convert_html_to_pdf(str(html_path), str(pdf_path)):
                success_count += 1
        else:
            print(f"⚠️  HTML file not found: {html_path}")
    
    print(f"\n📊 Conversion complete: {success_count}/{len(html_files)} files converted successfully")
    
    if success_count > 0:
        print("\n📁 PDF files created in the 'documents' directory:")
        for html_file in html_files:
            pdf_file = html_file.replace('.html', '.pdf')
            pdf_path = docs_dir / pdf_file
            if pdf_path.exists():
                print(f"  - {pdf_file}")

if __name__ == "__main__":
    main()
