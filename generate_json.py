import re
import json
import os

def parse_fru_file(filename):
    """Parse a single FRU text file and return list of entries."""
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    model = os.path.splitext(os.path.basename(filename))[0]  # X240, X250, etc.
    entries = []
    current_category = "General"  # default

    # Regular expression for a data line: FRU PN, CRU ID, Description
    # Matches like "45N0254 1 Common Delta 65W 3pin AC Adapter"
    data_pattern = re.compile(r'^([A-Z0-9-]+)\s+([0-9N]+)\s+(.+)$')

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Detect category headers: all uppercase, no spaces? Actually may have spaces
        # We'll consider lines that are uppercase and not matching the data pattern
        if stripped.isupper() or (stripped.upper() == stripped and not data_pattern.match(stripped)):
            current_category = stripped
            continue

        # Try to match a data line
        match = data_pattern.match(stripped)
        if match:
            fru_pn = match.group(1)
            cru_id = match.group(2)
            description = match.group(3).strip()
            entries.append({
                "fru_pn": fru_pn,
                "cru_id": cru_id,
                "description": description,
                "model": model,
                "category": current_category
            })
    return entries

def main():
    files = ["X240.txt", "X250.txt", "X260.txt", "X270.txt"]
    all_parts = []
    for fname in files:
        if os.path.exists(fname):
            print(f"Parsing {fname}...")
            all_parts.extend(parse_fru_file(fname))
        else:
            print(f"Warning: {fname} not found, skipping.")

    with open("fru_parts_combined.json", "w", encoding="utf-8") as out:
        json.dump(all_parts, out, indent=2, ensure_ascii=False)

    print(f"Done. {len(all_parts)} parts written to fru_parts_combined.json")

if __name__ == "__main__":
    main()