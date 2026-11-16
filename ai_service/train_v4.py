
from pathlib import Path

import joblib
import numpy as np
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

DATA_DIR = BASE_DIR / "data" / "v4"
MODEL_DIR = BASE_DIR / "models" / "v4"
RESULT_DIR = BASE_DIR / "results" / "v4"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading V4 feature datasets...")

train_df = pd.read_csv(
    DATA_DIR / "train_features_v4.csv"
)

test_df = pd.read_csv(
    DATA_DIR / "test_features_v4.csv"
)

print("Train shape:", train_df.shape)
print("Test shape:", test_df.shape)

# Kiem tra nhan
assert "label" in train_df.columns
assert "label" in test_df.columns

feature_names = [
    col for col in train_df.columns
    if col != "label"
]

assert len(feature_names) == 19
assert feature_names == [
    col for col in test_df.columns
    if col != "label"
]

# Kiem tra du lieu thieu
assert not train_df.isna().any().any()
assert not test_df.isna().any().any()

# Kiem tra nhan hop le
assert set(train_df["label"].unique()) == {0, 1}
assert set(test_df["label"].unique()) == {0, 1}

X_train = train_df[feature_names].to_numpy(
    dtype=np.float32
)

X_test = test_df[feature_names].to_numpy(
    dtype=np.float32
)

y_train = train_df["label"].to_numpy()
y_test = test_df["label"].to_numpy()

del train_df, test_df

print("\n========== TRAINING DATA ==========")
print("Train samples:", len(X_train))
print("Test samples:", len(X_test))
print("Features:", len(feature_names))

print("\nTraining Random Forest V4...")

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced_subsample",
    max_features="sqrt",
    random_state=42,
    n_jobs=2
)

model.fit(X_train, y_train)

print("Training completed!")

print("\nEvaluating V4...")

y_pred = model.predict(X_test)

# Phishing = 0
metrics = {
    "accuracy": accuracy_score(y_test, y_pred),
    "precision_phishing": precision_score(
        y_test, y_pred, pos_label=0,
        zero_division=0
    ),
    "recall_phishing": recall_score(
        y_test, y_pred, pos_label=0,
        zero_division=0
    ),
    "f1_phishing": f1_score(
        y_test, y_pred, pos_label=0,
        zero_division=0
    )
}

print("\n========== RANDOM FOREST V4 ==========")

for name, value in metrics.items():
    print(f"{name}: {value * 100:.4f}%")

report = classification_report(
    y_test,
    y_pred,
    labels=[0, 1],
    target_names=["Phishing", "Legitimate"],
    zero_division=0
)

print("\nClassification Report:")
print(report)

cm = confusion_matrix(
    y_test,
    y_pred,
    labels=[0, 1]
)

print("\nConfusion Matrix:")
print(cm)

print("\nMissed Phishing:", cm[0, 1])
print("False Alarms:", cm[1, 0])

# Luu model
joblib.dump(
    model,
    MODEL_DIR / "best_model.pkl"
)

joblib.dump(
    feature_names,
    MODEL_DIR / "feature_names.pkl"
)

(MODEL_DIR / "best_model_name.txt").write_text(
    "RandomForest_V4",
    encoding="utf-8"
)

# Luu metrics
pd.DataFrame([metrics]).to_csv(
    RESULT_DIR / "metrics_v4.csv",
    index=False
)

pd.DataFrame(
    cm,
    index=[
        "Actual_Phishing",
        "Actual_Legitimate"
    ],
    columns=[
        "Pred_Phishing",
        "Pred_Legitimate"
    ]
).to_csv(
    RESULT_DIR / "confusion_matrix_v4.csv"
)

(RESULT_DIR / "classification_report_v4.txt").write_text(
    report,
    encoding="utf-8"
)

# Feature Importance
importance = pd.DataFrame({
    "feature": feature_names,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

importance.to_csv(
    RESULT_DIR / "feature_importance_v4.csv",
    index=False
)

print("\n========== TOP 10 FEATURES ==========")
print(importance.head(10).to_string(index=False))

print("\nModel saved:", MODEL_DIR)
print("Results saved:", RESULT_DIR)
print("V4 completed!")
