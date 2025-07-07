// Test file for formatting functions
import { formatChildQuestionContent, formatParentQuestionContent } from './latex';

// Test cases for child question formatting
const childQuestionTests = [
  {
    input: "(<2>) What do professionals in computer graphics need to stay updated with?",
    expected: "What do professionals in computer graphics need to stay updated with?",
    questionNumber: 2
  },
  {
    input: "(<1>) Which principle hides internal implementation details?",
    expected: "Which principle hides internal implementation details?",
    questionNumber: 1
  },
  {
    input: "(<3>) What type of design principles are important in computer graphics?",
    expected: "What type of design principles are important in computer graphics?",
    questionNumber: 3
  }
];

// Test cases for parent question formatting
const parentQuestionTests = [
  {
    input: "Monitoring Systems is an essential aspect of modern IT that {<1>} careful planning and implementation. The field {<2>} various tools, methodologies, and best practices to achieve optimal results. Professionals working with monitoring systems must {<3>} both technical skills and business understanding. The success of monitoring systems projects {<4>} on proper planning, execution, and continuous monitoring. Organizations that {<5>} in monitoring systems typically see improved efficiency and better outcomes.",
    expected: "Monitoring Systems is an essential aspect of modern IT that <span class=\"inline-block bg-blue-50 border-2 border-dashed border-blue-300 px-3 py-1 mx-1 rounded-md text-blue-600 font-medium min-w-[60px] text-center\">Câu 1</span> careful planning and implementation. The field <span class=\"inline-block bg-blue-50 border-2 border-dashed border-blue-300 px-3 py-1 mx-1 rounded-md text-blue-600 font-medium min-w-[60px] text-center\">Câu 2</span> various tools, methodologies, and best practices to achieve optimal results. Professionals working with monitoring systems must <span class=\"inline-block bg-blue-50 border-2 border-dashed border-blue-300 px-3 py-1 mx-1 rounded-md text-blue-600 font-medium min-w-[60px] text-center\">Câu 3</span> both technical skills and business understanding. The success of monitoring systems projects <span class=\"inline-block bg-blue-50 border-2 border-dashed border-blue-300 px-3 py-1 mx-1 rounded-md text-blue-600 font-medium min-w-[60px] text-center\">Câu 4</span> on proper planning, execution, and continuous monitoring. Organizations that <span class=\"inline-block bg-blue-50 border-2 border-dashed border-blue-300 px-3 py-1 mx-1 rounded-md text-blue-600 font-medium min-w-[60px] text-center\">Câu 5</span> in monitoring systems typically see improved efficiency and better outcomes."
  }
];

// Test function for child questions
export const testChildQuestionFormatting = () => {
  console.log('Testing Child Question Formatting:');
  childQuestionTests.forEach((test, index) => {
    const result = formatChildQuestionContent(test.input, test.questionNumber);
    const passed = result === test.expected;
    console.log(`Test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (!passed) {
      console.log(`  Input: ${test.input}`);
      console.log(`  Expected: ${test.expected}`);
      console.log(`  Got: ${result}`);
    }
  });
};

// Test function for parent questions
export const testParentQuestionFormatting = () => {
  console.log('Testing Parent Question Formatting:');
  parentQuestionTests.forEach((test, index) => {
    const result = formatParentQuestionContent(test.input);
    const passed = result === test.expected;
    console.log(`Test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
    if (!passed) {
      console.log(`  Input: ${test.input}`);
      console.log(`  Expected: ${test.expected}`);
      console.log(`  Got: ${result}`);
    }
  });
};

// Run all tests
export const runAllTests = () => {
  testChildQuestionFormatting();
  console.log('');
  testParentQuestionFormatting();
};
