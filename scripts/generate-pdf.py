import os
import subprocess
import markdown_it
import re

# Read markdown content
with open('TECHNICAL_DESIGN.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

# Setup markdown-it
md = markdown_it.MarkdownIt('commonmark', {'html': True, 'breaks': True})
md.enable('table')

html_body = md.render(md_content)

# Replace mermaid code blocks with <div class="mermaid">
# markdown-it outputs <pre><code class="language-mermaid">...</code></pre>
import re
def replace_mermaid(match):
    code = match.group(1).strip()
    return f'<div class="mermaid">\n{code}\n</div>'

html_body = re.sub(r'<pre><code class="language-mermaid">([\s\S]*?)</code></pre>', replace_mermaid, html_body)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Technical Design Document — Misty Peaks Estate</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({{
    startOnLoad: true,
    theme: 'neutral',
    themeVariables: {{
      primaryColor: '#F0F5F2',
      primaryBorderColor: '#1B3A2D',
      lineColor: '#1B3A2D',
      fontFamily: 'Inter, sans-serif'
    }}
  }});
</script>
<style>
  @page {{
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}

  *, *:before, *:after {{
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1a202c;
    line-height: 1.6;
    font-size: 10pt;
    background-color: #ffffff;
    max-width: 800px;
    margin: 0 auto;
    padding: 10px;
  }}

  h1, h2, h3, h4 {{
    font-family: 'Playfair Display', Georgia, serif;
    color: #1B3A2D;
    page-break-after: avoid;
  }}

  h1 {{
    font-size: 22pt;
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 4px;
    border-bottom: 2px solid #C9A96E;
    padding-bottom: 8px;
  }}

  h2 {{
    font-size: 15pt;
    font-weight: 600;
    margin-top: 26px;
    margin-bottom: 8px;
    border-bottom: 1px solid #E2E8F0;
    padding-bottom: 4px;
    color: #1B3A2D;
  }}

  h3 {{
    font-size: 12pt;
    font-weight: 600;
    margin-top: 18px;
    margin-bottom: 6px;
    color: #2D3748;
  }}

  h4 {{
    font-size: 10.5pt;
    font-weight: 600;
    margin-top: 14px;
    margin-bottom: 4px;
  }}

  p, ul, ol {{
    margin-top: 0;
    margin-bottom: 10px;
  }}

  ul, ol {{
    padding-left: 20px;
  }}

  li {{
    margin-bottom: 4px;
  }}

  a {{
    color: #1B3A2D;
    text-decoration: underline;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }}

  th, td {{
    border: 1px solid #CBD5E1;
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
  }}

  th {{
    background-color: #1B3A2D;
    color: #ffffff;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
  }}

  tr:nth-child(even) td {{
    background-color: #F8FAFC;
  }}

  code {{
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8.5pt;
    background-color: #F1F5F9;
    padding: 1px 4px;
    border-radius: 3px;
    color: #0F172A;
  }}

  pre {{
    background-color: #0F172A;
    color: #E2E8F0;
    padding: 10px 14px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 8pt;
    line-height: 1.45;
    margin: 12px 0;
    page-break-inside: avoid;
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
  }}

  blockquote {{
    border-left: 3px solid #C9A96E;
    margin: 10px 0;
    padding: 6px 14px;
    background-color: #FAF8F5;
    color: #4A5568;
    font-style: italic;
  }}

  .mermaid {{
    display: flex;
    justify-content: center;
    margin: 16px 0;
    page-break-inside: avoid;
  }}

  hr {{
    border: 0;
    height: 1px;
    background: #E2E8F0;
    margin: 20px 0;
  }}

  .meta-box {{
    background: #FAF8F5;
    border: 1px solid #E2D9CC;
    border-left: 4px solid #C9A96E;
    padding: 10px 14px;
    margin-bottom: 20px;
    font-size: 9pt;
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

html_path = os.path.abspath('Technical_Design_Document.html')
pdf_path = os.path.abspath('Technical_Design_Document.pdf')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Generated HTML at:", html_path)

# Run Edge headless to print to PDF
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
cmd = [
    edge_path,
    "--headless=new",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=6000",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

res = subprocess.run(cmd, capture_output=True)
if os.path.exists(pdf_path):
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"Successfully generated PDF: {pdf_path} ({size_kb:.1f} KB)")
else:
    print("Failed to generate PDF. Return code:", res.returncode)
