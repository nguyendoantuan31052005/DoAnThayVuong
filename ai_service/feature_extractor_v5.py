
from urllib.parse import urlsplit
import ipaddress

SUSPICIOUS_WORDS = [
    "login",
    "verify",
    "update",
    "secure",
    "account",
    "banking",
    "signin"
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


def extract_features_v5(url):
    raw = str(url).strip()

    # 1. Loai bo giao thuc khoi chuoi phan tich
    normalized = raw

    if raw.lower().startswith("https://"):
        normalized = raw[8:]

    elif raw.lower().startswith("http://"):
        normalized = raw[7:]

    # 2. Chuan hoa dau / o duong dan goc
    try:
        parsed_check = urlsplit(
            "http://" + normalized
        )

        if (
            parsed_check.path == "/"
            and not parsed_check.query
            and not parsed_check.fragment
            and normalized.endswith("/")
        ):
            normalized = normalized[:-1]

    except ValueError:
        pass

    # 3. Phan tich hostname, path va query
    try:
        parsed = urlsplit(
            "http://" + normalized
        )

        hostname = (
            parsed.hostname or ""
        ).lower()

        path = parsed.path or ""
        query = parsed.query or ""

    except ValueError:
        hostname = ""
        path = ""
        query = ""

    # 4. Kiem tra hostname co phai IP
    try:
        ipaddress.ip_address(hostname)
        has_ip = 1

    except ValueError:
        has_ip = 0

    # 5. Trich xuat 19 dac trung
    features = {
        "url_length": len(normalized),

        "hostname_length": len(hostname),

        "query_length": len(query),

        "count_dots": normalized.count("."),

        "count_hyphens": normalized.count("-"),

        "count_underscores": normalized.count("_"),

        "count_questionmarks": normalized.count("?"),

        "count_equals": normalized.count("="),

        "count_at": normalized.count("@"),

        "count_ampersands": normalized.count("&"),

        "count_digits": sum(
            c.isdigit() for c in normalized
        ),

        "count_percent": normalized.count("%"),

        "count_www": normalized.lower().count("www"),

        "has_ip": has_ip,

        "has_at": int("@" in normalized),

        "has_double_slash": int(
            "//" in path
        ),

        "has_https_token": int(
            "https" in hostname
        ),

        "subdomain_count": max(
            0,
            len(hostname.split(".")) - 2
        ) if hostname else 0,

        "has_suspicious_word": int(
            any(
                word in hostname
                for word in SUSPICIOUS_WORDS
            )
        )
    }

    return features
