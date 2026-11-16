
from pathlib import Path
import json
import gc

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    average_precision_score
)

from feature_extractor_v5 import FEATURE_NAMES


# ==========================================
# 1. CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models" / "v5"
RESULT_DIR = BASE_DIR / "results" / "v5"

MODEL_DIR.mkdir(parents=True, exist_ok=True)
RESULT_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 5000


# ==========================================
# 2. LOAD FEATURES - LOW MEMORY
# ==========================================

def load_features(filename):
    """
    Doc file CSV theo chunk.
    Su dung float32 va int8 de tiet kiem RAM.
    """

    path = DATA_DIR / "v5" / filename

    print(f"\nLoading: {filename}", flush=True)

    dtype_map = {
        name: "float32"
        for name in FEATURE_NAMES
    }
    dtype_map["label"] = "int8"

    x_parts = []
    y_parts = []

    total = 0

    for chunk in pd.read_csv(
        path,
        chunksize=CHUNK_SIZE,
        dtype=dtype_map,
        usecols=FEATURE_NAMES + ["label"]
    ):

        X_chunk = chunk[FEATURE_NAMES].to_numpy(
            dtype=np.float32
        )

        y_chunk = chunk["label"].to_numpy(
            dtype=np.int8
        )

        x_parts.append(X_chunk)
        y_parts.append(y_chunk)

        total += len(chunk)

        if total % 50000 < CHUNK_SIZE:
            print(
                f"Loaded {total:,} rows",
                flush=True
            )

    X = np.concatenate(x_parts, axis=0)
    y = np.concatenate(y_parts, axis=0)

    del x_parts, y_parts
    gc.collect()

    print(f"Loaded total: {len(y):,}")

    return X, y


# ==========================================
# 3. LOAD HOSTNAMES - INTEGER ENCODING
# ==========================================

def load_hostnames(filename):
    """
    Ma hoa hostname thanh int32.

    Cac hostname giong nhau se co cung ID.
    Tranh tao mang Unicode lon gay MemoryError.
    """

    path = DATA_DIR / "v4" / filename

    hostname_to_id = {}
    group_parts = []

    next_id = 0
    total = 0

    print("\nLoading hostname groups...", flush=True)

    for chunk in pd.read_csv(
        path,
        usecols=["hostname"],
        chunksize=CHUNK_SIZE,
        keep_default_na=False
    ):

        codes = np.empty(
            len(chunk),
            dtype=np.int32
        )

        for i, hostname in enumerate(
            chunk["hostname"]
        ):

            hostname = str(hostname)

            if hostname not in hostname_to_id:
                hostname_to_id[hostname] = next_id
                next_id += 1

            codes[i] = hostname_to_id[hostname]

        group_parts.append(codes)

        total += len(codes)

        if total % 50000 < CHUNK_SIZE:
            print(
                f"Encoded {total:,} hostnames",
                flush=True
            )

    groups = np.concatenate(group_parts)

    del group_parts, hostname_to_id
    gc.collect()

    print(f"Total hostname rows: {len(groups):,}")
    print(f"Unique hostname groups: {next_id:,}")

    return groups


# ==========================================
# 4. LOAD TRAIN DATA
# ==========================================

print("\n========== LOADING V5 ==========")

X_train, y_train = load_features(
    "train_features_v5.csv"
)

assert X_train.shape[1] == len(FEATURE_NAMES)
assert np.isfinite(X_train).all()
assert set(np.unique(y_train)) == {0, 1}

print("Train shape:", X_train.shape)


# ==========================================
# 5. GROUP VALIDATION SPLIT
# ==========================================

print("\n========== VALIDATION SPLIT ==========")

hostnames = load_hostnames(
    "train_urls_v4.csv"
)

assert len(hostnames) == len(y_train)

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=2026
)

fit_idx, val_idx = next(
    splitter.split(
        X_train,
        y_train,
        groups=hostnames
    )
)

# Kiem tra hostname overlap
fit_groups = np.unique(hostnames[fit_idx])
val_groups = np.unique(hostnames[val_idx])

overlap = np.intersect1d(
    fit_groups,
    val_groups
)

assert len(overlap) == 0

print("Hostname overlap:", len(overlap))
print("Fit samples:", len(fit_idx))
print("Validation samples:", len(val_idx))

print(
    "Fit phishing:",
    int(np.sum(y_train[fit_idx] == 0))
)

print(
    "Validation phishing:",
    int(np.sum(y_train[val_idx] == 0))
)

del hostnames, fit_groups, val_groups, overlap
gc.collect()


# ==========================================
# 6. TRAIN RANDOM FOREST V5
# ==========================================

print("\n========== TRAINING V5 ==========")

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=16,
    min_samples_leaf=3,
    class_weight="balanced_subsample",
    max_features="sqrt",
    random_state=42,
    n_jobs=1
)

X_fit = X_train[fit_idx]
y_fit = y_train[fit_idx]

print("Training Random Forest...", flush=True)

model.fit(X_fit, y_fit)

del X_fit, y_fit, fit_idx
gc.collect()

print("Training completed!", flush=True)


# ==========================================
# 7. VALIDATION THRESHOLD
# ==========================================

print("\n========== VALIDATION ==========")

phishing_index = list(
    model.classes_
).index(0)

X_val = X_train[val_idx]
y_val = y_train[val_idx]

val_scores = model.predict_proba(
    X_val
)[:, phishing_index]

del X_val, X_train, y_train, val_idx
gc.collect()

threshold_results = []

for threshold in np.arange(
    0.10,
    0.91,
    0.05
):

    pred = np.where(
        val_scores >= threshold,
        0,
        1
    )

    precision = precision_score(
        y_val,
        pred,
        pos_label=0,
        zero_division=0
    )

    recall = recall_score(
        y_val,
        pred,
        pos_label=0,
        zero_division=0
    )

    f1 = f1_score(
        y_val,
        pred,
        pos_label=0,
        zero_division=0
    )

    threshold_results.append({
        "threshold": round(float(threshold), 2),
        "precision": precision,
        "recall": recall,
        "f1": f1
    })

threshold_df = pd.DataFrame(
    threshold_results
)

threshold_df.to_csv(
    RESULT_DIR / "threshold_validation.csv",
    index=False
)

best_row = threshold_df.sort_values(
    ["f1", "threshold"],
    ascending=[False, True]
).iloc[0]

best_threshold = float(
    best_row["threshold"]
)

print(
    threshold_df.round(4).to_string(index=False)
)

print("\nBest threshold:", best_threshold)

del val_scores, y_val
gc.collect()


# ==========================================
# 8. TEST EVALUATION
# ==========================================

print("\n========== TEST EVALUATION ==========")

X_test, y_test = load_features(
    "test_features_v5.csv"
)

test_scores = model.predict_proba(
    X_test
)[:, phishing_index]

test_pred = np.where(
    test_scores >= best_threshold,
    0,
    1
)

del X_test
gc.collect()

metrics = {
    "accuracy": accuracy_score(
        y_test, test_pred
    ),

    "precision_phishing": precision_score(
        y_test,
        test_pred,
        pos_label=0,
        zero_division=0
    ),

    "recall_phishing": recall_score(
        y_test,
        test_pred,
        pos_label=0,
        zero_division=0
    ),

    "f1_phishing": f1_score(
        y_test,
        test_pred,
        pos_label=0,
        zero_division=0
    ),

    "average_precision_phishing": (
        average_precision_score(
            (y_test == 0).astype(np.int8),
            test_scores
        )
    ),

    "threshold": best_threshold
}

for name, value in metrics.items():

    if name == "threshold":
        print(f"{name}: {value:.2f}")

    else:
        print(f"{name}: {value * 100:.4f}%")


# ==========================================
# 9. CONFUSION MATRIX
# ==========================================

cm = confusion_matrix(
    y_test,
    test_pred,
    labels=[0, 1]
)

print("\nConfusion Matrix:")
print(cm)

print("\nMissed Phishing:", cm[0, 1])
print("False Alarms:", cm[1, 0])

report = classification_report(
    y_test,
    test_pred,
    labels=[0, 1],
    target_names=[
        "Phishing",
        "Legitimate"
    ],
    zero_division=0
)

print("\nClassification Report:")
print(report)


# ==========================================
# 10. FEATURE IMPORTANCE
# ==========================================

importance = pd.DataFrame({
    "feature": FEATURE_NAMES,
    "importance": model.feature_importances_
}).sort_values(
    "importance",
    ascending=False
)

print("\n========== TOP 10 FEATURES ==========")

print(
    importance.head(10).to_string(
        index=False
    )
)


# ==========================================
# 11. SAVE MODEL
# ==========================================

print("\n========== SAVING ==========")

joblib.dump(
    model,
    MODEL_DIR / "best_model.pkl",
    compress=3
)

joblib.dump(
    FEATURE_NAMES,
    MODEL_DIR / "feature_names.pkl"
)

with open(
    MODEL_DIR / "config.json",
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        {
            "model": "RandomForest_V5",
            "threshold": best_threshold,
            "phishing_label": 0,
            "legitimate_label": 1,
            "feature_count": len(FEATURE_NAMES)
        },
        f,
        indent=4
    )


# ==========================================
# 12. SAVE RESULTS
# ==========================================

pd.DataFrame([metrics]).to_csv(
    RESULT_DIR / "metrics_v5.csv",
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
    RESULT_DIR / "confusion_matrix_v5.csv"
)

importance.to_csv(
    RESULT_DIR / "feature_importance_v5.csv",
    index=False
)

(
    RESULT_DIR / "classification_report_v5.txt"
).write_text(
    report,
    encoding="utf-8"
)

print("Model saved:", MODEL_DIR)
print("Results saved:", RESULT_DIR)

print("\n========== V5 COMPLETED ==========")
