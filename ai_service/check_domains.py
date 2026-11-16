
import pandas as pd
from urllib.parse import urlsplit

df = pd.read_csv("data/raw/phiusiil_urls.csv")

def get_hostname(url):
    try:
        url = str(url).strip()
        if not url.startswith(("http://", "https://")):
            url = "http://" + url
        return (urlsplit(url).hostname or "").lower()
    except ValueError:
        return ""

df["hostname"] = df["url"].apply(get_hostname)

phishing = set(df[df["label"] == 0]["hostname"])
legitimate = set(df[df["label"] == 1]["hostname"])

phishing.discard("")
legitimate.discard("")

overlap = phishing & legitimate

print("Tong URL:", len(df))
print("Hostname Phishing:", len(phishing))
print("Hostname Legitimate:", len(legitimate))
print("Hostname xuat hien o ca hai nhan:", len(overlap))

print("\nVi du hostname trung nhan:")
for hostname in sorted(overlap)[:10]:
    print(hostname)

print("\nSo URL khong lay duoc hostname:",
      (df["hostname"] == "").sum())
