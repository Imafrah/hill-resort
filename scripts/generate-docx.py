import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import re

doc = docx.Document()

# Set standard 1-inch margins
for section in doc.sections:
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Colors
FOREST = RGBColor(0x1B, 0x3A, 0x2D)
GOLD = RGBColor(0xC9, 0xA9, 0x6E)
DARK = RGBColor(0x2D, 0x37, 0x48)
MUTED = RGBColor(0x71, 0x80, 0x96)

# Normal style configuration
normal_style = doc.styles['Normal']
normal_style.font.name = 'Calibri'
normal_style.font.size = Pt(10.5)
normal_style.font.color.rgb = DARK

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

with open('TECHNICAL_DESIGN.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

in_code_block = False
code_lines = []
in_table = False
table_rows = []

for line in lines:
    raw = line.rstrip('\r\n')
    
    # Code block toggle
    if raw.startswith('```'):
        if in_code_block:
            in_code_block = False
            # Render code block
            code_text = '\n'.join(code_lines)
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.2)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(code_text)
            run.font.name = 'Consolas'
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(0x1A, 0x20, 0x2C)
            code_lines = []
        else:
            in_code_block = True
            code_lines = []
        continue

    if in_code_block:
        code_lines.append(raw)
        continue

    # Tables
    if raw.strip().startswith('|') and raw.strip().endswith('|'):
        # Check if separator row |---|---|
        if re.match(r'^\|[\s\-:|]+\|$', raw.strip()):
            continue
        cells = [c.strip() for c in raw.strip().strip('|').split('|')]
        table_rows.append(cells)
        continue
    else:
        if table_rows:
            # Output accumulated table
            num_cols = max(len(r) for r in table_rows)
            t = doc.add_table(rows=len(table_rows), cols=num_cols)
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for r_idx, row in enumerate(table_rows):
                for c_idx, cell_value in enumerate(row):
                    if c_idx < num_cols:
                        cell = t.cell(r_idx, c_idx)
                        cell.text = cell_value.replace('**', '').replace('`', '')
                        cell.paragraphs[0].runs[0].font.size = Pt(8.5)
                        if r_idx == 0:
                            set_cell_background(cell, "1B3A2D")
                            cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                            cell.paragraphs[0].runs[0].font.bold = True
                        elif r_idx % 2 == 1:
                            set_cell_background(cell, "F8FAFC")
            t.autofit = True
            doc.add_paragraph().paragraph_format.space_after = Pt(6)
            table_rows = []

    if not raw.strip():
        continue

    # Headings
    if raw.startswith('# '):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(raw[2:])
        run.font.name = 'Georgia'
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.color.rgb = FOREST
    elif raw.startswith('## '):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(raw[3:])
        run.font.name = 'Georgia'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = FOREST
    elif raw.startswith('### '):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(raw[4:])
        run.font.name = 'Georgia'
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = DARK
    elif raw.startswith('- '):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        text = raw[2:]
        # Simple inline parser
        parts = re.split(r'(\*\*.*?\*\*|`.*?`)', text)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                r = p.add_run(part[2:-2])
                r.bold = True
            elif part.startswith('`') and part.endswith('`'):
                r = p.add_run(part[1:-1])
                r.font.name = 'Consolas'
                r.font.size = Pt(9)
            else:
                p.add_run(part)
    elif raw.startswith('---'):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
    else:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        parts = re.split(r'(\*\*.*?\*\*|`.*?`)', raw)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                r = p.add_run(part[2:-2])
                r.bold = True
            elif part.startswith('`') and part.endswith('`'):
                r = p.add_run(part[1:-1])
                r.font.name = 'Consolas'
                r.font.size = Pt(9)
            else:
                p.add_run(part)

docx_path = 'Technical_Design_Document.docx'
doc.save(docx_path)
print("Saved DOCX document to:", docx_path)
