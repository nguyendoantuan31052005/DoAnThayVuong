
from pathlib import Path

import joblib
import pandas as pd

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

BASE_DIR = Path(__file__).resolve().parent

test_df = pd.read_csv(
    BASE_DIR / "data/v3/test_v3.csv"
)

y_test = test_df["label"]

models = {
    "V1": BASE_DIR / "models/backup_v1",
    "V2": BASE_DIR / "models/v2",
    "V3": BASE_DIR / "models/v3"
}

results = []

for name, folder in models.items():

    model = joblib.load(folder / "best_model.pkl")

    feature_names = joblib.load(
        folder / "feature_names.pkl"
    )

    X_test = test_df.reindex(
        columns=feature_names
    )

    if X_test.isna().any().any():
        raise ValueError(
            f"{name}: Missing feature columns"
        )

    predictions = model.predict(X_test)

    cm = confusion_matrix(
        y_test,
        predictions,
        labels=[0, 1]
    )

    results.append({
        "Model": name,
        "Accuracy": accuracy_score(
            y_test, predictions
        ) * 100,
        "Precision": precision_score(
            y_test, predictions, pos_label=0
        ) * 100,
        "Recall": recall_score(
            y_test, predictions, pos_label=0
        ) * 100,
        "F1": f1_score(
            y_test, predictions, pos_label=0
        ) * 100,
        "Missed_Phishing": int(cm[0, 1]),
        "False_Alarms": int(cm[1, 0])
    })

df = pd.DataFrame(results)

print("\n========== MODEL COMPARISON ==========")

print(
    df.round(4).to_string(index=False)
)

output = BASE_DIR / "results/v3/model_comparison.csv"

df.to_csv(
    output,
    index=False,
    encoding="utf-8-sig"
)

print("\nSaved:", output)
