// Supabase configuration - replace with your actual values
const SUPABASE_URL = 'https://ahnttsunvkondamyoxrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnR0c3VudmtvbmRhbXlveHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NDcwMDIsImV4cCI6MjA3MjAyMzAwMn0.Vw1cWdqBJlOBDtGQgA7itV8V0HNzZZe09SyzSzr_sRk';

// Initialize Supabase client
let supabaseClient = null;

// Initialize Supabase (call this before using other functions)
function initSupabase(url = SUPABASE_URL, key = SUPABASE_ANON_KEY) {
  if (typeof supabase === 'undefined') {
    console.error('Supabase library not loaded. Please include the Supabase CDN script.');
    return false;
  }

  try {
    supabaseClient = supabase.createClient(url, key);
    console.log('Supabase client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    return false;
  }
}
initSupabase();

// Store survey response to Supabase - updated for individual question records
async function storeSurveyResponse(responses, surveyData, tableName = 'needs_survey') {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initSupabase() first.');
  }

  try {
    const sessionId = generateSessionId();
    const timestamp = new Date().toISOString();
    const questionResponses = [];

    // Create individual records for each question response
    surveyData.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const importanceKey = `importance_${sectionIndex}_${questionIndex}`;
        const satisfactionKey = `satisfaction_${sectionIndex}_${questionIndex}`;

        const importance = responses[importanceKey];
        const satisfaction = responses[satisfactionKey];

        if (importance && satisfaction) {
          questionResponses.push({
            session_id: sessionId,
            need: question.text,
            importance: parseInt(importance),
            satisfaction: parseInt(satisfaction),
          });
        }
      });
    });

    if (questionResponses.length === 0) {
      throw new Error('No valid responses to store');
    }

    // Insert all question responses (don't use .select() since we can't read)
    const { error } = await supabaseClient
      .from(tableName)
      .insert(questionResponses);

    if (error) {
      throw error;
    }

    console.log('Survey responses stored successfully');
    return {
      success: true,
      session_id: sessionId,
      response_count: questionResponses.length
    };

  } catch (error) {
    console.error('Error storing survey response:', error);
    return {
      success: false,
      error: error.message || 'Failed to store survey response'
    };
  }
}

// Generate a unique session ID
function generateSessionId() {
  return 'survey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Export functions for use in other files
window.SupabaseUtils = {
  initSupabase,
  storeSurveyResponse,
};
