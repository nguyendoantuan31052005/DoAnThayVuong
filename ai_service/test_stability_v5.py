
from pathlib import Path
import json

import joblib
import numpy as np

from feature_extractor_v5 import extract_features_v5

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models" / "v5"

model = joblib.load(MODEL_DIR / "best_model.pkl")
feature_names = joblib.load(MODEL_DIR / "feature_names.pkl")

with open(
    MODEL_DIR / "config.json",
    "r",
    encoding="utf-8"
) as f:
    config = json.load(f)

threshold = float(config["threshold"])
phishing_index = list(model.classes_).index(0)

test_urls = [
    "https://www.google.com",
    "https://www.google.com/",
    "http://www.google.com",
    "https://www.wikipedia.org",
    "https://www.wikipedia.org/",
    "http://www.wikipedia.org",
    "https://github.com",
    "https://github.com/",
    "http://github.com",
    "https://www.python.org",
    "https://www.python.org/",
    "http://www.python.org"
]

print("========== V5 STABILITY TEST ==========")
print("Threshold:", threshold)

for url in test_urls:
    features = extract_features_v5(url)

    X = np.array(
        [[features[name] for name in feature_names]],
        dtype=np.float32
    )

    score = model.predict_proba(X)[
        0, phishing_index
    ]

    prediction = (
        "PHISHING"
        if score >= threshold
        else "LEGITIMATE"
    )

    print("\nURL:", url)
    print("Prediction:", prediction)
    print(f"Phishing score: {score * 100:.2f}%")
