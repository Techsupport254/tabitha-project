import pandas as pd
import json
from pathlib import Path

# Use relative to backend directory
data_dir = Path("data/processed")

def print_csv_head(filepath, n=5):
    try:
        df = pd.read_csv(filepath)
        print(f"\n--- {filepath.name} (first {n} rows) ---")
        print(df.head(n))
        print(f"Columns: {df.columns.tolist()}")
        print(f"Shape: {df.shape}")
    except Exception as e:
        print(f"Could not read {filepath.name}: {e}")

def print_json_head(filepath, n=3):
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        print(f"\n--- {filepath.name} (first {n} keys/items) ---")
        if isinstance(data, dict):
            keys = list(data.keys())
            for key in keys[:n]:
                print(f"{key}: {data[key]}")
            print(f"Total keys: {len(keys)}")
        elif isinstance(data, list):
            for item in data[:n]:
                print(item)
            print(f"Total items: {len(data)}")
        else:
            print("Unknown JSON structure")
    except Exception as e:
        print(f"Could not read {filepath.name}: {e}")

def print_file_summary(filepath):
    if filepath.suffix == ".csv":
        print_csv_head(filepath)
    elif filepath.suffix == ".json":
        print_json_head(filepath)
    else:
        print(f"{filepath.name}: (not a CSV or JSON file, skipped)")

# List all files in the processed data directory
data_dir_files = list(data_dir.glob("*"))
if not data_dir_files:
    print(f"No files found in {data_dir}")
else:
    for f in data_dir_files:
        print_file_summary(f) 