import re
import sys
import codecs

# Tables to keep (Vietnamese-named)
tables_to_keep = [
    'CauHoi', 'CauTraLoi', 'Phan', 'MonHoc', 'Khoa',
    'DeThi', 'ChiTietDeThi', 'YeuCauRutTrich',
    'CLO', 'Files', 'User'  # These don't have duplicates
]

# Tables to remove (English-named)
tables_to_remove = [
    'Questions', 'Answers', 'Sections', 'Subjects',
    'Departments', 'Exams', 'ExamQuestions', 'ExtractionRequests'
]

# Stored procedures to remove
stored_procs_to_remove = []
for table in tables_to_remove:
    stored_procs_to_remove.extend([
        f"{table}_SelectAll", f"{table}_SelectOne", f"{table}_Update",
        f"{table}_Insert", f"{table}_Delete", f"{table}_GetCount",
        f"{table}_SelectPage", f"{table}_FlagAsDeleted", f"{table}_Restore",
        f"{table}_SelectBy"
    ])


def read_file_with_encoding(file_path):
    """Try different encodings to read the file"""
    encodings = ['utf-8', 'utf-16', 'utf-16-le',
                 'utf-16-be', 'latin-1', 'cp1252']

    for encoding in encodings:
        try:
            with codecs.open(file_path, 'r', encoding=encoding) as f:
                return f.read(), encoding
        except UnicodeDecodeError:
            continue

    raise ValueError(
        f"Could not read file {file_path} with any of the tried encodings")


def clean_sql_file(input_file, output_file):
    try:
        sql_content, encoding = read_file_with_encoding(input_file)
        print(f"Successfully read file with encoding: {encoding}")

        # Remove CREATE TABLE statements for tables to remove
        for table in tables_to_remove:
            pattern = r"/\*\*\*\*\*\* Object:  Table \[dbo\]\.\[" + \
                table + r"\].*?GO\n"
            sql_content = re.sub(pattern, "", sql_content, flags=re.DOTALL)

        # Remove ALTER TABLE statements for tables to remove
        for table in tables_to_remove:
            pattern = r"ALTER TABLE \[dbo\]\.\[" + table + r"\].*?GO\n"
            sql_content = re.sub(pattern, "", sql_content, flags=re.DOTALL)

        # Remove Foreign Key constraints that reference tables to remove
        for table in tables_to_remove:
            pattern = r"ALTER TABLE.*?CONSTRAINT \[FK_.*?" + table + r".*?GO\n"
            sql_content = re.sub(pattern, "", sql_content, flags=re.DOTALL)

        # Remove stored procedures that reference tables to remove
        for proc in stored_procs_to_remove:
            pattern = r"/\*\*\*\*\*\* Object:  StoredProcedure \[dbo\]\.\[" + \
                proc + r".*?GO\n"
            sql_content = re.sub(pattern, "", sql_content, flags=re.DOTALL)

        with codecs.open(output_file, 'w', encoding=encoding) as f:
            f.write(sql_content)

        print(f"Database SQL file cleaned and saved to {output_file}")
    except Exception as e:
        print(f"Error processing file: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python clean_database.py input_file.sql output_file.sql")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    clean_sql_file(input_file, output_file)
