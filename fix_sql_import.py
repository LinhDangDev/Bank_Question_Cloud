import re
import os
import sys


def fix_sql_file(input_filepath, output_filepath):
    """
    Reads an SQL file, fixes common errors using a line-by-line processing approach, and writes to a new file.
    """
    print(f"Reading from: {input_filepath}")
    print(f"Writing to: {output_filepath}")

    try:
        with open(input_filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_filepath}")
        return

    fixed_lines = []
    in_cauhoi_insert = False
    current_statement = ""
    seen_pks = set()

    statements_fixed = 0
    duplicates_skipped = 0
    mismatch_skipped = 0

    for line in lines:
        stripped_line = line.strip()

        if stripped_line.startswith('INSERT [dbo].[CauHoi]'):
            in_cauhoi_insert = True
            current_statement = line
            continue

        if in_cauhoi_insert:
            current_statement += line
            if stripped_line.endswith(')'):  # End of VALUES
                # Process the accumulated statement

                # Extract columns and values
                try:
                    columns_part = re.search(
                        r'\((.*?)\)', current_statement, re.DOTALL).group(1)
                    values_part = re.search(
                        r'VALUES\s*\((.*)\)', current_statement, re.DOTALL).group(1)

                    num_columns = len([c.strip()
                                      for c in columns_part.split(',')])

                    # Split values carefully
                    values = re.findall(r"N'(?:''|[^'])*'|[^,]+", values_part)
                    values = [v.strip() for v in values if v.strip()]

                    if len(values) != num_columns:
                        mismatch_skipped += 1
                        print(
                            f"Column count mismatch. Expected {num_columns}, got {len(values)}. Skipping statement.")
                        # append original
                        fixed_lines.append(current_statement)
                        in_cauhoi_insert = False
                        current_statement = ""
                        continue

                    # Check for duplicate PK
                    pk = values[0]
                    if pk in seen_pks:
                        duplicates_skipped += 1
                        print(f"Skipping duplicate PK: {pk}")
                        in_cauhoi_insert = False
                        current_statement = ""
                        continue
                    seen_pks.add(pk)

                    # Fix quotes
                    fixed_values = []
                    for v in values:
                        if v.upper().startswith("N'"):
                            inner_content = v[2:-1]
                            fixed_inner = inner_content.replace("'", "''")
                            fixed_values.append(f"N'{fixed_inner}'")
                        else:
                            fixed_values.append(v)

                    new_values_str = ", ".join(fixed_values)

                    # Rebuild the statement
                    prefix = re.search(
                        r'(INSERT .*? VALUES\s*)\(', current_statement, re.DOTALL).group(1)
                    fixed_statement = f"{prefix}({new_values_str})\n"
                    fixed_lines.append(fixed_statement)
                    statements_fixed += 1

                except AttributeError:
                    print(
                        f"Could not parse statement, keeping original: {current_statement[:100]}...")
                    fixed_lines.append(current_statement)

                in_cauhoi_insert = False
                current_statement = ""
            # If not end of statement, continue accumulating
        else:
            fixed_lines.append(line)

    final_sql = "".join(fixed_lines)

    try:
        with open(output_filepath, 'w', encoding='utf-8') as f:
            f.write(final_sql)
        print(f"\n--- FIX COMPLETE ---")
        print(f"Successfully saved to {output_filepath}")
        print(f"Statements fixed: {statements_fixed}")
        print(f"Duplicate PKs skipped: {duplicates_skipped}")
        print(f"Mismatched column count skipped: {mismatch_skipped}")
    except IOError as e:
        print(f"Error: Could not write to output file. Reason: {e}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python fix_sql_import.py <input_sql_path> <output_sql_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # Make sure paths are correct
    if not os.path.isabs(input_path):
        input_path = os.path.join(os.getcwd(), input_path)
    if not os.path.isabs(output_path):
        output_path = os.path.join(os.getcwd(), output_path)

    fix_sql_file(input_path, output_path)
