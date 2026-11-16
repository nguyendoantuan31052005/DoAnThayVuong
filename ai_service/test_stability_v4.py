
from pathlib import Path

import joblib
import pandas as pd

from extract_features_v4 import extract_features_v4

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR / "models/v4"
RESULT_DIR = BASE_DIR / "results/v4"

RESULT_DIR.mkdir(parents=True, exist_ok=True)

model = joblib.load(
    MODEL_DIR / "best_model.pkl"
)

feature_names = joblib.load(
    MODEL_DIR / "feature_names.pkl"
)

phishing_index = list(model.classes_).index(0)

test_groups = {
    "Google": [
        "https://www.google.com",
        "https://www.google.com/",
        "http://www.google.com"
    ],
    "Wikipedia": [
        "https://www.wikipedia.org",
        "https://www.wikipedia.org/",
        "http://www.wikipedia.org"
    ],
    "GitHub": [
        "https://github.com",
        "https://github.com/",
        "http://github.com"
    ],
    "Python": [
        "https://www.python.org",
        "https://www.python.org/",
        "http://www.python.org"
    ]
}

results = []

for website, urls in test_groups.items():

    for url in urls:
        features = extract_features_v4(url)

        X = pd.DataFrame(
            [features]
        ).reindex(columns=feature_names)

        prediction = int(
            model.predict(X.to_numpy(dtype="float32"))[0]
        )

        risk_score = float(
            model.predict_proba(
                 X.to_numpy(dtype="float32")
            )[0][phishing_index]
        ) * 100* 100

        results.append({
            "website": website,
            "url": url,
            "prediction": (
                "PHISHING" if prediction == 0
                else "LEGITIMATE"
            ),
            "riskScore": round(risk_score, 2)
        })

df = pd.DataFrame(results)

print("\n========== V4 STABILITY TEST ==========")
print(df.to_string(index=False))

print("\n========== SLASH COMPARISON ==========")

for website, group in df.groupby(
    "website", sort=False
):
    rows = group.iloc[:2]

    difference = abs(
        rows.iloc[0]["riskScore"]
        - rows.iloc[1]["riskScore"]
    )

    changed = (
        rows.iloc[0]["prediction"]
        != rows.iloc[1]["prediction"]
    )

    print(
        f"{website}: "
        f"difference={difference:.2f}, "
        f"prediction_changed={changed}"
    )

df.to_csv(
    RESULT_DIR / "stability_predictions_v4.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\nSaved:", RESULT_DIR)
print("Stability test completed!")
