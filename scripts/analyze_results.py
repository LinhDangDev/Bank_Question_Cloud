#!/usr/bin/env python3
"""
Analyze parsed results in detail
Author: Linh Dang Dev
"""

import json

def analyze_results():
    """Analyze parsed results in detail"""
    
    # Load and analyze the JSON
    with open('parsed_output.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print('🔍 DETAILED ANALYSIS:')
    print('-' * 50)

    # Analyze question types
    types = {}
    for q in questions:
        qtype = q.get('type', 'unknown')
        types[qtype] = types.get(qtype, 0) + 1

    print('📊 Question Types:')
    for qtype, count in types.items():
        print(f'   {qtype}: {count}')

    print()

    # Analyze answer distribution
    answer_counts = []
    for q in questions:
        if q.get('answers'):
            answer_counts.append(len(q['answers']))

    if answer_counts:
        print(f'📝 Answer Options per Question:')
        print(f'   Average: {sum(answer_counts)/len(answer_counts):.1f}')
        print(f'   Min: {min(answer_counts)}')
        print(f'   Max: {max(answer_counts)}')

    print()

    # Show questions with LaTeX
    latex_questions = [q for q in questions if q.get('has_latex', False)]
    print(f'🧮 Questions with LaTeX: {len(latex_questions)}')

    print()

    # Show all CLO distribution
    print('📚 Complete CLO Distribution:')
    clo_counts = {}
    for q in questions:
        clo = q.get('clo', 'No CLO')
        clo_counts[clo] = clo_counts.get(clo, 0) + 1

    for clo, count in sorted(clo_counts.items()):
        percentage = (count / len(questions)) * 100
        print(f'   {clo}: {count} questions ({percentage:.1f}%)')

    print()

    # Show correct answer distribution
    print('✅ Correct Answer Analysis:')
    correct_positions = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
    
    for q in questions:
        if q.get('answers'):
            for i, answer in enumerate(q['answers']):
                if answer.get('isCorrect', False):
                    letter = chr(65 + i)  # A, B, C, D
                    if letter in correct_positions:
                        correct_positions[letter] += 1

    for letter, count in correct_positions.items():
        percentage = (count / len(questions)) * 100 if len(questions) > 0 else 0
        print(f'   {letter}: {count} correct answers ({percentage:.1f}%)')

if __name__ == "__main__":
    analyze_results()
