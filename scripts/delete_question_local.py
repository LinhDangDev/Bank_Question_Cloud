#!/usr/bin/env python3
"""
Delete Question Script for Local Database
Author: Linh Dang Dev

Script to delete a specific question from the local database
"""

import pyodbc
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Local Database configuration (Windows Authentication)
DB_CONFIG = {
    'server': 'localhost',
    'database': 'question_bank',
    'driver': '{ODBC Driver 17 for SQL Server}',
    'trusted_connection': 'yes'  # Use Windows Authentication
}

def get_database_connection():
    """Create database connection to local SQL Server"""
    try:
        connection_string = (
            f"DRIVER={DB_CONFIG['driver']};"
            f"SERVER={DB_CONFIG['server']};"
            f"DATABASE={DB_CONFIG['database']};"
            f"Trusted_Connection={DB_CONFIG['trusted_connection']};"
            "TrustServerCertificate=yes;"
        )
        
        connection = pyodbc.connect(connection_string)
        logger.info("Successfully connected to local database")
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to local database: {e}")
        return None

def check_question_exists(cursor, question_id):
    """Check if question exists in database"""
    try:
        query = "SELECT MaCauHoi, NoiDung FROM CauHoi WHERE MaCauHoi = ?"
        cursor.execute(query, question_id)
        result = cursor.fetchone()
        
        if result:
            logger.info(f"Found question: {result[0]} - {result[1][:100]}...")
            return True
        else:
            logger.warning(f"Question with ID {question_id} not found")
            return False
    except Exception as e:
        logger.error(f"Error checking question existence: {e}")
        return False

def get_question_info(cursor, question_id):
    """Get detailed question information"""
    try:
        # Get question info
        query = """
        SELECT ch.MaCauHoi, ch.NoiDung, ch.LoaiCauHoi, ch.MaPhan, p.TenPhan,
               COUNT(da.MaDapAn) as SoLuongDapAn
        FROM CauHoi ch
        LEFT JOIN Phan p ON ch.MaPhan = p.MaPhan
        LEFT JOIN DapAn da ON ch.MaCauHoi = da.MaCauHoi
        WHERE ch.MaCauHoi = ?
        GROUP BY ch.MaCauHoi, ch.NoiDung, ch.LoaiCauHoi, ch.MaPhan, p.TenPhan
        """
        cursor.execute(query, question_id)
        result = cursor.fetchone()
        
        if result:
            print(f"📋 Question Details:")
            print(f"   ID: {result[0]}")
            print(f"   Content: {result[1][:100]}...")
            print(f"   Type: {result[2]}")
            print(f"   Chapter: {result[4]} ({result[3]})")
            print(f"   Answers: {result[5]}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error getting question info: {e}")
        return False

def delete_question_answers(cursor, question_id):
    """Delete all answers for the question"""
    try:
        query = "DELETE FROM DapAn WHERE MaCauHoi = ?"
        cursor.execute(query, question_id)
        deleted_count = cursor.rowcount
        logger.info(f"Deleted {deleted_count} answers for question {question_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting answers: {e}")
        return False

def delete_question(cursor, question_id):
    """Delete the question itself"""
    try:
        query = "DELETE FROM CauHoi WHERE MaCauHoi = ?"
        cursor.execute(query, question_id)
        deleted_count = cursor.rowcount
        
        if deleted_count > 0:
            logger.info(f"Successfully deleted question {question_id}")
            return True
        else:
            logger.warning(f"No question deleted with ID {question_id}")
            return False
    except Exception as e:
        logger.error(f"Error deleting question: {e}")
        return False

def delete_question_complete(question_id):
    """Complete question deletion process"""
    connection = get_database_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Check if question exists and show info
        if not check_question_exists(cursor, question_id):
            return False
        
        # Show question details
        get_question_info(cursor, question_id)
        
        # Start transaction
        logger.info("Starting deletion transaction...")
        
        # Delete answers first (foreign key constraint)
        if not delete_question_answers(cursor, question_id):
            connection.rollback()
            logger.error("Failed to delete answers, rolling back transaction")
            return False
        
        # Delete the question
        if not delete_question(cursor, question_id):
            connection.rollback()
            logger.error("Failed to delete question, rolling back transaction")
            return False
        
        # Commit transaction
        connection.commit()
        logger.info("✅ Question deletion completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error in deletion process: {e}")
        connection.rollback()
        return False
    finally:
        connection.close()
        logger.info("Database connection closed")

def main():
    """Main function"""
    # Question ID to delete
    question_id = "3bc4-0acc-4c47-995b-34fd71c4ff95"
    
    print("🗑️  Question Deletion Tool (Local Database)")
    print("=" * 60)
    logger.info(f"Starting deletion process for question: {question_id}")
    
    # Confirm deletion
    print(f"⚠️  WARNING: You are about to delete question: {question_id}")
    print("This action cannot be undone!")
    print()
    
    confirm = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    
    if confirm not in ['yes', 'y']:
        logger.info("Deletion cancelled by user")
        print("❌ Deletion cancelled.")
        return
    
    # Perform deletion
    success = delete_question_complete(question_id)
    
    if success:
        print("\n🎉 Question deleted successfully!")
        print("The question and all its answers have been removed from the database.")
    else:
        print("\n❌ Failed to delete question. Check logs for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
