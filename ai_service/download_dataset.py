
import pandas as pd
from ucimlrepo import fetch_ucirepo
from pathlib import Path

print("Dang tai dataset PhiUSIIL...")

# Tai dataset tu UCI
dataset = fetch_ucirepo(id=967)

# Lay URL va nhan
features = dataset.data.features
targets = dataset.data.targets

df = pd.DataFrame({
    "url": features["URL"],
    "label": targets.iloc[:, 0]
})

# Lam sach du lieu
df = df.dropna(subset=["url", "label"])
df["url"] = df["url"].astype(str).str.strip()
df["label"] = pd.to_numeric(df["label"], errors="coerce")

df = df.dropna(subset=["label"])
df = df[df["label"].isin([0, 1])]

# Loai bo URL trung lap
df = df.drop_duplicates(subset=["url"])

# Luu du lieu
output = Path("data/raw/phiusiil_urls.csv")
output.parent.mkdir(parents=True, exist_ok=True)

df.to_csv(output, index=False, encoding="utf-8")

print("\n========== KET QUA ==========")
print("Tong so URL:", len(df))
print("\nPhan bo nhan:")
print("0 = Phishing")
print("1 = Legitimate")
print(df["label"].value_counts())
print("\nDa luu tai:", output)
