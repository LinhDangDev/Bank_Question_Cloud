#!/usr/bin/env python3
"""
Test script for the enhanced DOCX parser
Author: Linh Dang Dev
"""

import sys
import os
import json
from docx_parser import DocxParser

def test_parser():
    """Test the enhanced DOCX parser"""
    
    # Test file path (you can change this to your test file)
    test_file = "test_questions.docx"
    
    if not os.path.exists(test_file):
        print(f"Test file {test_file} not found. Please create a test DOCX file.")
        return
    
    try:
        # Create parser instance with all features enabled
        parser = DocxParser(
            test_file,
            process_images=True,
            extract_styles=True,
            preserve_latex=True
        )
        
        # Parse questions
        questions = parser.parse_questions()
        
        # Print results
        print(f"Successfully parsed {len(questions)} questions")
        
        for i, question in enumerate(questions, 1):
            print(f"\n--- Question {i} ---")
            print(f"Type: {question.get('type', 'unknown')}")
            print(f"Content: {question.get('content', '')[:100]}...")
            print(f"Has LaTeX: {question.get('has_latex', False)}")
            print(f"CLO: {question.get('clo', 'N/A')}")
            
            if question.get('answers'):
                print(f"Answers ({len(question['answers'])}):")
                for j, answer in enumerate(question['answers']):
                    correct_mark = " ✓" if answer.get('isCorrect') else ""
                    print(f"  {j+1}. {answer.get('content', '')[:50]}...{correct_mark}")
            
            if question.get('childQuestions'):
                print(f"Child Questions: {len(question['childQuestions'])}")
        
        # Save to JSON file
        output_file = "parsed_questions.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        print(f"\nResults saved to {output_file}")
        
    except Exception as e:
        print(f"Error testing parser: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_parser()
