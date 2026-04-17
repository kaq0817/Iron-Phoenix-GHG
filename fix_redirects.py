import csv
import re
import sys

def fix_url(url):
    # Fix the corrupted xn--com%20%20 URLs
    if 'ourphoenixrise.xn--com%20%20' in url:
        # Extract the path after the broken domain
        after_domain = url.split('ourphoenixrise.xn--com%20%20', 1)[1]
        # Replace %20%20 (double encoded space used as /) with /
        path = after_domain.replace('%20%20', '/')
        # Strip trailing slash
        path = path.rstrip('/')
        # The last segment has a random hash suffix like -s35yra, -912tna, etc.
        # Strip trailing hash code: hyphen + 5-8 alphanumeric chars at end of last segment
        path = re.sub(r'-[a-z0-9]{5,8}$', '', path)
        return 'https://www.ourphoenixrise.com/' + path
    return url

input_file = 'redirects_export_1 (1).csv'
output_file = 'redirects_fixed.csv'

fixed = 0
with open(input_file, 'r', encoding='utf-8') as f_in, \
     open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.reader(f_in)
    writer = csv.writer(f_out)
    for row in reader:
        if len(row) == 2:
            original = row[1]
            fixed_url = fix_url(original)
            if fixed_url != original:
                fixed += 1
            writer.writerow([row[0], fixed_url])
        else:
            writer.writerow(row)

print(f"Done. Fixed {fixed} broken URLs. Output: {output_file}")
