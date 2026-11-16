
import joblib
import matplotlib.pyplot as plt
import pandas as pd
from pathlib import Path

# 1. Load model và feature names
model = joblib.load("models/best_model.pkl")
feature_names = joblib.load("models/feature_names.pkl")

# 2. Tính Feature Importance
importance = model.feature_importances_

df = pd.DataFrame({
    "Feature": feature_names,
    "Importance": importance
})

df = df.sort_values(
    by="Importance",
    ascending=False
)

# 3. Tạo thư mục results
Path("results").mkdir(exist_ok=True)

# 4. Lưu bảng kết quả
df.to_csv(
    "results/feature_importance.csv",
    index=False
)

# 5. Vẽ biểu đồ Top 10
top10 = df.head(10).sort_values(
    by="Importance",
    ascending=True
)

plt.figure(figsize=(12, 7))

plt.barh(
    top10["Feature"],
    top10["Importance"]
)

plt.xlabel("Feature Importance")
plt.ylabel("Features")
plt.title("Top 10 Feature Importance - Random Forest")

plt.tight_layout()

# 6. Lưu biểu đồ
plt.savefig(
    "results/feature_importance_top10.png",
    dpi=300,
    bbox_inches="tight"
)

plt.show()

print("FEATURE IMPORTANCE COMPLETED!")
print("Saved: results/feature_importance.csv")
print("Saved: results/feature_importance_top10.png")
print("\nTOP 10 FEATURES:")
print(df.head(10).to_string(index=False))
