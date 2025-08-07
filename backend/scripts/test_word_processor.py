#!/usr/bin/env python3
"""
Test script for Word Processor
Author: Linh Dang Dev

This script tests the word processor with sample data.
"""

import sys
import os
import json
from pathlib import Path

# Add the scripts directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from word_processor import WordProcessor

def test_with_sample_text():
    """Test the processor with sample text data"""
    
    # Sample text content (simulating extracted from Word)
    sample_text = """(DON)
(CLO1) Tìm từ khác nghĩa với các từ còn lại
A. Good bye		
B. こんにちは.	
C. 안녕하세요.	
D. 你好.

(NHOM)
[<sg>]
Questions {<1>} – {<2>} refer to the following passage.
Probably the most important factor governing the severity of forest fires is weather. Hot, dry weather lowers the moisture content of fuels. Once a fire has started, wind is extremely critical because it influences the oxygen supply and the rate of spread...
[<egc>]
(NHOM –  1) (CLO1) In this passage, the author's main purpose is to …
A. argue
B. inform
C. persuade
D. entertain
[<br>]
(NHOM – 2)(CLO1) Which of the following best describes the organization of the passage?
A. A comparison and contrast of the factors governing forest fires is followed by a list of causes.
B. A description of the conditions affecting forest fires is followed by a description of the causes.
C. An analysis of factors related to forest fires is followed by an argument against the causes of fires.
D. Several generalizations about forest fires are followed by a series of conclusions.
[<br>]
[</sg>]
(KETTHUCNHOM)

(DIENKHUYET)
[<sg>]
(CLO3) Questions {<1>} – {<5>} refer to the following passage. 
Travelling to all corners of the world gets easier and easier. We live in a global village, but this {<1>}_____ mean that we all behave the same way. Many countries have rules about what you should and {<2>} _____ do. In Asian and Muslim countries, you shouldn't reveal your body, especially women who should wear long-sleeved blouses and skirts {<3>} _____ the knee. In Japan, you should take off your shoes when {<4>} _____ a house or a restaurant. Remember {<5>} _____ them neatly together facing the door you came in. This is also true in China, Korea and Thailand. Here are some others. 
[<egc>] 
(DIENKHUYET – 1)
A. doesn't
B. didn't 
C. don't 
D. isn't 
[<br>] 
(DIENKHUYET – 2)
A. may not 
B. shouldn't
C. don't 
D. can't 
[<br>] 
(DIENKHUYET –3)
A. above 
B. over 
C. on 
D. below
[<br>] 
(DIENKHUYET – 4)
A. going 
B. walking 
C. entering
D. coming 
[<br>] 
(DIENKHUYET – 5)
A. placing 
B. to place
C. place 
D. placed 
[<br>] 
[</sg>]
(KETTHUCDIENKHUYET)"""

    processor = WordProcessor()
    
    print("Testing question parsing...")
    questions = processor._parse_questions(sample_text)
    
    print(f"Found {len(questions)} questions:")
    for i, question in enumerate(questions):
        print(f"\n{i+1}. Type: {question.type}")
        print(f"   Content: {question.content[:100]}...")
        print(f"   CLO: {question.clo}")
        print(f"   Answers: {len(question.answers)}")
        for answer in question.answers:
            correct_mark = " ✓" if answer.is_correct else ""
            print(f"     {answer.letter}. {answer.content[:50]}...{correct_mark}")
    
    # Generate statistics
    stats = processor._generate_statistics(questions, [])
    print(f"\nStatistics:")
    print(f"  Total questions: {stats['total_questions']}")
    print(f"  Single questions: {stats['single_questions']}")
    print(f"  Group questions: {stats['group_questions']}")
    print(f"  Fill-blank questions: {stats['fill_blank_questions']}")
    
    return questions, stats

def test_question_blocks():
    """Test question block splitting"""
    
    sample_text = """(DON)
(CLO1) Single question
A. Answer A
B. Answer B

(NHOM)
[<sg>]
Group content
[<egc>]
(NHOM – 1) Child question
A. Answer A
B. Answer B
[<br>]
[</sg>]
(KETTHUCNHOM)"""

    processor = WordProcessor()
    blocks = processor._split_into_question_blocks(sample_text)
    
    print("Question blocks:")
    for i, block in enumerate(blocks):
        print(f"\nBlock {i+1}:")
        print(f"Length: {len(block)} chars")
        print(f"Content preview: {block[:100]}...")
        
        # Identify block type
        if '(DON)' in block:
            print("Type: Single Question")
        elif '(NHOM)' in block:
            print("Type: Group Question")
        elif '(DIENKHUYET)' in block:
            print("Type: Fill-in-Blank Question")
    
    return blocks

def test_answer_parsing():
    """Test answer parsing with different correct answer formats"""
    
    test_cases = [
        {
            'name': 'Underline format',
            'answers': [
                'A. <u>Correct answer</u>',
                'B. Wrong answer',
                'C. Another wrong',
                'D. Last wrong'
            ]
        },
        {
            'name': 'Bold format',
            'answers': [
                'A. Wrong answer',
                'B. <b>Correct answer</b>',
                'C. Another wrong',
                'D. Last wrong'
            ]
        },
        {
            'name': 'Strong format',
            'answers': [
                'A. Wrong answer',
                'B. Wrong answer',
                'C. <strong>Correct answer</strong>',
                'D. Last wrong'
            ]
        },
        {
            'name': 'Underscore format',
            'answers': [
                'A. Wrong answer',
                'B. Wrong answer',
                'C. Wrong answer',
                'D. __Correct answer__'
            ]
        }
    ]
    
    processor = WordProcessor()
    
    for test_case in test_cases:
        print(f"\nTesting {test_case['name']}:")
        answers = processor._parse_answers(test_case['answers'])
        
        for answer in answers:
            correct_mark = " ✓" if answer.is_correct else ""
            print(f"  {answer.letter}. {answer.content}{correct_mark}")

def main():
    """Main test function"""
    print("=== Word Processor Test ===\n")
    
    print("1. Testing question block splitting...")
    test_question_blocks()
    
    print("\n" + "="*50)
    print("2. Testing answer parsing...")
    test_answer_parsing()
    
    print("\n" + "="*50)
    print("3. Testing full question parsing...")
    questions, stats = test_with_sample_text()
    
    print("\n" + "="*50)
    print("Test completed successfully!")
    
    # Save test results
    test_results = {
        'questions': [
            {
                'type': q.type,
                'content': q.content,
                'clo': q.clo,
                'answers': [
                    {
                        'letter': a.letter,
                        'content': a.content,
                        'is_correct': a.is_correct
                    } for a in q.answers
                ]
            } for q in questions
        ],
        'statistics': stats
    }
    
    output_file = 'test_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)
    
    print(f"Test results saved to {output_file}")

if __name__ == '__main__':
    main()
