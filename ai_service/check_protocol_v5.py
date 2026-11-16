
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data/v4/clean_urls.csv"

counts = {
    0: {"https": 0, "http": 0, "missing": 0},
    1: {"https": 0, "http": 0, "missing": 0}
}

print("Checking URL protocols...")

for chunk in pd.read_csv(
    INPUT_FILE,
    usecols=["url", "label"],
    chunksize=10000
):
    for url, label in chunk.itertuples(
        index=False, name=None
    ):
        url = str(url).strip().lower()
        label = int(label)

        if url.startswith("https://"):
            counts[label]["https"] += 1

        elif url.startswith("http://"):
            counts[label]["http"] += 1

        else:
            counts[label]["missing"] += 1

print("\n========== PROTOCOL ANALYSIS ==========")

for label in [0, 1]:
    name = "PHISHING" if label == 0 else "LEGITIMATE"

    data = counts[label]
    total = sum(data.values())

    print(f"\n{name}")
    print("Total:", total)

    for protocol, count in data.items():
        percent = count / total * 100

        print(
            f"{protocol}: {count:,} ({percent:.2f}%)"
        )

print("\nProtocol analysis completed!")
