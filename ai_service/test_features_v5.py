
from feature_extractor_v5 import extract_features_v5

test_urls = [
    "https://www.google.com",
    "http://www.google.com",
    "www.google.com",
    "https://www.google.com/",
    "https://github.com",
    "http://github.com",
    "github.com"
]

print("\n========== V5 FEATURE TEST ==========")

results = []

for url in test_urls:
    features = extract_features_v5(url)

    results.append((url, features))

    print("\nURL:", url)
    print("URL length:", features["url_length"])
    print("Hostname length:", features["hostname_length"])
    print("WWW count:", features["count_www"])

print("\n========== CONSISTENCY CHECK ==========")

google_features = [
    extract_features_v5(url)
    for url in test_urls[:3]
]

github_features = [
    extract_features_v5(url)
    for url in test_urls[4:]
]

print(
    "Google protocols identical:",
    google_features[0]
    == google_features[1]
    == google_features[2]
)

print(
    "GitHub protocols identical:",
    github_features[0]
    == github_features[1]
    == github_features[2]
)

print(
    "Google slash identical:",
    extract_features_v5(
        "https://www.google.com"
    )
    == extract_features_v5(
        "https://www.google.com/"
    )
)

print("\nFeature consistency test completed!")
