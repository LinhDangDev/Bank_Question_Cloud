const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Function to get an existing section ID from the database
async function getExistingSectionId() {
  try {
    console.log('Getting existing sections...');
    const response = await axios.get(`${API_URL}/phan`);

    if (response.data && response.data.length > 0) {
      // Return the first section ID
      console.log(`Found ${response.data.length} sections. Using section: ${response.data[0].TenPhan} (${response.data[0].MaPhan})`);
      return response.data[0].MaPhan;
    } else {
      console.error('No sections found in the database. Please create at least one section first.');
      return null;
    }
  } catch (error) {
    console.error('Error getting sections:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Create a sample question using an existing section
async function createSampleQuestion() {
  const maPhan = await getExistingSectionId();
  if (!maPhan) {
    console.error('Could not find a valid section ID in the database. Please make sure you have sections created.');
    return null;
  }

  return {
    question: {
      MaPhan: maPhan,
      MaSoCauHoi: 1,
      NoiDung: "What is the capital of France?",
      HoanVi: false,
      CapDo: 1,
      SoCauHoiCon: 0
    },
    answers: [
      {
        MaCauHoi: "", // This will be filled in by the backend
        NoiDung: "Paris",
        ThuTu: 1,
        LaDapAn: true,
        HoanVi: false
      },
      {
        MaCauHoi: "", // This will be filled in by the backend
        NoiDung: "London",
        ThuTu: 2,
        LaDapAn: false,
        HoanVi: false
      },
      {
        MaCauHoi: "", // This will be filled in by the backend
        NoiDung: "Berlin",
        ThuTu: 3,
        LaDapAn: false,
        HoanVi: false
      },
      {
        MaCauHoi: "", // This will be filled in by the backend
        NoiDung: "Madrid",
        ThuTu: 4,
        LaDapAn: false,
        HoanVi: false
      }
    ]
  };
}

// Function to test creating a question with answers
async function testCreateQuestionWithAnswers() {
  try {
    console.log('Testing create question with answers...');
    const sampleQuestion = await createSampleQuestion();
    if (!sampleQuestion) return null;

    const response = await axios.post(`${API_URL}/cau-hoi/with-answers`, sampleQuestion);
    console.log('Question created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating question:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to test getting a question with its answers
async function testGetQuestionWithAnswers(questionId) {
  try {
    console.log(`Testing get question with answers for ID: ${questionId}...`);
    const response = await axios.get(`${API_URL}/cau-hoi/${questionId}/with-answers`);
    console.log('Question with answers:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting question with answers:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to test getting questions by section
async function testGetQuestionsBySection(sectionId) {
  try {
    console.log(`Testing get questions for section ID: ${sectionId}...`);
    const response = await axios.get(`${API_URL}/cau-hoi/phan/${sectionId}`);
    console.log('Questions in section:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting questions by section:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Function to test getting all existing questions
async function testGetAllQuestions() {
  try {
    console.log('Testing get all questions...');
    const response = await axios.get(`${API_URL}/cau-hoi`);
    console.log(`Found ${response.data.items.length} questions. Total: ${response.data.meta.total}`);
    if (response.data.items.length > 0) {
      console.log('First question:');
      console.log(JSON.stringify(response.data.items[0], null, 2));
    }
    return response.data;
  } catch (error) {
    console.error('Error getting all questions:');
    console.error(error.response ? error.response.data : error.message);
    return null;
  }
}

// Main function to run the tests
async function runTests() {
  // First, test getting all questions to see what's in the database
  console.log('\n===== TESTING EXISTING DATA =====');
  const allQuestions = await testGetAllQuestions();

  if (allQuestions && allQuestions.items.length > 0) {
    // Test getting an existing question with its answers
    const existingQuestionId = allQuestions.items[0].MaCauHoi;
    await testGetQuestionWithAnswers(existingQuestionId);
  }

  // Create a new question with answers
  console.log('\n===== TESTING CREATING NEW DATA =====');
  const createdQuestion = await testCreateQuestionWithAnswers();

  if (createdQuestion) {
    // Get the created question with its answers
    await testGetQuestionWithAnswers(createdQuestion.question.MaCauHoi);

    // Get questions by section
    await testGetQuestionsBySection(createdQuestion.question.MaPhan);
  }
}

// Run the tests
runTests();
