#!/usr/bin/env python3
import sys
import json

merged = {}

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        record = json.loads(line)
    except json.JSONDecodeError:
        continue
    for key, data in record.items():
        if key not in merged:
            merged[key] = data
        else:
            # Merge inner dictionaries.
            for inner_key, inner_value in data.items():
                if inner_key in merged[key]:
                    # Update the inner dictionary if both are dicts,
                    # otherwise override.
                    if isinstance(merged[key][inner_key], dict) and isinstance(inner_value, dict):
                        merged[key][inner_key].update(inner_value)
                    else:
                        merged[key][inner_key] = inner_value
                else:
                    merged[key][inner_key] = inner_value

# Output each merged JSON object as a separate line.
for key, data in merged.items():
    print(json.dumps({key: data}))