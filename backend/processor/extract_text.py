import pymupdf
import os

def extract(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    text = ""
    
    # 📄 Handle PDF Files
    if ext == ".pdf":
        file = pymupdf.open(file_path)
        for page in file:
            text += page.get_text()
        file.close()
        
    # 📝 Handle Word Files efficiently
    elif ext in [".docx", ".doc"]:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
    else:
        # Fallback to general read if possible
        with open(file_path, "r", errors="ignore") as f:
            text = f.read()
            
    return text