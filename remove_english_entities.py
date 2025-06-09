import os
import shutil

# Files to delete
english_files = [
    "backend/src/entities/questions.entity.ts",
    "backend/src/entities/answers.entity.ts",
    "backend/src/entities/sections.entity.ts",
    "backend/src/entities/subjects.entity.ts",
    "backend/src/entities/departments.entity.ts",
    "backend/src/entities/exams.entity.ts",
    "backend/src/entities/exam-questions.entity.ts",
    "backend/src/entities/extraction-requests.entity.ts"
]

# Modules to delete
english_modules = [
    "backend/src/modules/departments"
]


def remove_files():
    """Remove English-named entity files"""
    for file_path in english_files:
        if os.path.exists(file_path):
            print(f"Removing file: {file_path}")
            os.remove(file_path)
        else:
            print(f"File not found: {file_path}")

    for module_path in english_modules:
        if os.path.exists(module_path):
            print(f"Removing directory: {module_path}")
            shutil.rmtree(module_path)
        else:
            print(f"Directory not found: {module_path}")


if __name__ == "__main__":
    remove_files()
    print("Completed removing English-named entity files and modules")
