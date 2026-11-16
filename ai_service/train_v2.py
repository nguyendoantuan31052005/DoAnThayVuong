
import joblib
import pandas as pd

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)

BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "data/processed/url_features.csv"
MODEL_DIR = BASE_DIR / "models/v2"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

# Loai bo 4 dac trung co nguy co gay sai lech
REMOVE_FEATURES = [
    "path_length",
    "count_slashes",
    "count_https",
    "count_http"
]

X = df.drop(columns=["label"] + REMOVE_FEATURES)
y = df["label"]

print("So mau:", len(df))
print("So dac trung:", X.shape[1])

# Chia du lieu 80/20
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("Training RandomForest V2...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("Evaluating model...")

y_pred = model.predict(X_test)

# Nhan 0 = Phishing
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, pos_label=0)
recall = recall_score(y_test, y_pred, pos_label=0)
f1 = f1_score(y_test, y_pred, pos_label=0)

print("\n========== RANDOM FOREST V2 ==========")
print("Accuracy :", round(accuracy * 100, 4), "%")
print("Precision:", round(precision * 100, 4), "%")
print("Recall   :", round(recall * 100, 4), "%")
print("F1-score :", round(f1 * 100, 4), "%")

print("\nClassification Report:")
print(classification_report(
    y_test,
    y_pred,
    target_names=["Phishing", "Legitimate"]
))

# Luu rieng mo hinh V2
joblib.dump(model, MODEL_DIR / "best_model.pkl")
joblib.dump(X.columns.tolist(), MODEL_DIR / "feature_names.pkl")

(MODEL_DIR / "best_model_name.txt").write_text(
    "RandomForest_V2",
    encoding="utf-8"
)

print("\nDa luu model V2 tai:", MODEL_DIR)
