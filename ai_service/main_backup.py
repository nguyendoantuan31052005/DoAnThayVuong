
import joblib
import pandas as pd

from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "best_model.pkl"
FEATURE_PATH = BASE_DIR / "models" / "feature_names.pkl"
NAME_PATH = BASE_DIR / "models" / "best_model_name.txt"

if not MODEL_PATH.exists() or not FEATURE_PATH.exists():
    raise RuntimeError("Chua co model. Hay chay python train.py truoc.")

model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURE_PATH)

model_name = (
    NAME_PATH.read_text(encoding="utf-8").strip()
    if NAME_PATH.exists()
    else "Unknown"
)

app = FastAPI(
    title="Phishing URL Detection API",
    description="AI service phat hien URL phishing",
    version="1.0.0"
)


class URLRequest(BaseModel):
    url: HttpUrl


@app.get("/")
def home():
    return {
        "message": "Phishing AI Service is running",
        "model": model_name
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_name": model_name
    }


@app.post("/predict")
def predict(request: URLRequest):
    url = str(request.url)

    try:
        features = extract_features(url)

        X = pd.DataFrame([features])
        X = X.reindex(columns=feature_names, fill_value=0)

        prediction = int(model.predict(X)[0])

        probabilities = model.predict_proba(X)[0]
        classes = list(model.classes_)

        phishing_index = classes.index(0)

        risk_score = round(
            float(probabilities[phishing_index]) * 100,
            2
        )

        # Tao ly do canh bao dua tren dac trung URL
        reasons = []

        if features.get("has_ip", 0):
            reasons.append("URL su dung dia chi IP thay vi ten mien.")

        if features.get("has_at", 0):
            reasons.append("URL chua ky tu @ co the gay nham lan dia chi.")

        if features.get("has_https_token", 0):
            reasons.append("URL co chuoi HTTPS trong ten mien hoac duong dan.")

        if features.get("has_suspicious_word", 0):
            reasons.append("URL chua tu khoa dang nghi.")

        if features.get("count_dots", 0) >= 4:
            reasons.append("URL co nhieu dau cham, co the co nhieu cap ten mien con.")

        if features.get("url_length", 0) > 75:
            reasons.append("URL co do dai bat thuong.")

        if risk_score >= 70:
            reasons.append("Mo hinh danh gia diem rui ro phishing cao.")
        elif risk_score >= 30:
            reasons.append("Mo hinh danh gia URL co muc rui ro can luu y.")

        if not reasons:
            reasons.append("Khong phat hien dac diem dang nghi noi bat tu cac dac trung URL.")

        return {
            "riskScore": risk_score,
            "riskLevel": (
                "SAFE" if risk_score < 30
                else "SUSPICIOUS" if risk_score < 70
                else "DANGEROUS"
            ),
            "reasons": reasons,
            "modelVersion": "1.0.0"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
