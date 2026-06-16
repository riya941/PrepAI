import { useCallback, useRef, useState } from "react";
import API from "../services/api";
import ChatPanel from "./ChatPanel";
import WebcamFeed from "./WebcamFeed";
import MicRecorder from "./MicRecorder";
import {
  averageConfidence,
  buildConfidenceSnapshot,
} from "../utils/confidenceScoring";

const speakText = (text) => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1;
  window.speechSynthesis.speak(speech);
};

const FeedbackList = ({ title, items = [] }) => (
  <div className="rounded-lg border border-gray-200 p-5 text-gray-900">
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    {items.length ? (
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500">No items yet.</p>
    )}
  </div>
);

function InterviewModal({ type, role, resume, jd }) {
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [facialSignals, setFacialSignals] = useState({
    cameraActive: false,
    faceVisible: false,
    lookingAwayEvents: 0,
    headMovementEvents: 0,
  });

  const confidenceHistoryRef = useRef([]);

  const handleFacialSignals = useCallback((signals) => {
    setFacialSignals(signals);
  }, []);

  const buildQuestionFormData = (nextAnswers = answers) => {
    const formData = new FormData();

    formData.append("type", type);
    formData.append("role", role);
    formData.append("jd", jd);

    if (resume) {
      formData.append("resume", resume);
    }

    formData.append("previousQuestions", JSON.stringify(questions));
    formData.append("previousAnswers", JSON.stringify(nextAnswers));

    return formData;
  };

  const startInterview = async () => {
    setInterviewStarted(true);
    setIsLoading(true);

    try {
      const { data } = await API.post("/interview/question", buildQuestionFormData([]), {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setQuestions([data.question]);
      setMessages([{ sender: "ai", text: data.question }]);
      speakText(data.question);
    } catch (err) {
      setMessages([
        {
          sender: "ai",
          text: "Failed to start the interview. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAnswer = async (payload) => {
    const answer = typeof payload === "string" ? payload : payload.answer;
    const durationSeconds =
      typeof payload === "string" ? 0 : payload.durationSeconds;

    if (!answer?.trim() || isLoading) return;

    const updatedAnswers = [...answers, answer];
    setAnswers(updatedAnswers);

    const snapshot = buildConfidenceSnapshot({
      question: updatedAnswers.length,
      answer,
      durationSeconds,
      facialSignals,
    });

    const nextConfidenceHistory = [
      ...confidenceHistoryRef.current,
      snapshot,
    ];

    confidenceHistoryRef.current = nextConfidenceHistory;
    setConfidenceHistory(nextConfidenceHistory);
    setCurrentConfidence(snapshot.overallConfidence);

    setMessages((prev) => [...prev, { sender: "user", text: answer }]);
    setIsLoading(true);

    try {
      const { data } = await API.post(
        "/interview/question",
        buildQuestionFormData(updatedAnswers),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setQuestions((prev) => [...prev, data.question]);
      setMessages((prev) => [...prev, { sender: "ai", text: data.question }]);
      speakText(data.question);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Failed to generate the next question.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const finishInterview = async (finalAnswers) => {
    if (finalAnswers.length === 0) {
      alert("Please answer at least one question");
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsFinished(true);
    window.speechSynthesis?.cancel();

    setMessages((prev) => [
      ...prev,
      { sender: "ai", text: "Evaluating your overall performance..." },
    ]);

    try {
      const finalConfidenceHistory = confidenceHistoryRef.current;
      const confidenceSummary = {
        overallConfidence: averageConfidence(finalConfidenceHistory),
        voiceConfidence: averageConfidence(
          finalConfidenceHistory.map((item) => ({
            overallConfidence: item.voiceConfidence,
          }))
        ),
        facialConfidence: averageConfidence(
          finalConfidenceHistory.map((item) => ({
            overallConfidence: item.facialConfidence,
          }))
        ),
      };

      const { data } = await API.post("/interview/final-evaluate", {
        questions,
        answers: finalAnswers,
        confidenceHistory: finalConfidenceHistory,
      });

      setFeedback(data);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Interview completed. You can now view your feedback.",
        },
      ]);

      speakText("Your interview is complete. Click to view feedback.");

      await API.post("/interview/save", {
        type,
        role,
        score: data.score,
        feedback: data,
        confidenceHistory: finalConfidenceHistory,
        confidenceSummary,
        behavioralScores: data.behavioralScores,
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Failed to evaluate or save the interview. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70 p-4">
        <div className="flex h-[88vh] w-full max-w-6xl flex-col rounded-2xl bg-slate-800 p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">AI Interview</h2>
              <p className="text-sm text-slate-300">
                {type} practice for {role || "your target role"}
              </p>
            </div>
            {isLoading && (
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-100">
                Working...
              </span>
            )}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="col-span-1 flex min-h-0 flex-col justify-between lg:col-span-2">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ChatPanel messages={messages} />
              </div>

              <div className="mt-4 rounded-lg bg-slate-900 p-4">
                <div className="mb-2 flex justify-between text-sm text-gray-300">
                  <span>Overall Confidence</span>
                  <span>{currentConfidence}%</span>
                </div>

                <div className="h-3 w-full rounded-full bg-gray-700">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all duration-500"
                    style={{
                      width: `${currentConfidence}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col items-center gap-4 pb-2">
                {!interviewStarted && !isFinished && (
                  <button
                    onClick={startInterview}
                    disabled={isLoading}
                    className="rounded-full bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Start Interview
                  </button>
                )}

                {interviewStarted && !isFinished && (
                  <>
                    <MicRecorder onStop={handleUserAnswer} />

                    <button
                      onClick={() => finishInterview(answers)}
                      disabled={isLoading}
                      className="rounded-full bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Stop Interview
                    </button>
                  </>
                )}

                {isFinished && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-400">
                      Interview completed
                    </p>

                    <button
                      onClick={() => setShowFeedback(true)}
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                    >
                      View Feedback
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-lg bg-slate-900 p-4">
              <WebcamFeed onSignals={handleFacialSignals} />
              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Face visibility</span>
                  <span>{facialSignals.faceVisible ? "Visible" : "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Camera</span>
                  <span>{facialSignals.cameraActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFeedback && feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
              Interview Feedback
            </h2>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-5 text-gray-900">
                <h3 className="text-sm font-semibold text-blue-700">Score</h3>
                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {feedback.score}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-5 text-gray-900">
                <h3 className="text-sm font-semibold text-green-700">
                  Confidence
                </h3>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {averageConfidence(confidenceHistory)}%
                </p>
              </div>
              <div className="rounded-lg bg-slate-100 p-5 text-gray-900">
                <h3 className="text-sm font-semibold text-slate-700">
                  Answers
                </h3>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {answers.length}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FeedbackList title="Strengths" items={feedback.strengths} />
              <FeedbackList title="Weaknesses" items={feedback.weaknesses} />
              <FeedbackList title="Suggestions" items={feedback.suggestions} />
              <FeedbackList
                title="Leadership Indicators"
                items={feedback.leadershipIndicators}
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Communication", feedback.communicationAnalysis],
                ["Confidence", feedback.confidenceAnalysis],
                ["Behavioral", feedback.behavioralAnalysis],
                ["Technical Depth", feedback.technicalDepthAnalysis],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="rounded-lg border border-gray-200 p-5 text-gray-900"
                >
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-gray-700">
                    {value || "No analysis available."}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowFeedback(false)}
              className="mt-6 rounded-lg bg-red-500 px-5 py-2 text-white hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default InterviewModal;
