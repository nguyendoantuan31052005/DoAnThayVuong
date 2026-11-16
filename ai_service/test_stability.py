
import joblib
import pandas as pd
from pathlib import Path
from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "models" / "v2" / "best_model.pkl")
feature_names = joblib.load(BASE_DIR / "models" / "v2" / "feature_names.pkl")

phishing_index = list(model.classes_).index(0)

# Cac nhom URL de kiem tra
test_groups = {
    "Google": [
        "https://www.google.com",
        "https://www.google.com/",
        "http://www.google.com",
    ],
    "Wikipedia": [
        "https://www.wikipedia.org",
        "https://www.wikipedia.org/",
        "http://www.wikipedia.org",
    ],
    "GitHub": [
        "https://github.com",
        "https://github.com/",
        "http://github.com",
    ],
    "Python": [
        "https://www.python.org",
        "https://www.python.org/",
        "http://www.python.org",
    ],
}

results = []

for group, urls in test_groups.items():
    for url in urls:
        features = extract_features(url)

        X = pd.DataFrame([features])
        X = X.reindex(columns=feature_names, fill_value=0)

        prediction = int(model.predict(X)[0])
        probabilities = model.predict_proba(X)[0]

        risk_score = round(
            float(probabilities[phishing_index]) * 100, 2
        )

        results.append({
            "group": group,
            "url": url,
            "prediction": (
                "PHISHING" if prediction == 0 else "LEGITIMATE"
            ),
            "riskScore": risk_score,
            "path_length": features["path_length"],
            "count_slashes": features["count_slashes"],
            "count_https": features["count_https"],
            "count_http": features["count_http"],
        })

df = pd.DataFrame(results)

print("\n========== KET QUA KIEM TRA ==========")
print(df.to_string(index=False))

# Do muc thay doi giua URL khong co / va co /
stability = []

for group, data in df.groupby("group", sort=False):
    https_data = data[
        data["url"].str.startswith("https://")
    ]

    if len(https_data) != 2:
        continue

    first = https_data.iloc[0]
    second = https_data.iloc[1]

    stability.append({
        "website": group,
        "risk_without_slash": first["riskScore"],
        "risk_with_slash": second["riskScore"],
        "difference": round(
            abs(first["riskScore"] - second["riskScore"]), 2
        ),
        "prediction_changed": (
            first["prediction"] != second["prediction"]
        ),
    })

stability_df = pd.DataFrame(stability)

print("\n========== DO ON DINH DAU / ==========")
print(stability_df.to_string(index=False))

# Luu ket qua
result_dir = BASE_DIR / "results"
result_dir.mkdir(exist_ok=True)

df.to_csv(
    result_dir / "stability_predictions_v2.csv",
    index=False,
    encoding="utf-8-sig"
)

stability_df.to_csv(
    result_dir / "stability_summary_v2.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\nDa luu:")
print("results/stability_predictions.csv")
print("results/stability_summary.csv")
