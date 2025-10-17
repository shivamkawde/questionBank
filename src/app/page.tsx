

'use client'
import { URL } from "@/utils/gemini";
import React, { useState, useCallback } from 'react';

// Define the mandatory JSON schema for the quiz structure
const QUIZ_SCHEMA = {
  type: "ARRAY",
  description: "A list of multiple-choice questions.",
  items: {
    type: "OBJECT",
    properties: {
      question: { type: "STRING", description: "The text of the multiple-choice question." },
      options: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Exactly four possible answer choices for the question."
      },
      correctAnswer: { type: "STRING", description: "The exact text of the correct answer, which must match one of the options." }
    },
    required: ["question", "options", "correctAnswer"]
  }
};

// SVG for a clean Send button icon
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

// SVG for a loading spinner
const Spinner = ({ className = 'w-5 h-5' }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

/**
 * A sub-component to display the structured quiz data and handle user interaction,
 * including the Load More button.
 */
const QuizDisplay = ({ quizData, handleLoadMore, loadingMore }) => {
  const [userAnswers, setUserAnswers] = useState({});

  if (!quizData || quizData.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg max-w-2xl mx-auto shadow-inner text-gray-600">
        No questions generated yet. Enter a topic and click 'Generate Quiz'!
      </div>
    );
  }

  const handleOptionClick = (questionIndex, selectedOption) => {
    // Record the user's selected answer for this question
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const calculateScore = () => {
    let score = 0;
    quizData.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const score = calculateScore();

  return (
    <div className="w-full max-w-4xl p-6 space-y-8 bg-white rounded-xl shadow-2xl">
      <div className="text-center pb-4 border-b">
        <h2 className="text-3xl font-bold text-indigo-600">Generated Quiz</h2>
        <p className="text-lg text-gray-600 mt-2">
          Total Questions: <span className="font-extrabold text-xl">{quizData.length}</span> | 
          Your score: <span className="font-extrabold text-xl">{score} / {quizData.length}</span>
        </p>
      </div>

      {quizData.map((quizItem, qIndex) => {
        const selectedAnswer = userAnswers[qIndex];
        const isAnswered = selectedAnswer !== undefined;
        
        return (
          <div key={qIndex} className="space-y-4 p-4 rounded-xl border border-gray-200 shadow-md transition duration-300 hover:shadow-lg">
            <p className="text-lg font-semibold text-gray-800">
              {qIndex + 1}. {quizItem.question}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quizItem.options.map((option, oIndex) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === quizItem.correctAnswer;
                
                let className = "px-4 py-3 rounded-lg border cursor-pointer transition duration-150 text-sm font-medium";
                
                if (isAnswered) {
                  if (isCorrect) {
                    // Correct answer is always green after answering
                    className += " bg-green-100 border-green-500 text-green-800";
                  } else if (isSelected && !isCorrect) {
                    // User selected wrong answer
                    className += " bg-red-100 border-red-500 text-red-800 ring-2 ring-red-500";
                  } else {
                    // Unselected wrong answer
                    className += " bg-gray-50 border-gray-300 text-gray-600 opacity-60";
                  }
                } else {
                  // Not yet answered
                  className += " bg-white border-indigo-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-400";
                }

                return (
                  <div
                    key={oIndex}
                    className={className}
                    onClick={() => !isAnswered && handleOptionClick(qIndex, option)}
                  >
                    {String.fromCharCode(65 + oIndex)}. {option}
                  </div>
                );
              })}
            </div>

            {isAnswered && (
                <div className="pt-3 text-sm text-gray-700 border-t mt-4">
                    <span className="font-semibold">Answer:</span> <span className="text-green-600 font-medium">{quizItem.correctAnswer}</span>
                </div>
            )}
          </div>
        );
      })}

      {/* Load More Button */}
      <div className="text-center pt-6">
        <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className={`px-6 py-3 text-lg rounded-full font-semibold transition duration-300 flex items-center justify-center mx-auto space-x-2 
                ${loadingMore ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg'}`}
        >
            {loadingMore ? (
                <>
                    <Spinner className="w-5 h-5" />
                    <span>Loading 10 more...</span>
                </>
            ) : (
                <span>Load 10 More Questions</span>
            )}
        </button>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [topic, setTopic] = useState("");
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(false);
  // NEW STATE: For the Load More button specifically
  const [loadingMore, setLoadingMore] = useState(false); 
  const [error, setError] = useState(null);
  
  // Reusable function to fetch questions from the API
  const _fetchQuizQuestions = useCallback(async (count, updateData, isInitial) => {
    // Set appropriate loading state
    isInitial ? setLoading(true) : setLoadingMore(true);
    setError(null);

    const systemInstruction = `You are a helpful education assistant. Your task is to generate ${count} high-quality, professional multiple-choice questions about the user's requested topic. Your response MUST be a single JSON array that strictly adheres to the provided schema. Do not include any introductory or concluding text outside of the JSON block.`;

    const payload = {
      contents: [{ parts: [{ text: `Generate ${count} multiple-choice questions about the topic: ${topic}` }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QUIZ_SCHEMA
      }
    };

    try {
        let response;
        for (let i = 0; i < 3; i++) { // Retry loop (exponential backoff)
            try {
                response = await fetch(URL, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    break; 
                }
            } catch (e) {
                if (i < 2) { 
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
                } else {
                    throw e; 
                }
            }
        }

      const result = await response.json();
      const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!jsonText) {
        throw new Error("API returned an empty or malformed response structure.");
      }
      
      const parsedData = JSON.parse(jsonText);
      updateData(parsedData);

    } catch (e) {
      console.error("API or Parsing Error:", e);
      setError("Failed to generate quiz. Please try a different topic or check the console for details.");
    } finally {
      isInitial ? setLoading(false) : setLoadingMore(false);
    }
  }, [topic]);

  
  // Handles the initial generation of 30 questions
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    // Reset all data for a new topic
    setQuizData([]);
    // Call reusable fetch with count 30 and replace the data
    await _fetchQuizQuestions(30, setQuizData, true); 
  }, [topic, _fetchQuizQuestions]);

  // Handles loading 10 more questions and appending them
  const handleLoadMore = useCallback(async () => {
    // Call reusable fetch with count 10 and append the data
    const updateData = (newQuestions) => {
        setQuizData(prev => [...prev, ...newQuestions]);
    };
    await _fetchQuizQuestions(10, updateData, false);
  }, [topic, _fetchQuizQuestions]);


  return (
    <div className="min-h-dvh flex flex-col items-center justify-start py-12 px-4 bg-gray-50 font-[Inter]">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mt-8 mb-10">
          AI Quiz Generator
        </h1>

        {/* Input and Control Section */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-2 rounded-2xl border bg-white shadow-xl p-3">
            <input
              className="flex-1 bg-transparent outline-none px-2 py-3 text-lg placeholder:text-gray-400"
              placeholder="E.g., The history of the internet"
              value={topic}
              onChange={(e) => setTopic(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              disabled={loading}
            />
            <button 
              className={`shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full transition duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
              onClick={handleGenerate}
              disabled={loading}
              aria-label="Generate Quiz"
            >
              {loading ? <Spinner className="w-5 h-5 text-white" /> : <SendIcon className="text-white" />}
            </button>
          </div>
        </div>

        {/* Status/Error */}
        {error && (
          <div className="text-center p-4 text-red-700 bg-red-100 border border-red-300 rounded-lg max-w-md mx-auto">
            Error: {error}
          </div>
        )}

        {/* Quiz Display Section */}
        {!loading && !error && (
          <QuizDisplay 
            quizData={quizData} 
            handleLoadMore={handleLoadMore} 
            loadingMore={loadingMore} 
          />
        )}
      </div>
    </div>
  );
}
