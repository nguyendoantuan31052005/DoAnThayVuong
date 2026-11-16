
from pathlib import Path
import pandas as pd

from feature_extractor_v5 import (
    extract_features_v5,
    FEATURE_NAMES
)

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data" / "v5"
SOURCE_DIR = BASE_DIR / "data" / "v4"

DATA_DIR.mkdir(parents=True, exist_ok=True)

CHUNK_SIZE = 5000


def process_dataset(input_file, output_file):
    input_path = SOURCE_DIR / input_file
    output_path = DATA_DIR / output_file

    print(f"\nProcessing: {input_file}")

    total = 0
    first_chunk = True

    for chunk in pd.read_csv(
        input_path,
        usecols=["url", "label"],
        chunksize=CHUNK_SIZE,
        keep_default_na=False
    ):
        features = [
            extract_features_v5(url)
            for url in chunk["url"]
        ]

        feature_df = pd.DataFrame(
            features,
            columns=FEATURE_NAMES
        )

        feature_df["label"] = (
            chunk["label"].to_numpy()
        )

        feature_df.to_csv(
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

    print(f"Completed: {output_path}")
    print(f"Total samples: {total:,}")


if __name__ == "__main__":
    print("========== V5 FEATURE EXTRACTION ==========")

    process_dataset(
        "train_urls_v4.csv",
        "train_features_v5.csv"
    )

    process_dataset(
        "test_urls_v4.csv",
        "test_features_v5.csv"
    )

    print("\n========== COMPLETED ==========")
    print("Feature count:", len(FEATURE_NAMES))
    print("V5 feature extraction completed!")
