
from pathlib import Path
from urllib.parse import urlsplit
from collections import defaultdict

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent

INPUT_FILE = BASE_DIR / "data/v4/clean_urls.csv"
RESULT_DIR = BASE_DIR / "results/v4"

RESULT_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 10000

stats = defaultdict(lambda: {
    "total": 0,
    "https": 0,
    "www": 0,
    "path": 0,
    "query": 0,
    "digits": 0,
    "url_length": 0,
    "hostname_length": 0
})

# Moi hostname duoc gan bit:
# 1 = phishing, 2 = legitimate, 3 = ca hai
hostname_labels = {}

print("Loading V4 dataset in chunks...")

total_processed = 0

for chunk in pd.read_csv(
    INPUT_FILE,
    chunksize=CHUNK_SIZE,
    usecols=["url", "label", "hostname"]
):

    for url, label, hostname in chunk.itertuples(
        index=False, name=None
    ):
        url = str(url).strip()
        label = int(label)
        hostname = str(hostname).lower()

        normalized_url = url

        if not normalized_url.lower().startswith(
            ("http://", "https://")
        ):
            normalized_url = "http://" + normalized_url

        try:
            parsed = urlsplit(normalized_url)
        except ValueError:
            continue

        s = stats[label]

        s["total"] += 1

        if parsed.scheme.lower() == "https":
            s["https"] += 1

        if hostname.startswith("www."):
            s["www"] += 1

        if parsed.path and parsed.path != "/":
            s["path"] += 1

        if parsed.query:
            s["query"] += 1

        if any(c.isdigit() for c in normalized_url):
            s["digits"] += 1

        s["url_length"] += len(normalized_url)
        s["hostname_length"] += len(hostname)

        bit = 1 if label == 0 else 2

        hostname_labels[hostname] = (
            hostname_labels.get(hostname, 0) | bit
        )

    total_processed += len(chunk)

    print(
        f"Processed {total_processed:,} URLs",
        flush=True
    )

print("\n========== V4 DATA BIAS ==========")

rows = []

for label in [0, 1]:
    s = stats[label]
    total = s["total"]

    if total == 0:
        continue

    rows.append({
        "label": (
            "Phishing" if label == 0
            else "Legitimate"
        ),
        "total_urls": total,
        "https_percent": s["https"] / total * 100,
        "www_percent": s["www"] / total * 100,
        "path_percent": s["path"] / total * 100,
        "query_percent": s["query"] / total * 100,
        "digits_percent": s["digits"] / total * 100,
        "avg_url_length": s["url_length"] / total,
        "avg_hostname_length": (
            s["hostname_length"] / total
        )
    })

summary = pd.DataFrame(rows).set_index("label")

print(summary.round(2).to_string())

summary.to_csv(
    RESULT_DIR / "data_bias_v4.csv",
    encoding="utf-8-sig"
)

phishing_hosts = sum(
    bool(value & 1)
    for value in hostname_labels.values()
)

legitimate_hosts = sum(
    bool(value & 2)
    for value in hostname_labels.values()
)

overlap = sum(
    value == 3
    for value in hostname_labels.values()
)

print("\n========== HOSTNAME CHECK ==========")

print("Phishing hostnames:", phishing_hosts)
print("Legitimate hostnames:", legitimate_hosts)
print("Overlapping hostnames:", overlap)

print("\n========== LABEL BALANCE ==========")

for label in [0, 1]:
    name = "Phishing" if label == 0 else "Legitimate"
    print(f"{name}: {stats[label]['total']}")

print("\nSaved:", RESULT_DIR / "data_bias_v4.csv")
print("Bias checking completed!")
