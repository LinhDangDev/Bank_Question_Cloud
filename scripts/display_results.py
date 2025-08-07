#!/usr/bin/env python3
"""
Display parsed results in a beautiful format
Author: Linh Dang Dev
"""

import json
import sys

def display_results(json_file):
    """Display parsed results in a beautiful format"""
    
    try:
        # Load the parsed JSON
        with open(json_file, 'r', encoding='utf-8') as f:
            questions = json.load(f)

        print('=' * 80)
        print(f'📊 PARSED RESULTS SUMMARY')
        print('=' * 80)
        print(f'📁 File: D:\\Code\\Graduation\\template\\TOT NGHIEP.docx')
        print(f'📝 Total Questions: {len(questions)}')
        print()

        # Count by CLO
        clo_counts = {}
        for q in questions:
            clo = q.get('clo', 'No CLO')
            clo_counts[clo] = clo_counts.get(clo, 0) + 1

        print('📋 Questions by CLO:')
        for clo, count in sorted(clo_counts.items()):
            print(f'   {clo}: {count} questions')
        print()

        # Count correct answers
        total_correct = 0
        for q in questions:
            if q.get('answers'):
                correct_count = sum(1 for a in q['answers'] if a.get('isCorrect', False))
                total_correct += correct_count

        print(f'✅ Total Correct Answers Found: {total_correct}')
        print()

        # Show first 5 questions as examples
        print('📖 SAMPLE QUESTIONS:')
        print('-' * 80)

        for i, q in enumerate(questions[:5], 1):
            print(f'Question {i} (CLO: {q.get("clo", "N/A")}):')
            content = q.get("content", "")
            if len(content) > 100:
                content = content[:100] + "..."
            print(f'Content: {content}')
            
            if q.get('answers'):
                print('Answers:')
                for j, answer in enumerate(q['answers']):
                    letter = chr(65 + j)  # A, B, C, D
                    correct_mark = ' ✓' if answer.get('isCorrect') else ''
                    answer_content = answer.get("content", "")
                    if len(answer_content) > 60:
                        answer_content = answer_content[:60] + "..."
                    print(f'   {letter}. {answer_content}{correct_mark}')
            print()

        print('=' * 80)
        print('✨ Parsing completed successfully!')
        print('💾 Full results saved to: parsed_output.json')
        print('=' * 80)
        
    except Exception as e:
        print(f"Error displaying results: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
    else:
        json_file = "parsed_output.json"
    
    display_results(json_file)
