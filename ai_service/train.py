
import os

# Gioi han luong tinh toan truoc khi import numpy/pandas/sklearn
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import gc
import pickle
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)

DATA_PATH = "data/processed/url_features.csv"
MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

print("Dang doc du lieu...", flush=True)

# Chi doc toi da 5.000 dong de thu nghiem
df = pd.read_csv(
    DATA_PATH,
    nrows=5000,
    dtype="float32"
)

print("So dong:", len(df), flush=True)

X = df.drop(columns=["label"])
y = df["label"].astype("int8")

feature_names = list(X.columns)

del df
gc.collect()

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

del X
gc.collect()

print("Dang huan luyen Logistic Regression...", flush=True)

model = LogisticRegression(
    max_iter=100,
    solver="liblinear",
    class_weight="balanced"
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, predictions))
print("Precision:", precision_score(y_test, predictions, zero_division=0))
print("Recall:", recall_score(y_test, predictions, zero_division=0))
print("F1-score:", f1_score(y_test, predictions, zero_division=0))

with open(os.path.join(MODEL_DIR, "best_model.pkl"), "wb") as f:
    pickle.dump(model, f)

with open(os.path.join(MODEL_DIR, "feature_names.pkl"), "wb") as f:
    pickle.dump(feature_names, f)

with open(os.path.join(MODEL_DIR, "best_model_name.txt"), "w") as f:
    f.write("LogisticRegression")

print("\nHUAN LUYEN THANH CONG!", flush=True)
print("Da luu mo hinh trong thu muc models/", flush=True)
