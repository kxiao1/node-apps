from markdownify import markdownify as md
import json
from datetime import datetime

def read_and_process_json(input_file, output_file):
    # Read the JSON file
    with open(input_file, 'r') as f:
        data = json.load(f)

    # Create a dictionary to store entries by id, preferring those with richtext_body
    entries_by_id = {}
    for item in data:
        item_id = item.get("id", "")
        if item_id in entries_by_id:
            # If current item has richtext_body, replace the existing entry
            if item.get("richtext_body", "").strip():
                entries_by_id[item_id] = item
        else:
            entries_by_id[item_id] = item

    # Get the deduplicated entries
    deduplicated_data = list(entries_by_id.values())

    # Sort the data in reverse date order
    deduplicated_data.sort(key=lambda x: datetime.strptime(x['created_at'], '%Y-%m-%dT%H:%M:%SZ'), reverse=True)

    # Write the processed data to the output file
    with open(output_file, 'w') as f:
        f.write("# Penzu Entries\n\n")
        for item in deduplicated_data:
            date_str = datetime.strptime(item.get("created_at", ""), '%Y-%m-%dT%H:%M:%SZ').strftime('%Y-%m-%d %H:%M:%S')
            title = item.get("title", "")
            richtext_body = item.get("richtext_body", "")
            plaintext_body = item.get("plaintext", "")
            item_id = item.get("id", "")
            
            # Use richtext_body if available and contains non-whitespace characters, otherwise use plaintext_body
            if richtext_body and richtext_body.strip():
                markdown_body = md(richtext_body).strip()
            else:
                markdown_body = plaintext_body.strip()
            
            if title:
                f.write(f"**{date_str} {title}**\n")
            else:
                f.write(f"**{date_str}**\n")
            
            f.write(f"Penzu ID: {item_id}\n\n")
            f.write(f"{markdown_body}\n")
            f.write("\n")

if __name__ == "__main__":
    input_file = 'out.json'
    output_file = 'out.md'
    read_and_process_json(input_file, output_file)