
import joblib
import shap
import pandas as pd
import matplotlib.pyplot as plt

from pathlib import Path

# ==========================================
# 1. CAU HINH DUONG DAN
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "best_model.pkl"
FEATURE_PATH = BASE_DIR / "models" / "feature_names.pkl"
DATA_PATH = BASE_DIR / "data" / "processed" / "url_features.csv"
RESULT_DIR = BASE_DIR / "results"

RESULT_DIR.mkdir(exist_ok=True)

# ==========================================
# 2. LOAD MODEL VA DU LIEU
# ==========================================

print("Loading Random Forest model...")

model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURE_PATH)

df = pd.read_csv(DATA_PATH)

if "label" not in df.columns:
    raise ValueError("Khong tim thay cot label trong dataset.")

# Dong bo dung 23 dac trung
X = df.reindex(columns=feature_names, fill_value=0)
X = X.apply(pd.to_numeric, errors="raise")

y = pd.to_numeric(df["label"], errors="raise").astype(int)

# Kiem tra nhan
classes = list(model.classes_)

if 0 not in classes or 1 not in classes:
    raise ValueError(f"Nhan model khong dung mong doi: {classes}")

phishing_index = classes.index(0)

print("Model:", type(model).__name__)
print("Features:", len(feature_names))
print("Classes:", classes)

# ==========================================
# 3. CHON DU LIEU PHAN TICH
# ==========================================

# Lay toi da 250 mau moi lop
samples = []

for label in [0, 1]:
    group = df.index[y == label]

    if len(group) == 0:
        raise ValueError(f"Dataset khong co mau label {label}")

    selected = pd.Series(group).sample(
        n=min(250, len(group)),
        random_state=42
    ).tolist()

    samples.extend(selected)

X_sample = X.loc[samples].reset_index(drop=True)
y_sample = y.loc[samples].reset_index(drop=True)

print("So URL phan tich:", len(X_sample))

# ==========================================
# 4. TAO SHAP EXPLAINER
# ==========================================

print("\nCreating SHAP TreeExplainer...")

explainer = shap.TreeExplainer(model)

print("Calculating SHAP values...")

raw_shap = explainer(X_sample)

# SHAP moi co dang:
# (samples, features, classes)
# Xu ly ca truong hop SHAP cu

if isinstance(raw_shap.values, list):
    values = raw_shap.values[phishing_index]
    base_values = raw_shap.base_values

    if isinstance(base_values, list):
        base_values = base_values[phishing_index]

elif raw_shap.values.ndim == 3:
    values = raw_shap.values[:, :, phishing_index]

    base_values = raw_shap.base_values

    if getattr(base_values, "ndim", 0) == 2:
        base_values = base_values[:, phishing_index]

else:
    values = raw_shap.values
    base_values = raw_shap.base_values

shap_exp = shap.Explanation(
    values=values,
    base_values=base_values,
    data=X_sample.to_numpy(),
    feature_names=feature_names
)

print("SHAP calculation completed!")

# ==========================================
# 5. SHAP SUMMARY PLOT
# ==========================================

print("\nCreating SHAP Summary Plot...")

plt.figure(figsize=(12, 8))

shap.plots.beeswarm(
    shap_exp,
    max_display=20,
    show=False
)

plt.title(
    "SHAP Summary Plot - Random Forest",
    fontsize=14
)

plt.tight_layout()

plt.savefig(
    RESULT_DIR / "shap_summary.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ==========================================
# 6. CHON URL PHISHING VA LEGITIMATE
# ==========================================

predictions = model.predict(X_sample)

# Tim mau duoc du doan dung
phishing_candidates = [
    i for i in range(len(y_sample))
    if y_sample.iloc[i] == 0 and predictions[i] == 0
]

legitimate_candidates = [
    i for i in range(len(y_sample))
    if y_sample.iloc[i] == 1 and predictions[i] == 1
]

if not phishing_candidates:
    raise ValueError("Khong tim thay mau Phishing du doan dung.")

if not legitimate_candidates:
    raise ValueError("Khong tim thay mau Legitimate du doan dung.")

phishing_pos = phishing_candidates[0]
legitimate_pos = legitimate_candidates[0]

# ==========================================
# 7. WATERFALL - PHISHING
# ==========================================

print("Creating Phishing Waterfall...")

plt.figure(figsize=(12, 8))

shap.plots.waterfall(
    shap_exp[phishing_pos],
    max_display=15,
    show=False
)

plt.title(
    "SHAP Waterfall - Phishing",
    fontsize=14
)

plt.tight_layout()

plt.savefig(
    RESULT_DIR / "shap_phishing.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ==========================================
# 8. WATERFALL - LEGITIMATE
# ==========================================

print("Creating Legitimate Waterfall...")

plt.figure(figsize=(12, 8))

shap.plots.waterfall(
    shap_exp[legitimate_pos],
    max_display=15,
    show=False
)

plt.title(
    "SHAP Waterfall - Legitimate",
    fontsize=14
)

plt.tight_layout()

plt.savefig(
    RESULT_DIR / "shap_legitimate.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# ==========================================
# 9. XUAT BANG SHAP CSV
# ==========================================

records = []

for pos, label_name in [
    (phishing_pos, "Phishing"),
    (legitimate_pos, "Legitimate")
]:

    for j, feature in enumerate(feature_names):

        records.append({
            "Sample": label_name,
            "Feature": feature,
            "Feature_Value": X_sample.iloc[pos, j],
            "SHAP_Phishing": values[pos, j]
        })

shap_df = pd.DataFrame(records)

shap_df.to_csv(
    RESULT_DIR / "shap_values.csv",
    index=False
)

# ==========================================
# 10. KET QUA
# ==========================================

print("\n===================================")
print("SHAP ANALYSIS COMPLETED!")
print("===================================")

print("SHAP Summary: results/shap_summary.png")
print("Phishing:     results/shap_phishing.png")
print("Legitimate:   results/shap_legitimate.png")
print("CSV:          results/shap_values.csv")

print("\nPhishing sample prediction:")
print("Actual label:", y_sample.iloc[phishing_pos])
print("Predicted:", predictions[phishing_pos])

print("\nLegitimate sample prediction:")
print("Actual label:", y_sample.iloc[legitimate_pos])
print("Predicted:", predictions[legitimate_pos])
