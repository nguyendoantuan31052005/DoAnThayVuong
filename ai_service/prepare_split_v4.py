
from pathlib import Path

import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data/v4"
INPUT_FILE = DATA_DIR / "clean_urls.csv"

print("Loading cleaned V4 dataset...")

df = pd.read_csv(
    INPUT_FILE,
    usecols=["url", "label", "hostname"]
)

print("Total URLs:", len(df))
print("Unique hostnames:", df["hostname"].nunique())

print("\nSplitting by hostname...")

splitter = GroupShuffleSplit(
    n_splits=1,
    test_size=0.2,
    random_state=42
)

train_idx, test_idx = next(
    splitter.split(
        df,
        df["label"],
        groups=df["hostname"]
    )
)

train_df = df.iloc[train_idx].copy()
test_df = df.iloc[test_idx].copy()

train_hosts = set(train_df["hostname"])
test_hosts = set(test_df["hostname"])

overlap = train_hosts & test_hosts

assert len(overlap) == 0, "Hostname overlap detected!"

TRAIN_FILE = DATA_DIR / "train_urls_v4.csv"
TEST_FILE = DATA_DIR / "test_urls_v4.csv"

train_df.to_csv(
    TRAIN_FILE,
    index=False,
    encoding="utf-8-sig"
)

test_df.to_csv(
    TEST_FILE,
    index=False,
    encoding="utf-8-sig"
)

print("\n========== V4 DATA SPLIT ==========")

print("Train samples:", len(train_df))
print("Test samples:", len(test_df))

print("Train hostnames:", len(train_hosts))
print("Test hostnames:", len(test_hosts))

print("Overlapping hostnames:", len(overlap))

print("\nTrain label distribution:")
print(train_df["label"].value_counts())

print("\nTest label distribution:")
print(test_df["label"].value_counts())

print("\nTrain label percentage:")
print(
    (train_df["label"].value_counts(normalize=True) * 100)
    .round(2)
)

print("\nTest label percentage:")
print(
    (test_df["label"].value_counts(normalize=True) * 100)
    .round(2)
)

print("\nSaved:")
print(TRAIN_FILE)
print(TEST_FILE)

print("\nV4 data split completed!")
