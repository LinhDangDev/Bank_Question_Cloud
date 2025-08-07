import pyodbc
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file


def load_env_vars():
    # Try to load environment from backend .env.production file
    if os.path.exists('./backend/.env.production'):
        load_dotenv('./backend/.env.production')
        print("Loaded environment from backend/.env.production")
    # Fallback to backend .env.example file
    elif os.path.exists('./backend/.env.example'):
        load_dotenv('./backend/.env.example')
        print("Loaded environment from backend/.env.example")
    else:
        print("No .env files found")


def get_connection_string():
    # Check if we should use local or server connection
    db_env = os.environ.get('DB_ENV', 'local')

    if db_env == 'server':
        host = os.environ.get('SERVER_DB_HOST', '103.173.226.35')
        port = os.environ.get('SERVER_DB_PORT', '1433')
        username = os.environ.get('SERVER_DB_USERNAME', 'sa')
        password = os.environ.get('SERVER_DB_PASSWORD', 'Pass123@')
        database = os.environ.get('SERVER_DB_DATABASE', 'question_bank')
    else:
        host = os.environ.get('DB_HOST', 'localhost')
        port = os.environ.get('DB_PORT', '1433')
        username = os.environ.get('DB_USERNAME', 'sa')
        password = os.environ.get('DB_PASSWORD', 'Cntt15723@')
        database = os.environ.get('DB_DATABASE', 'question_bank')

    connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={host},{port};DATABASE={database};UID={username};PWD={password}"

    return connection_string


def delete_question(question_id):
    """
    Delete a question and all related data from the database
    """
    try:
        connection_string = get_connection_string()
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()

        # Start a transaction
        conn.autocommit = False

        # 1. Get question details for confirmation
        cursor.execute(
            "SELECT MaCauHoi, NoiDung FROM CauHoi WHERE MaCauHoi = ?", question_id)
        question = cursor.fetchone()

        if not question:
            print(f"Question with ID {question_id} not found in database.")
            return

        print(f"Found question: {question.MaCauHoi}")

        # 2. First check if the question is used in any exams
        cursor.execute(
            "SELECT COUNT(*) FROM ChiTietDeThi WHERE MaCauHoi = ?", question_id)
        exam_count = cursor.fetchone()[0]

        if exam_count > 0:
            print(f"Warning: This question is used in {exam_count} exam(s).")
            confirm = input("Do you want to continue deletion? (y/N): ")
            if confirm.lower() != 'y':
                print("Deletion cancelled.")
                conn.rollback()
                return

        # 3. Delete related data first

        # 3.1 Delete files related to answers of this question
        cursor.execute("""
            DELETE FROM Files
            WHERE MaCauTraLoi IN (SELECT MaCauTraLoi FROM CauTraLoi WHERE MaCauHoi = ?)
        """, question_id)
        files_for_answers_deleted = cursor.rowcount

        # 3.2 Delete files directly related to the question
        cursor.execute("DELETE FROM Files WHERE MaCauHoi = ?", question_id)
        files_deleted = cursor.rowcount

        # 3.3 Delete answers
        cursor.execute("DELETE FROM CauTraLoi WHERE MaCauHoi = ?", question_id)
        answers_deleted = cursor.rowcount

        # 3.4 Delete from exam details (ChiTietDeThi)
        cursor.execute(
            "DELETE FROM ChiTietDeThi WHERE MaCauHoi = ?", question_id)
        exam_details_deleted = cursor.rowcount

        # 3.5 Delete child questions if any
        cursor.execute("DELETE FROM CauHoi WHERE MaCauHoiCha = ?", question_id)
        child_questions_deleted = cursor.rowcount

        # 4. Finally delete the question itself
        cursor.execute("DELETE FROM CauHoi WHERE MaCauHoi = ?", question_id)
        question_deleted = cursor.rowcount

        # Commit the transaction
        conn.commit()

        print(f"Successfully deleted question {question_id} with:")
        print(f"- {files_for_answers_deleted} files related to answers")
        print(f"- {files_deleted} files directly related to the question")
        print(f"- {answers_deleted} answers")
        print(f"- {exam_details_deleted} exam details")
        print(f"- {child_questions_deleted} child questions")
        print(f"- {question_deleted} question record")

    except Exception as e:
        print(f"Error deleting question: {str(e)}")
        try:
            conn.rollback()
            print("Transaction rolled back.")
        except:
            pass
    finally:
        if 'conn' in locals() and conn:
            conn.close()


if __name__ == "__main__":
    # Load environment variables
    load_env_vars()

    # The question ID to delete
    question_id = "3bc4-0acc-4c47-995b-34fd71c4ff95"

    # Confirm deletion
    print(f"WARNING: You are about to delete question with ID: {question_id}")
    print("This action cannot be undone!")
    confirm = input("Do you want to continue? (y/N): ")

    if confirm.lower() == 'y':
        delete_question(question_id)
    else:
        print("Deletion cancelled.")
