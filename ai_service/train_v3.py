
from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data" / "v3"
MODEL_DIR = BASE_DIR / "models" / "v3"
RESULT_DIR = BASE_DIR / "results" / "v3"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading V3 dataset...")

train_df = pd.read_csv(DATA_DIR / "train_v3.csv")
test_df = pd.read_csv(DATA_DIR / "test_v3.csv")

# Kiem tra hostname khong trung nhau
overlap = (
    set(train_df["hostname"])
    & set(test_df["hostname"])
)

assert len(overlap) == 0, "Hostname overlap detected!"

# Loai bo cac dac trung da loai trong V2
REMOVE_FEATURES = [
    "path_length",
    "count_slashes",
    "count_https",
    "count_http"
]

DROP_COLUMNS = [
    "label",
    "hostname"
] + REMOVE_FEATURES

X_train = train_df.drop(columns=DROP_COLUMNS)
y_train = train_df["label"]

X_test = test_df.drop(columns=DROP_COLUMNS)
y_test = test_df["label"]

assert X_train.columns.tolist() == X_test.columns.tolist()
assert not X_train.isna().any().any()
assert not X_test.isna().any().any()

print("Train samples:", len(X_train))
print("Test samples:", len(X_test))
print("Features:", X_train.shape[1])
print("Overlapping hostnames:", len(overlap))

print("\nTraining Random Forest V3...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("\nEvaluating model...")

y_pred = model.predict(X_test)

# Phishing = 0
metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision": precision_score(
        y_test, y_pred, pos_label=0
    ),
    "recall": recall_score(
        y_test, y_pred, pos_label=0
    ),
    "f1_score": f1_score(
        y_test, y_pred, pos_label=0
    )
}

print("\n========== RANDOM FOREST V3 ==========")

for name, value in metrics.items():
    print(f"{name}: {value * 100:.4f}%")

report = classification_report(
    y_test,
    y_pred,
    labels=[0, 1],
    target_names=["Phishing", "Legitimate"]
)

print("\nClassification Report:")
print(report)

cm = confusion_matrix(
    y_test, y_pred, labels=[0, 1]
)

print("\nConfusion Matrix:")
print(cm)

# Luu mo hinh V3
joblib.dump(
    model,
    MODEL_DIR / "best_model.pkl"
)

joblib.dump(
    X_train.columns.tolist(),
    MODEL_DIR / "feature_names.pkl"
)

(MODEL_DIR / "best_model_name.txt").write_text(
    "RandomForest_V3",
    encoding="utf-8"
)

# Luu ket qua
pd.DataFrame([metrics]).to_csv(
    RESULT_DIR / "metrics_v3.csv",
    index=False
)

pd.DataFrame(
    cm,
    index=["Actual_Phishing", "Actual_Legitimate"],
    columns=["Pred_Phishing", "Pred_Legitimate"]
).to_csv(
    RESULT_DIR / "confusion_matrix_v3.csv"
)

(RESULT_DIR / "classification_report_v3.txt").write_text(
    report,
    encoding="utf-8"
)

importance = pd.DataFrame({
    "feature": X_train.columns,
    "importance": model.feature_importances_
})

importance.sort_values(
    "importance", ascending=False
).to_csv(
    RESULT_DIR / "feature_importance_v3.csv",
    index=False
)

print("\nModel saved:", MODEL_DIR)
print("Results saved:", RESULT_DIR)
print("Training completed!")
