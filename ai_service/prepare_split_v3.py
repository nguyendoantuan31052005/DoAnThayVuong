
from pathlib import Path
from urllib.parse import urlsplit

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from feature_extractor import extract_features

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data/raw/phiusiil_urls.csv"
OUTPUT_DIR = BASE_DIR / "data/v3"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)

def get_hostname(url):
    url = str(url).strip()

    if not url.startswith(("http://", "https://")):
        url = "http://" + url

    try:
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""

df["hostname"] = df["url"].apply(get_hostname)

if (df["hostname"] == "").any():
    raise ValueError("Co URL khong lay duoc hostname")

print("Extracting features...")

features = pd.DataFrame(
    [extract_features(url) for url in df["url"]]
)

features["label"] = df["label"].to_numpy()
features["hostname"] = df["hostname"].to_numpy()

print("Splitting by hostname...")

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(
        features,
        features["label"],
        groups=features["hostname"]
    )
)

train_df = features.iloc[train_idx].copy()
test_df = features.iloc[test_idx].copy()

# Kiem tra hostname khong trung giua hai tap
train_hosts = set(train_df["hostname"])
test_hosts = set(test_df["hostname"])

overlap = train_hosts & test_hosts

assert len(overlap) == 0, "Hostname bi trung!"

train_df.to_csv(
    OUTPUT_DIR / "train_v3.csv",
    index=False,
    encoding="utf-8-sig"
)

test_df.to_csv(
    OUTPUT_DIR / "test_v3.csv",
    index=False,
    encoding="utf-8-sig"
)

print("\n========== V3 DATA SPLIT ==========")
print("Train samples:", len(train_df))
print("Test samples:", len(test_df))
print("Train hostnames:", len(train_hosts))
print("Test hostnames:", len(test_hosts))
print("Overlapping hostnames:", len(overlap))

print("\nTrain label distribution:")
print(train_df["label"].value_counts())

print("\nTest label distribution:")
print(test_df["label"].value_counts())

print("\nSaved:")
print(OUTPUT_DIR / "train_v3.csv")
print(OUTPUT_DIR / "test_v3.csv")
