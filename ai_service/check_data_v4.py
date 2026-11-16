
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

FILE_PATH = BASE_DIR / "data/v3/malicious_phish.csv"

print("Loading Kaggle dataset...")

df = pd.read_csv(FILE_PATH, low_memory=False)

print("\n========== DATASET V4 ==========")

print("Tong so dong:", len(df))
print("Tong so cot:", len(df.columns))

print("\nDanh sach cot:")
print(df.columns.tolist())

print("\n5 dong dau tien:")
print(df.head().to_string(index=False))

print("\nSo gia tri thieu theo cot:")
print(df.isna().sum())

if "type" in df.columns:
    print("\n========== LABEL DISTRIBUTION ==========")
    print(df["type"].value_counts(dropna=False))

if "url" in df.columns:
    print("\n========== URL CHECK ==========")

    print("URL trung lap:", df["url"].duplicated().sum())

    print("URL rong:", df["url"].isna().sum())

    if "type" in df.columns:
        conflicting = (
            df.groupby("url")["type"]
            .nunique()
        )

        print(
            "URL co nhieu nhan khac nhau:",
            (conflicting > 1).sum()
        )

print("\nData checking completed!")
