
from pathlib import Path
from urllib.parse import urlsplit
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data/v3/malicious_phish.csv"
OUTPUT_DIR = BASE_DIR / "data/v4"
OUTPUT_FILE = OUTPUT_DIR / "clean_urls.csv"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading Kaggle dataset...")
df = pd.read_csv(INPUT_FILE, low_memory=False)

# 1. Chon benign va phishing
df = df[df["type"].isin(["benign", "phishing"])].copy()

print("Rows after filtering:", len(df))

# 2. Chuan hoa khoang trang
df["url"] = df["url"].astype(str).str.strip()

# 3. Loai URL rong
df = df[df["url"] != ""].copy()

# 4. Tim URL co nhan mau thuan
conflicts = (
    df.groupby("url")["type"]
    .nunique()
)

conflicting_urls = set(
    conflicts[conflicts > 1].index
)

print("Conflicting URLs:", len(conflicting_urls))

# Loai tat ca URL co nhan mau thuan
df = df[
    ~df["url"].isin(conflicting_urls)
].copy()

# 5. Loai URL trung lap cung nhan
df = df.drop_duplicates(subset=["url"])

# 6. Chuyen nhan ve 0 va 1
df["label"] = df["type"].map({
    "phishing": 0,
    "benign": 1
})

# 7. Lay hostname
def get_hostname(url):
    try:
        value = str(url).strip()

        if not value.lower().startswith(
            ("http://", "https://")
        ):
            value = "http://" + value

        return (urlsplit(value).hostname or "").lower()
    except ValueError:
        return ""

df["hostname"] = df["url"].apply(get_hostname)

# Loai URL khong lay duoc hostname
invalid_count = (df["hostname"] == "").sum()

print("Invalid hostname:", invalid_count)

df = df[df["hostname"] != ""].copy()

# 8. Luu file
df = df[["url", "label", "hostname"]]

df.to_csv(
    OUTPUT_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\n========== CLEAN DATA V4 ==========")
print("Total URLs:", len(df))
print("Unique hostnames:", df["hostname"].nunique())

print("\nLabel distribution:")
print(df["label"].value_counts())

print("\nDuplicate URLs:", df["url"].duplicated().sum())

print("\nSaved:", OUTPUT_FILE)
print("Data preparation completed!")
