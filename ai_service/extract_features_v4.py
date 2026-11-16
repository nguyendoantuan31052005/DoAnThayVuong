
from pathlib import Path
from urllib.parse import urlsplit
import ipaddress
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "v4"

CHUNK_SIZE = 5000

SUSPICIOUS_WORDS = [
    "login", "verify", "update",
    "secure", "account", "banking", "signin"
]

FEATURE_NAMES = [
    "url_length",
    "hostname_length",
    "query_length",
    "count_dots",
    "count_hyphens",
    "count_underscores",
    "count_questionmarks",
    "count_equals",
    "count_at",
    "count_ampersands",
    "count_digits",
    "count_percent",
    "count_www",
    "has_ip",
    "has_at",
    "has_double_slash",
    "has_https_token",
    "subdomain_count",
    "has_suspicious_word"
]


def extract_features_v4(url):
    raw = str(url).strip()

    # Chi them http:// de phan tich hostname
    # Khong tinh vao dac trung cua URL goc
    parse_url = raw

    if not raw.lower().startswith(
        ("http://", "https://")
    ):
        parse_url = "http://" + raw

    try:
        parsed = urlsplit(parse_url)
        hostname = (parsed.hostname or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""
    except ValueError:
        hostname = ""
        path = ""
        query = ""

    try:
        ipaddress.ip_address(hostname)
        has_ip = 1
    except ValueError:
        has_ip = 0

    features = {
        "url_length": len(raw),
        "hostname_length": len(hostname),
        "query_length": len(query),
        "count_dots": raw.count("."),
        "count_hyphens": raw.count("-"),
        "count_underscores": raw.count("_"),
        "count_questionmarks": raw.count("?"),
        "count_equals": raw.count("="),
        "count_at": raw.count("@"),
        "count_ampersands": raw.count("&"),
        "count_digits": sum(
            c.isdigit() for c in raw
        ),
        "count_percent": raw.count("%"),
        "count_www": raw.lower().count("www"),
        "has_ip": has_ip,
        "has_at": int("@" in raw),
        "has_double_slash": int("//" in path),
        "has_https_token": int(
            "https" in hostname
        ),
        "subdomain_count": max(
            0, len(hostname.split(".")) - 2
        ),
        "has_suspicious_word": int(
            any(
                word in hostname
                for word in SUSPICIOUS_WORDS
            )
        )
    }

    return features


def process_file(input_name, output_name):
    input_path = DATA_DIR / input_name
    output_path = DATA_DIR / output_name

    print(f"\nProcessing {input_name}...")

    total = 0
    first_chunk = True

    for chunk in pd.read_csv(
        input_path,
        chunksize=CHUNK_SIZE,
        usecols=["url", "label"]
    ):
        records = [
            extract_features_v4(url)
            for url in chunk["url"]
        ]

        features_df = pd.DataFrame(
            records,
            columns=FEATURE_NAMES
        )

        features_df["label"] = (
            chunk["label"].to_numpy()
        )

        features_df.to_csv(
            output_path,
            mode="w" if first_chunk else "a",
            header=first_chunk,
            index=False
        )

        first_chunk = False
        total += len(chunk)

        print(
            f"Processed {total:,} URLs",
            flush=True
        )

    print("Completed:", output_path)
    print("Total samples:", total)


if __name__ == "__main__":
    process_file(
        "train_urls_v4.csv",
        "train_features_v4.csv"
    )

    process_file(
        "test_urls_v4.csv",
        "test_features_v4.csv"
    )

    print("\n========== COMPLETED ==========")
    print("Feature count:", len(FEATURE_NAMES))
    print("Feature extraction finished!")
