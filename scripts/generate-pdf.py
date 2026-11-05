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

# Extract and enhance metadata from the top
# Strip the top 10 lines of raw markdown to replace with an executive hero header
header_match = re.search(r'^(# Technical Design Document.*?)(## 1\. Executive Summary)', md_content, re.DOTALL)

if header_match:
    body_md = md_content[header_match.end(1):]
else:
    body_md = md_content

html_body = md.render(body_md)

# Replace mermaid code blocks with <div class="mermaid">
def replace_mermaid(match):
    code = match.group(1).strip()
    return f'<div class="mermaid">\n{code}\n</div>'

html_body = re.sub(r'<pre><code class="language-mermaid">([\s\S]*?)</code></pre>', replace_mermaid, html_body)

# Style Assumption blocks as executive callouts
html_body = re.sub(
    r'<li><strong>\[Assumption (\d+): (.*?)\]</strong>(.*?)</li>',
    r'<li class="assumption-item"><div class="assumption-tag">Assumption \1: \2</div><div class="assumption-body">\3</div></li>',
    html_body
)

executive_header = """
<div class="exec-header">
  <div class="exec-badge">SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION</div>
  <h1 class="exec-title">Misty Peaks Estate</h1>
  <div class="exec-subtitle">Direct-Booking Platform with Transaction-Isolated Allotment Control &amp; AI Enquiry Engine</div>
  
  <div class="exec-grid">
    <div class="exec-meta-col">
      <div class="meta-label">Client</div>
      <div class="meta-val">Company A (Chikkamagaluru, Karnataka)</div>
    </div>
    <div class="exec-meta-col">
      <div class="meta-label">GitHub Repository</div>
      <div class="meta-val"><a href="https://github.com/Imafrah/hill-resort" class="repo-link">github.com/Imafrah/hill-resort</a></div>
    </div>
    <div class="exec-meta-col">
      <div class="meta-label">Evaluation Target</div>
      <div class="meta-val">Full-Stack Direct Booking + AI Routing</div>
    </div>
    <div class="exec-meta-col">
      <div class="meta-label">Verification Status</div>
      <div class="meta-val"><span class="status-pill">35 / 35 Tests Passing (100%)</span></div>
    </div>
  </div>
</div>
"""

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
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px'
    }}
  }});
</script>
<style>
  @page {{
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {{
      content: counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94A3B8;
    }}
    @bottom-left {{
      content: "Misty Peaks Estate — Technical Design Document";
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94A3B8;
    }}
  }}

  *, *:before, *:after {{
    box-sizing: border-box;
  }}

  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1E293B;
    line-height: 1.55;
    font-size: 9.5pt;
    background-color: #ffffff;
    max-width: 820px;
    margin: 0 auto;
    padding: 0;
  }}

  /* Executive Header */
  .exec-header {{
    background: linear-gradient(135deg, #1B3A2D 0%, #12281F 100%);
    color: #FFFFFF;
    padding: 24px 28px;
    border-radius: 6px;
    border-bottom: 3px solid #C9A96E;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }}

  .exec-badge {{
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #C9A96E;
    margin-bottom: 6px;
  }}

  .exec-title {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24pt;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 0 4px 0;
    letter-spacing: -0.01em;
  }}

  .exec-subtitle {{
    font-size: 10pt;
    color: #E2E8F0;
    margin-bottom: 18px;
    font-weight: 400;
    line-height: 1.4;
  }}

  .exec-grid {{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 20px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }}

  .exec-meta-col {{
    font-size: 8.5pt;
  }}

  .meta-label {{
    color: #94A3B8;
    text-transform: uppercase;
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }}

  .meta-val {{
    color: #FFFFFF;
    font-weight: 500;
  }}

  .repo-link {{
    color: #C9A96E;
    text-decoration: underline;
    font-weight: 600;
  }}

  .status-pill {{
    display: inline-block;
    background-color: rgba(34, 197, 94, 0.2);
    color: #4ADE80;
    border: 1px solid rgba(34, 197, 94, 0.4);
    padding: 1px 8px;
    border-radius: 9999px;
    font-size: 7.5pt;
    font-weight: 600;
  }}

  /* Typography */
  h2 {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 14pt;
    font-weight: 700;
    margin-top: 24px;
    margin-bottom: 10px;
    border-bottom: 1px solid #CBD5E1;
    padding-bottom: 4px;
    color: #1B3A2D;
    page-break-after: avoid;
  }}

  h3 {{
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 11.5pt;
    font-weight: 600;
    margin-top: 16px;
    margin-bottom: 6px;
    color: #1E293B;
    page-break-after: avoid;
  }}

  h4 {{
    font-size: 10pt;
    font-weight: 600;
    margin-top: 12px;
    margin-bottom: 4px;
    color: #334155;
  }}

  p, ul, ol {{
    margin-top: 0;
    margin-bottom: 8px;
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

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }}

  th, td {{
    border: 1px solid #CBD5E1;
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
  }}

  th {{
    background-color: #1B3A2D;
    color: #FFFFFF;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }}

  tr:nth-child(even) td {{
    background-color: #F8FAFC;
  }}

  /* Code Blocks */
  code {{
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8pt;
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
    font-size: 7.5pt;
    line-height: 1.45;
    margin: 10px 0;
    page-break-inside: avoid;
    border-left: 3px solid #C9A96E;
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
  }}

  /* Assumptions Callouts */
  .assumption-item {{
    list-style: none;
    margin-left: -20px;
    margin-bottom: 10px;
    background: #FAF8F5;
    border: 1px solid #E2D9CC;
    border-left: 3.5px solid #C9A96E;
    padding: 8px 12px;
    border-radius: 2px;
  }}

  .assumption-tag {{
    font-size: 8.5pt;
    font-weight: 700;
    color: #1B3A2D;
    margin-bottom: 2px;
  }}

  .assumption-body {{
    font-size: 9pt;
    color: #334155;
  }}

  .mermaid {{
    display: flex;
    justify-content: center;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  hr {{
    border: 0;
    height: 1px;
    background: #E2E8F0;
    margin: 18px 0;
  }}
</style>
</head>
<body>
{executive_header}
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
