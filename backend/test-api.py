#!/usr/bin/env python3
import requests
import json
import uuid
import sys
import argparse
from colorama import init, Fore, Style

# Initialize colorama
init()

# API base URL
BASE_URL = "http://localhost:3000"

# Store session data
session_data = {
    "token": None,
    "questionId": None,
    "answerId": None,
    "sectionId": None,
    "examId": None,
    "subjectId": None,
    "facultyId": None
}


def print_response(response, label=None):
    """Pretty print API response"""
    if label:
        print(f"\n{Fore.CYAN}===== {label} ====={Style.RESET_ALL}")

    print(f"{Fore.GREEN}Status Code: {response.status_code}{Style.RESET_ALL}")

    try:
        json_response = response.json()
        print(f"{Fore.YELLOW}Response:{Style.RESET_ALL}")
        print(json.dumps(json_response, indent=2))
        return json_response
    except:
        print(f"{Fore.YELLOW}Response:{Style.RESET_ALL}")
        print(response.text)
        return response.text


def get_auth_header():
    """Get authorization header with token"""
    if not session_data["token"]:
        print(f"{Fore.RED}No token available. Please login first.{Style.RESET_ALL}")
        return {}
    return {"Authorization": f"Bearer {session_data['token']}"}


def login(username="admin", password="password123"):
    """Login to get access token"""
    url = f"{BASE_URL}/auth/login"
    data = {
        "loginName": username,
        "password": password
    }

    try:
        response = requests.post(url, json=data)
        json_data = print_response(response, "Login")

        if response.status_code == 200 and "access_token" in json_data:
            session_data["token"] = json_data["access_token"]
            print(
                f"{Fore.GREEN}Login successful! Token saved to session.{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}Login failed!{Style.RESET_ALL}")
            return False
    except Exception as e:
        print(f"{Fore.RED}Error during login: {str(e)}{Style.RESET_ALL}")
        return False


def get_all_faculties():
    """Get all faculties"""
    url = f"{BASE_URL}/khoa"

    try:
        response = requests.get(url)
        json_data = print_response(response, "Get All Faculties")

        if response.status_code == 200 and json_data and len(json_data) > 0:
            session_data["facultyId"] = json_data[0]["MaKhoa"]
            print(
                f"{Fore.GREEN}Faculty ID saved to session: {session_data['facultyId']}{Style.RESET_ALL}")
        return json_data
    except Exception as e:
        print(f"{Fore.RED}Error getting faculties: {str(e)}{Style.RESET_ALL}")
        return None


def get_all_questions(page=1, limit=10):
    """Get all questions with pagination"""
    url = f"{BASE_URL}/cau-hoi?page={page}&limit={limit}"

    try:
        response = requests.get(url)
        json_data = print_response(response, "Get All Questions")

        if response.status_code == 200 and "items" in json_data and len(json_data["items"]) > 0:
            session_data["questionId"] = json_data["items"][0]["MaCauHoi"]
            print(
                f"{Fore.GREEN}Question ID saved to session: {session_data['questionId']}{Style.RESET_ALL}")
        return json_data
    except Exception as e:
        print(f"{Fore.RED}Error getting questions: {str(e)}{Style.RESET_ALL}")
        return None


def get_all_sections():
    """Get all sections"""
    url = f"{BASE_URL}/phan"

    try:
        response = requests.get(url)
        json_data = print_response(response, "Get All Sections")

        if response.status_code == 200 and json_data and len(json_data) > 0:
            session_data["sectionId"] = json_data[0]["MaPhan"]
            print(
                f"{Fore.GREEN}Section ID saved to session: {session_data['sectionId']}{Style.RESET_ALL}")
        return json_data
    except Exception as e:
        print(f"{Fore.RED}Error getting sections: {str(e)}{Style.RESET_ALL}")
        return None


def create_question_with_answers():
    """Create a question with answers"""
    if not session_data["sectionId"]:
        print(
            f"{Fore.RED}No section ID available. Please get sections first.{Style.RESET_ALL}")
        return None

    url = f"{BASE_URL}/cau-hoi/with-answers"
    data = {
        "question": {
            "MaPhan": session_data["sectionId"],
            "MaSoCauHoi": 1,
            "NoiDung": "What is the capital of France?",
            "HoanVi": False,
            "CapDo": 1,
            "SoCauHoiCon": 0
        },
        "answers": [
            {
                "NoiDung": "Paris",
                "ThuTu": 1,
                "LaDapAn": True,
                "HoanVi": False
            },
            {
                "NoiDung": "London",
                "ThuTu": 2,
                "LaDapAn": False,
                "HoanVi": False
            },
            {
                "NoiDung": "Berlin",
                "ThuTu": 3,
                "LaDapAn": False,
                "HoanVi": False
            },
            {
                "NoiDung": "Madrid",
                "ThuTu": 4,
                "LaDapAn": False,
                "HoanVi": False
            }
        ]
    }

    try:
        response = requests.post(url, json=data)
        json_data = print_response(response, "Create Question With Answers")

        if response.status_code == 201 and "question" in json_data:
            session_data["questionId"] = json_data["question"]["MaCauHoi"]
            print(
                f"{Fore.GREEN}Question ID saved to session: {session_data['questionId']}{Style.RESET_ALL}")

            if "answers" in json_data and len(json_data["answers"]) > 0:
                session_data["answerId"] = json_data["answers"][0]["MaCauTraLoi"]
                print(
                    f"{Fore.GREEN}Answer ID saved to session: {session_data['answerId']}{Style.RESET_ALL}")

        return json_data
    except Exception as e:
        print(
            f"{Fore.RED}Error creating question with answers: {str(e)}{Style.RESET_ALL}")
        return None


def get_question_with_answers(question_id=None):
    """Get a question with its answers"""
    if not question_id and not session_data["questionId"]:
        print(f"{Fore.RED}No question ID available.{Style.RESET_ALL}")
        return None

    question_id = question_id or session_data["questionId"]
    url = f"{BASE_URL}/cau-hoi/{question_id}/with-answers"

    try:
        response = requests.get(url)
        return print_response(response, f"Get Question With Answers (ID: {question_id})")
    except Exception as e:
        print(
            f"{Fore.RED}Error getting question with answers: {str(e)}{Style.RESET_ALL}")
        return None


def update_question_with_answers(question_id=None):
    """Update a question with its answers"""
    if not question_id and not session_data["questionId"]:
        print(f"{Fore.RED}No question ID available.{Style.RESET_ALL}")
        return None

    question_id = question_id or session_data["questionId"]
    url = f"{BASE_URL}/cau-hoi/{question_id}/with-answers"

    data = {
        "question": {
            "MaPhan": session_data["sectionId"],
            "MaSoCauHoi": 1,
            "NoiDung": "Updated: What is the capital of France?",
            "HoanVi": False,
            "CapDo": 2,
            "SoCauHoiCon": 0
        },
        "answers": [
            {
                "NoiDung": "Paris",
                "ThuTu": 1,
                "LaDapAn": True,
                "HoanVi": False
            },
            {
                "NoiDung": "London",
                "ThuTu": 2,
                "LaDapAn": False,
                "HoanVi": False
            },
            {
                "NoiDung": "Berlin",
                "ThuTu": 3,
                "LaDapAn": False,
                "HoanVi": False
            },
            {
                "NoiDung": "Rome",
                "ThuTu": 4,
                "LaDapAn": False,
                "HoanVi": False
            }
        ]
    }

    try:
        response = requests.put(url, json=data)
        return print_response(response, f"Update Question With Answers (ID: {question_id})")
    except Exception as e:
        print(
            f"{Fore.RED}Error updating question with answers: {str(e)}{Style.RESET_ALL}")
        return None


def delete_question(question_id=None):
    """Delete a question"""
    if not question_id and not session_data["questionId"]:
        print(f"{Fore.RED}No question ID available.{Style.RESET_ALL}")
        return None

    question_id = question_id or session_data["questionId"]
    url = f"{BASE_URL}/cau-hoi/{question_id}"

    try:
        response = requests.delete(url)
        return print_response(response, f"Delete Question (ID: {question_id})")
    except Exception as e:
        print(f"{Fore.RED}Error deleting question: {str(e)}{Style.RESET_ALL}")
        return None


def run_full_test():
    """Run a full test sequence"""
    print(f"{Fore.CYAN}===== Running Full Test Sequence ====={Style.RESET_ALL}")

    # Get sections first
    sections = get_all_sections()
    if not sections or not session_data["sectionId"]:
        print(f"{Fore.RED}Cannot continue without section ID.{Style.RESET_ALL}")
        return

    # Create a question with answers
    created_question = create_question_with_answers()
    if not created_question or not session_data["questionId"]:
        print(f"{Fore.RED}Failed to create question.{Style.RESET_ALL}")
        return

    # Get the created question with answers
    get_question_with_answers()

    # Update the question
    update_question_with_answers()

    # Get the updated question
    get_question_with_answers()

    # Delete the question (commented out to avoid actual deletion)
    # delete_question()

    print(f"{Fore.CYAN}===== Full Test Completed ====={Style.RESET_ALL}")


def main():
    parser = argparse.ArgumentParser(description='Test Question Bank API')
    parser.add_argument(
        '--url', default='http://localhost:3000', help='API base URL')
    parser.add_argument('--action', choices=[
        'login', 'faculties', 'questions', 'sections',
        'create_question', 'get_question', 'update_question',
        'delete_question', 'full_test'
    ], default='full_test', help='Action to perform')

    args = parser.parse_args()

    # Set base URL
    global BASE_URL
    BASE_URL = args.url

    # Perform action
    if args.action == 'login':
        login()
    elif args.action == 'faculties':
        get_all_faculties()
    elif args.action == 'questions':
        get_all_questions()
    elif args.action == 'sections':
        get_all_sections()
    elif args.action == 'create_question':
        get_all_sections()  # Need section ID first
        create_question_with_answers()
    elif args.action == 'get_question':
        if not session_data["questionId"]:
            get_all_questions()  # Get a question ID first
        get_question_with_answers()
    elif args.action == 'update_question':
        if not session_data["questionId"]:
            get_all_questions()  # Get a question ID first
        update_question_with_answers()
    elif args.action == 'delete_question':
        if not session_data["questionId"]:
            get_all_questions()  # Get a question ID first
        delete_question()
    elif args.action == 'full_test':
        run_full_test()


if __name__ == "__main__":
    main()
