#!/usr/bin/env python3
"""
Script to clean unwanted text patterns from question content in database
Author: Linh Dang Dev
Created: 2025-07-11

This script removes patterns like "câu 1 2 3 4", "bài 1 2 3 4" from question content
without deleting the questions themselves.
"""

import pyodbc
import re
import os
import sys
from typing import List, Tuple, Dict
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('question_cleanup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class QuestionCleaner:
    def __init__(self, connection_string: str):
        """Initialize the question cleaner with database connection"""
        self.connection_string = connection_string
        self.connection = None
        
        # Define patterns to remove
        self.patterns_to_remove = [
            # Vietnamese patterns
            r'\bcâu\s+\d+(\s+\d+)*\b',  # "câu 1", "câu 1 2 3 4"
            r'\bbài\s+\d+(\s+\d+)*\b',  # "bài 1", "bài 1 2 3 4"
            r'\bCâu\s+\d+(\s+\d+)*\b',  # "Câu 1", "Câu 1 2 3 4"
            r'\bBài\s+\d+(\s+\d+)*\b',  # "Bài 1", "Bài 1 2 3 4"
            
            # English patterns
            r'\bquestion\s+\d+(\s+\d+)*\b',  # "question 1", "question 1 2 3 4"
            r'\bQuestion\s+\d+(\s+\d+)*\b',  # "Question 1", "Question 1 2 3 4"
            r'\bexercise\s+\d+(\s+\d+)*\b',  # "exercise 1", "exercise 1 2 3 4"
            r'\bExercise\s+\d+(\s+\d+)*\b',  # "Exercise 1", "Exercise 1 2 3 4"
            
            # Number patterns at start of content
            r'^\s*\d+[\.\)]\s*',  # "1. ", "1) ", "2. ", etc at start
            r'^\s*\(\d+\)\s*',    # "(1) ", "(2) ", etc at start
            
            # Multiple spaces and line breaks
            r'\s{2,}',  # Multiple spaces
            r'\n{3,}',  # Multiple line breaks
        ]
        
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE | re.MULTILINE) 
                                for pattern in self.patterns_to_remove]
    
    def connect(self) -> bool:
        """Connect to the database"""
        try:
            self.connection = pyodbc.connect(self.connection_string)
            logger.info("Successfully connected to database")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            self.connection.close()
            logger.info("Disconnected from database")
    
    def get_sample_questions(self, limit: int = 10) -> List[Dict]:
        """Get sample questions to analyze patterns"""
        try:
            cursor = self.connection.cursor()
            query = """
            SELECT TOP (?) 
                MaCauHoi, 
                MaSoCauHoi, 
                NoiDung,
                LEN(NoiDung) as ContentLength
            FROM CauHoi 
            WHERE NoiDung IS NOT NULL 
                AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
                AND (
                    NoiDung LIKE '%câu %' 
                    OR NoiDung LIKE '%bài %'
                    OR NoiDung LIKE '%Câu %'
                    OR NoiDung LIKE '%Bài %'
                    OR NoiDung LIKE '%question %'
                    OR NoiDung LIKE '%Question %'
                    OR NoiDung LIKE '%exercise %'
                    OR NoiDung LIKE '%Exercise %'
                )
            ORDER BY MaSoCauHoi
            """
            
            cursor.execute(query, limit)
            results = cursor.fetchall()
            
            questions = []
            for row in results:
                questions.append({
                    'MaCauHoi': row.MaCauHoi,
                    'MaSoCauHoi': row.MaSoCauHoi,
                    'NoiDung': row.NoiDung,
                    'ContentLength': row.ContentLength
                })
            
            logger.info(f"Retrieved {len(questions)} sample questions")
            return questions
            
        except Exception as e:
            logger.error(f"Error getting sample questions: {e}")
            return []
    
    def clean_content(self, content: str) -> Tuple[str, List[str]]:
        """Clean content by removing unwanted patterns"""
        if not content:
            return content, []
        
        original_content = content
        cleaned_content = content
        removed_patterns = []
        
        # Apply each pattern
        for i, pattern in enumerate(self.compiled_patterns):
            matches = pattern.findall(cleaned_content)
            if matches:
                removed_patterns.extend([f"Pattern {i+1}: {match}" for match in matches])
                cleaned_content = pattern.sub(' ', cleaned_content)
        
        # Clean up extra spaces and line breaks
        cleaned_content = re.sub(r'\s{2,}', ' ', cleaned_content)  # Multiple spaces to single
        cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)  # Multiple newlines to double
        cleaned_content = cleaned_content.strip()  # Remove leading/trailing whitespace
        
        return cleaned_content, removed_patterns
    
    def preview_cleanup(self, limit: int = 10):
        """Preview what would be cleaned without making changes"""
        logger.info(f"Previewing cleanup for {limit} questions...")
        
        questions = self.get_sample_questions(limit)
        if not questions:
            logger.warning("No questions found for preview")
            return
        
        changes_count = 0
        
        for question in questions:
            original = question['NoiDung']
            cleaned, removed = self.clean_content(original)
            
            if original != cleaned:
                changes_count += 1
                logger.info(f"\n--- Question {question['MaSoCauHoi']} (ID: {question['MaCauHoi'][:8]}...) ---")
                logger.info(f"Original length: {len(original)} chars")
                logger.info(f"Cleaned length: {len(cleaned)} chars")
                logger.info(f"Removed patterns: {removed}")
                logger.info(f"BEFORE: {original[:200]}...")
                logger.info(f"AFTER:  {cleaned[:200]}...")
        
        logger.info(f"\nPreview complete: {changes_count}/{len(questions)} questions would be modified")
    
    def count_affected_questions(self) -> int:
        """Count how many questions would be affected"""
        try:
            cursor = self.connection.cursor()
            query = """
            SELECT COUNT(*) as total_count
            FROM CauHoi 
            WHERE NoiDung IS NOT NULL 
                AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
                AND (
                    NoiDung LIKE '%câu %' 
                    OR NoiDung LIKE '%bài %'
                    OR NoiDung LIKE '%Câu %'
                    OR NoiDung LIKE '%Bài %'
                    OR NoiDung LIKE '%question %'
                    OR NoiDung LIKE '%Question %'
                    OR NoiDung LIKE '%exercise %'
                    OR NoiDung LIKE '%Exercise %'
                )
            """
            
            cursor.execute(query)
            result = cursor.fetchone()
            return result.total_count if result else 0
            
        except Exception as e:
            logger.error(f"Error counting affected questions: {e}")
            return 0

def get_database_config():
    """Get database configuration"""
    # Try to read from environment or use defaults
    configs = {
        'local': {
            'server': 'localhost',
            'database': 'question_bank',
            'username': 'sa',
            'password': 'Pass123@',
            'driver': '{ODBC Driver 17 for SQL Server}'
        },
        'production': {
            'server': '103.173.226.35',
            'database': 'question_bank', 
            'username': 'sa',
            'password': 'Pass123@',
            'driver': '{ODBC Driver 17 for SQL Server}'
        }
    }
    
    # Ask user which environment to use
    print("Available database environments:")
    for key in configs.keys():
        print(f"  {key}")
    
    env = input("Enter environment (local/production): ").strip().lower()
    if env not in configs:
        env = 'local'
        print(f"Invalid environment, using default: {env}")
    
    config = configs[env]
    
    # Build connection string
    connection_string = (
        f"DRIVER={config['driver']};"
        f"SERVER={config['server']};"
        f"DATABASE={config['database']};"
        f"UID={config['username']};"
        f"PWD={config['password']};"
        f"TrustServerCertificate=yes;"
    )
    
    return connection_string, env

def main():
    """Main function"""
    logger.info("Question Content Cleaner - Starting...")
    
    try:
        # Get database configuration
        connection_string, env = get_database_config()
        logger.info(f"Using {env} database environment")
        
        # Initialize cleaner
        cleaner = QuestionCleaner(connection_string)
        
        # Connect to database
        if not cleaner.connect():
            logger.error("Failed to connect to database. Exiting.")
            return
        
        # Count affected questions
        affected_count = cleaner.count_affected_questions()
        logger.info(f"Found {affected_count} questions that may need cleaning")
        
        if affected_count == 0:
            logger.info("No questions found that need cleaning. Exiting.")
            cleaner.disconnect()
            return
        
        # Preview cleanup
        preview_limit = min(10, affected_count)
        cleaner.preview_cleanup(preview_limit)
        
        # Ask user if they want to proceed
        print(f"\nFound {affected_count} questions that may need cleaning.")
        print("This script will ONLY preview changes. No actual database modifications will be made.")
        print("To perform actual cleanup, additional confirmation and backup procedures are required.")
        
        cleaner.disconnect()
        logger.info("Script completed successfully")
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return

if __name__ == "__main__":
    main()
