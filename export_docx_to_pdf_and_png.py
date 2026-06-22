from pathlib import Path
import subprocess
import sys

import pypdfium2 as pdfium


DOCX_PATH = Path(r"C:\Users\juan.cornejo\Documents\gugnir v2\Cobertura_IoT_Austral_Polar_Brief.docx")
PDF_PATH = Path(r"C:\Users\juan.cornejo\Documents\gugnir v2\docx_render\Cobertura_IoT_Austral_Polar_Brief.pdf")
PNG_DIR = Path(r"C:\Users\juan.cornejo\Documents\gugnir v2\docx_render")


def export_pdf_with_word(docx_path: Path, pdf_path: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    powershell = rf"""
$word = $null
$doc = $null
try {{
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $doc = $word.Documents.Open('{docx_path}')
  $doc.SaveAs([ref] '{pdf_path}', [ref] 17)
}} finally {{
  if ($doc -ne $null) {{ $doc.Close() }}
  if ($word -ne $null) {{ $word.Quit() }}
}}
"""
    subprocess.run(
        ["powershell", "-NoProfile", "-Command", powershell],
        check=True,
    )


def export_pngs(pdf_path: Path, png_dir: Path) -> None:
    pdf = pdfium.PdfDocument(str(pdf_path))
    for index in range(len(pdf)):
        page = pdf[index]
        image = page.render(scale=2.0).to_pil()
        image.save(png_dir / f"page-{index + 1}.png")


def main() -> int:
    export_pdf_with_word(DOCX_PATH, PDF_PATH)
    export_pngs(PDF_PATH, PNG_DIR)
    print(PDF_PATH)
    for png in sorted(PNG_DIR.glob("page-*.png")):
        print(png)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
