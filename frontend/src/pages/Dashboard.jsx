import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

const parseScore = (value) => {
  if (typeof value === "number") return value;
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const getConfidence = (item) => {
  if (item.confidenceSummary?.overallConfidence != null) {
    return Number(item.confidenceSummary.overallConfidence) || 0;
  }

  const history = item.confidenceHistory || [];
  if (!history.length) return 0;

  const total = history.reduce(
    (sum, entry) => sum + Number(entry.overallConfidence ?? entry.confidence ?? 0),
    0
  );

  return Math.round(total / history.length);
};

const FeedbackList = ({ title, items = [] }) => (
  <div className="rounded-xl bg-gray-50 p-5">
    <h3 className="mb-2 font-semibold text-gray-800">{title}</h3>
    {items.length ? (
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500">No items available.</p>
    )}
  </div>
);

function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await API.get("/interview/history");
        setHistory(data.data || []);
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const averageScore = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((acc, cur) => acc + parseScore(cur.score), 0);
    return Math.round(total / history.length);
  }, [history]);

  const averageConfidence = useMemo(() => {
    if (!history.length) return 0;
    const total = history.reduce((acc, cur) => acc + getConfidence(cur), 0);
    return Math.round(total / history.length);
  }, [history]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="px-6 py-8 lg:px-10">
        <section className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || "there"}
          </h2>
          <p className="mt-2 text-gray-500">
            Practice interviews, review feedback, and track your progress.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/interview")}
              className="rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
            >
              Start Interview
            </button>

            <button
              onClick={() => navigate("/progress")}
              className="rounded-xl border border-gray-300 px-6 py-3 text-gray-700 transition hover:bg-gray-100"
            >
              View Analytics
            </button>
          </div>
        </section>

        <section className="mb-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="text-gray-500">Total Interviews</h4>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {history.length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="text-gray-500">Average Score</h4>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {averageScore}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="text-gray-500">Average Confidence</h4>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {averageConfidence}%
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h4 className="text-gray-500">Last Interview</h4>
            <p className="mt-2 text-sm text-gray-600">
              {history[0]
                ? new Date(history[0].date).toDateString()
                : "No interviews yet"}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-6 text-2xl font-semibold text-gray-900">
            Interview History
          </h3>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-40 animate-pulse rounded-xl bg-white shadow" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <h4 className="text-lg font-semibold">No interviews saved yet</h4>
              <p className="mt-2 text-gray-500">
                Start a practice interview to build your history.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {history.map((item) => (
                <button
                  key={item._id}
                  onClick={() => setSelectedFeedback(item.feedback)}
                  className="rounded-xl bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-gray-700">
                        {item.type} Interview
                      </h4>
                      <p className="mt-1 text-sm text-gray-400">
                        {item.role || "Role not recorded"}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {item.score}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1 flex justify-between text-sm text-gray-500">
                      <span>Confidence</span>
                      <span>{getConfidence(item)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${getConfidence(item)}%` }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-gray-400">
                    {new Date(item.date).toDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[84vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8 text-gray-800 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold">Interview Feedback</h2>

            <div className="mb-6 rounded-xl bg-blue-50 p-5">
              <h3 className="font-semibold text-gray-800">Score</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                {selectedFeedback.score}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FeedbackList title="Strengths" items={selectedFeedback.strengths} />
              <FeedbackList title="Weaknesses" items={selectedFeedback.weaknesses} />
              <FeedbackList title="Suggestions" items={selectedFeedback.suggestions} />
              <FeedbackList
                title="Leadership Indicators"
                items={selectedFeedback.leadershipIndicators}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {[
                ["Communication", selectedFeedback.communicationAnalysis],
                ["Confidence", selectedFeedback.confidenceAnalysis],
                ["Behavioral", selectedFeedback.behavioralAnalysis],
                ["Technical Depth", selectedFeedback.technicalDepthAnalysis],
              ].map(([title, value]) => (
                <div key={title} className="rounded-xl bg-gray-50 p-5">
                  <h3 className="mb-2 font-semibold text-gray-800">{title}</h3>
                  <p className="text-sm text-gray-700">
                    {value || "No analysis available for this interview."}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedFeedback(null)}
              className="mt-6 rounded-lg bg-red-500 px-5 py-2 text-white transition hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
