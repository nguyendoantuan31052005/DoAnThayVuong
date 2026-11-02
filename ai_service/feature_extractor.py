
import re
import math
import ipaddress
from urllib.parse import urlparse

import pandas as pd


def extract_features(url):
    url = str(url).strip()

    if not url.startswith(("http://", "https://")):
        url = "http://" + url

    parsed = urlparse(url)

    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""

    try:
        ipaddress.ip_address(hostname)
        has_ip = 1
    except ValueError:
        has_ip = 0

    features = {
        "url_length": len(url),
        "hostname_length": len(hostname),
        "path_length": len(path),
        "query_length": len(query),
        "count_dots": url.count("."),
        "count_hyphens": url.count("-"),
        "count_underscores": url.count("_"),
        "count_slashes": url.count("/"),
        "count_questionmarks": url.count("?"),
        "count_equals": url.count("="),
        "count_at": url.count("@"),
        "count_ampersands": url.count("&"),
        "count_digits": sum(c.isdigit() for c in url),
        "count_percent": url.count("%"),
        "count_www": url.lower().count("www"),
        "count_https": int(parsed.scheme == "https"),
        "count_http": int(parsed.scheme == "http"),
        "has_ip": has_ip,
        "has_at": int("@" in url),
        "has_double_slash": int("//" in parsed.path),
        "has_https_token": int("https" in hostname.lower()),
        "subdomain_count": max(0, len(hostname.split(".")) - 2),
        "has_suspicious_word": int(
            any(word in hostname.lower() for word in [
                "login", "verify", "update", "secure",
                "account", "banking", "signin"
            ])
        ),
    }

    return features


def create_feature_dataset(input_file, output_file):
    df = pd.read_csv(input_file)

    X = pd.DataFrame(
        df["url"].apply(extract_features).tolist()
    )

    result = pd.concat(
        [X, df["label"].reset_index(drop=True)],
        axis=1
    )

    result.to_csv(output_file, index=False)

    print("Da trich xuat dac trung thanh cong!")
    print("So dong:", len(result))
    print("So dac trung:", len(X.columns))
    print(result.head())


if __name__ == "__main__":
    create_feature_dataset(
        "data/raw/phiusiil_urls.csv",
        "data/processed/url_features.csv"
    )
