import json
import urllib.request
from pathlib import Path

BULK_DATA_URL = "https://api.scryfall.com/bulk-data"
OUTPUT_FILE = Path("public/cards.jsonl.gz")

HEADERS = {
    "User-Agent": "Upkeep/1.0",
    "Accept": "application/json",
}

def main():
    request = urllib.request.Request(BULK_DATA_URL, headers=HEADERS)

    with urllib.request.urlopen(request) as response:
        bulk_data = json.loads(response.read())

    oracle_cards = next(
        item for item in bulk_data["data"]
        if item["type"] == "oracle_cards"
    )

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    print("Downloading card data...")

    request = urllib.request.Request(
        oracle_cards["jsonl_download_uri"],
        headers=HEADERS
    )

    with urllib.request.urlopen(request) as response:
        with OUTPUT_FILE.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)

    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
