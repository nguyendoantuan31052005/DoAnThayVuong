
from pathlib import Path
import joblib
import pandas as pd

from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent

MODEL_DIR = BASE_DIR / "models" / "v3"
RESULT_DIR = BASE_DIR / "results" / "v3"

RESULT_DIR.mkdir(parents=True, exist_ok=True)

model = joblib.load(MODEL_DIR / "best_model.pkl")
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
summary = []

for website, urls in test_groups.items():
    website_results = []

    for url in urls:
        features = extract_features(url)

        X = pd.DataFrame([features]).reindex(
            columns=feature_names,
            fill_value=0
        )

        prediction = int(model.predict(X)[0])

        risk_score = float(
            model.predict_proba(X)[0][phishing_index]
        ) * 100

        result = {
            "website": website,
            "url": url,
            "prediction": (
                "PHISHING" if prediction == 0
                else "LEGITIMATE"
            ),
            "riskScore": round(risk_score, 2)
        }

        results.append(result)
        website_results.append(result)

    first = website_results[0]
    second = website_results[1]

    summary.append({
        "website": website,
        "risk_without_slash": first["riskScore"],
        "risk_with_slash": second["riskScore"],
        "difference": round(
            abs(
                first["riskScore"]
                - second["riskScore"]
            ), 2
        ),
        "prediction_changed": (
            first["prediction"]
            != second["prediction"]
        )
    })

df = pd.DataFrame(results)
summary_df = pd.DataFrame(summary)

print("\n========== V3 PREDICTIONS ==========")
print(df.to_string(index=False))

print("\n========== V3 STABILITY ==========")
print(summary_df.to_string(index=False))

print(
    "\nSo website doi nhan khi them /:",
    summary_df["prediction_changed"].sum(),
    "/",
    len(summary_df)
)

df.to_csv(
    RESULT_DIR / "stability_predictions_v3.csv",
    index=False,
    encoding="utf-8-sig"
)

summary_df.to_csv(
    RESULT_DIR / "stability_summary_v3.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu ket qua vao:", RESULT_DIR)
