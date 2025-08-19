import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: {
    text: string;
    points: number;
  }[];
}

interface StudentLevelQuestionnaireProps {
  onLevelSelect: (level: string) => void;
}

const questions: Question[] = [
  {
    id: 'experience',
    text: 'Have you ever skied or snowboarded before?',
    options: [
      { text: 'Never', points: 0 },
      { text: 'Once or twice', points: 1 },
      { text: 'A few times', points: 2 },
      { text: 'Many times', points: 3 }
    ]
  },
  {
    id: 'turns',
    text: 'How comfortable are you with making turns?',
    options: [
      { text: 'I haven\'t learned yet', points: 0 },
      { text: 'I can make basic turns with help', points: 1 },
      { text: 'I can link turns together', points: 2 },
      { text: 'I can make confident turns', points: 3 }
    ]
  },
  {
    id: 'terrain',
    text: 'What type of terrain are you comfortable on?',
    options: [
      { text: 'Beginner/learning area only', points: 0 },
      { text: 'Green runs', points: 1 },
      { text: 'Blue runs', points: 2 },
      { text: 'Black runs', points: 3 }
    ]
  },
  {
    id: 'speed',
    text: 'How do you feel about speed?',
    options: [
      { text: 'Very nervous', points: 0 },
      { text: 'Cautious but willing to try', points: 1 },
      { text: 'Comfortable at moderate speeds', points: 2 },
      { text: 'Love going fast', points: 3 }
    ]
  },
  {
    id: 'control',
    text: 'How would you rate your ability to control your speed and direction?',
    options: [
      { text: 'Still learning basics', points: 0 },
      { text: 'Can control with assistance', points: 1 },
      { text: 'Generally in control', points: 2 },
      { text: 'Full control in most conditions', points: 3 }
    ]
  }
];

export function StudentLevelQuestionnaire({ onLevelSelect }: StudentLevelQuestionnaireProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (points: number) => {
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: points
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateLevel(newAnswers);
    }
  };

  const [calculatedLevel, setCalculatedLevel] = useState<string>('first_time');

  const calculateLevel = (finalAnswers: { [key: string]: number }) => {
    const totalPoints = Object.values(finalAnswers).reduce((sum, points) => sum + points, 0);
    const maxPoints = questions.length * 3;
    const percentage = (totalPoints / maxPoints) * 100;

    let level: string;
    if (percentage <= 20) {
      level = 'first_time';
    } else if (percentage <= 40) {
      level = 'developing_turns';
    } else if (percentage <= 60) {
      level = 'linking_turns';
    } else if (percentage <= 80) {
      level = 'confident_turns';
    } else {
      level = 'consistent_blue';
    }

    setCalculatedLevel(level);
    onLevelSelect(level);
    setShowResults(true);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'first_time':
        return 'Level 1: First Time on Snow';
      case 'developing_turns':
        return 'Level 2: Developing Basic Turns';
      case 'linking_turns':
        return 'Level 3: Linking Turns';
      case 'confident_turns':
        return 'Level 4: Confident Turn Control';
      case 'consistent_blue':
        return 'Level 5: Consistent Blue Runs';
      default:
        return level;
    }
  };

  const question = questions[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Skill Assessment</h3>
        <span className="text-sm text-gray-500">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>

      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {!showResults ? (
        <div className="space-y-6">
          <p className="text-lg text-gray-900">{question.text}</p>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.points)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {option.text}
              </button>
            ))}
          </div>

          {currentQuestion > 0 && (
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Question
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 bg-blue-50 rounded-xl">
          <h4 className="text-lg font-medium text-blue-900 mb-2">
            Your assessed level is:
          </h4>
          <p className="text-2xl font-bold text-blue-700">
            {getLevelDescription(calculatedLevel)}
          </p>
          <p className="mt-2 text-blue-600">
            This assessment helps us match you with the right instructor and create a personalized learning plan.
          </p>
        </div>
      )}
    </div>
  );
}