
import joblib
import pandas as pd
import shap

from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

from feature_extractor import extract_features

# ==========================================
# 1. LOAD MODEL
# ==========================================

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

# ==========================================
# 2. KHOI TAO SHAP
# ==========================================

print("Loading SHAP TreeExplainer...")

explainer = shap.TreeExplainer(model)

classes = list(model.classes_)
phishing_index = classes.index(0)

print("SHAP loaded successfully!")

# ==========================================
# 3. FASTAPI
# ==========================================

app = FastAPI(
    title="Phishing URL Detection API",
    description="AI service phat hien URL phishing va giai thich bang SHAP",
    version="1.1.0"
)


class URLRequest(BaseModel):
    url: HttpUrl


# ==========================================
# 4. HAM GIAI THICH SHAP
# ==========================================

def explain_prediction(X):

    shap_result = explainer(X)

    values = shap_result.values

    # Xu ly cac dang output cua SHAP
    if isinstance(values, list):
        phishing_values = values[phishing_index][0]

    elif values.ndim == 3:
        phishing_values = values[0, :, phishing_index]

    else:
        phishing_values = values[0]

    # Sap xep theo tri tuyet doi
    explanations = []

    for i, feature in enumerate(feature_names):

        contribution = float(phishing_values[i])

        explanations.append({
            "feature": feature,
            "featureValue": float(X.iloc[0, i]),
            "contribution": round(contribution, 6),
            "direction": (
                "increases_phishing"
                if contribution > 0
                else "decreases_phishing"
                if contribution < 0
                else "neutral"
            )
        })

    explanations.sort(
        key=lambda item: abs(item["contribution"]),
        reverse=True
    )

    return explanations[:5]


# ==========================================
# 5. HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Phishing AI Service is running",
        "model": model_name,
        "shap_enabled": True
    }


# ==========================================
# 6. HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_name": model_name,
        "shap_enabled": True
    }


# ==========================================
# 7. PREDICT API + SHAP
# ==========================================

@app.post("/predict")
def predict(request: URLRequest):

    url = str(request.url)

    try:
        # Trich xuat 23 dac trung
        features = extract_features(url)

        X = pd.DataFrame([features])
        X = X.reindex(
            columns=feature_names,
            fill_value=0
        )

        # Du doan
        prediction = int(model.predict(X)[0])

        probabilities = model.predict_proba(X)[0]

        risk_score = round(
            float(probabilities[phishing_index]) * 100,
            2
        )

        # ==================================
        # REASONS
        # ==================================

        reasons = []

        if features.get("has_ip", 0):
            reasons.append(
                "URL su dung dia chi IP thay vi ten mien."
            )

        if features.get("has_at", 0):
            reasons.append(
                "URL chua ky tu @ co the gay nham lan dia chi."
            )

        if features.get("has_https_token", 0):
            reasons.append(
                "URL co chuoi HTTPS trong ten mien hoac duong dan."
            )

        if features.get("has_suspicious_word", 0):
            reasons.append(
                "URL chua tu khoa dang nghi."
            )

        if features.get("count_dots", 0) >= 4:
            reasons.append(
                "URL co nhieu dau cham."
            )

        if features.get("url_length", 0) > 75:
            reasons.append(
                "URL co do dai bat thuong."
            )

        if risk_score >= 70:
            reasons.append(
                "Mo hinh danh gia diem rui ro phishing cao."
            )

        elif risk_score >= 30:
            reasons.append(
                "Mo hinh danh gia URL co muc rui ro can luu y."
            )

        if not reasons:
            reasons.append(
                "Khong phat hien dac diem dang nghi noi bat."
            )

        # ==================================
        # SHAP EXPLANATION
        # ==================================

        explanations = explain_prediction(X)

        return {
            "url": url,
            "prediction": (
                "PHISHING" if prediction == 0
                else "LEGITIMATE"
            ),
            "riskScore": risk_score,
            "riskLevel": (
                "SAFE" if risk_score < 30
                else "SUSPICIOUS" if risk_score < 70
                else "DANGEROUS"
            ),
            "reasons": reasons,
            "explanations": explanations,
            "modelVersion": "1.1.0"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
