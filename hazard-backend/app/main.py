from fastapi import FastAPI, UploadFile, File
import shutil, uuid, os
from app.utils import load_model, predict_image

app = FastAPI()

# Load model once
MODEL_PATH = "app/model/hazard_classifier_mobilenetv2.pth"
model = load_model(MODEL_PATH)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Save temp file
    temp_name = f"temp_{uuid.uuid4().hex}.jpg"
    with open(temp_name, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run prediction
    result = predict_image(model, temp_name)

    # Delete temp file
    os.remove(temp_name)

    return result
