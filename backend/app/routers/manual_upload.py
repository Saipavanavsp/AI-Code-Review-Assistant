from fastapi import APIRouter, UploadFile, File, HTTPException
import pdfplumber
import pytesseract
from PIL import Image
import io
from app.services.llm_service import review_engine

router = APIRouter()

@router.post("/upload")
async def upload_file_for_review(file: UploadFile = File(...)):
    filename = file.filename
    content_type = file.content_type
    
    extracted_text = ""
    
    try:
        if content_type == "application/pdf":
            # Process PDF
            with pdfplumber.open(io.BytesIO(await file.read())) as pdf:
                for page in pdf.pages:
                    extracted_text += page.extract_text() + "\n"
        
        elif content_type.startswith("image/"):
            # Process Image (OCR)
            image = Image.open(io.BytesIO(await file.read()))
            extracted_text = pytesseract.image_to_string(image)
            
        elif content_type in ["text/plain", "text/x-python", "text/javascript"]:
            # Process plain text
            extracted_text = (await file.read()).decode("utf-8")
        
        else:
            # Fallback for other file types as text
            try:
                extracted_text = (await file.read()).decode("utf-8")
            except:
                raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

        # Perform review using the engine
        # We'll use the batch evaluation logic but for a single fragment
        fragments = [{"file": filename, "content": extracted_text, "language": "auto"}]
        results = review_engine.evaluate_batch("manual_upload", fragments)
        
        return {
            "filename": filename,
            "review": results[0]["review"],
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")
