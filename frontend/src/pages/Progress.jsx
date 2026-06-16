import Navbar from "../components/Navbar";
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const parseScore = (value) => {
  if (typeof value === "number") return value;
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const average = (items) => {
  if (!items.length) return 0;
  return Number((items.reduce((sum, value) => sum + value, 0) / items.length).toFixed(1));
};

const getConfidence = (item) => {
  if (item.confidenceSummary?.overallConfidence != null) {
    return Number(item.confidenceSummary.overallConfidence) || 0;
  }

  const history = item.confidenceHistory || [];
  if (!history.length) return 0;

  return average(
    history.map((entry) => Number(entry.overallConfidence ?? entry.confidence ?? 0))
  );
};

function Progress() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get("/interview/history");
        const sorted = [...(res.data.data || [])].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setHistory(sorted);
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const scoreTrend = useMemo(
    () =>
      history.map((item, index) => ({
        name: `#${index + 1}`,
        score: parseScore(item.score),
      })),
    [history]
  );

  const confidenceTrend = useMemo(
    () =>
      history.map((item, index) => ({
        name: `#${index + 1}`,
        confidence: getConfidence(item),
      })),
    [history]
  );

  const avgScore = useMemo(
    () => average(history.map((item) => parseScore(item.score))),
    [history]
  );

  const avgConfidence = useMemo(
    () => average(history.map((item) => getConfidence(item))),
    [history]
  );

  const improvement = useMemo(() => {
    if (history.length < 2) return 0;
    return parseScore(history[history.length - 1].score) - parseScore(history[0].score);
  }, [history]);

  const typeData = useMemo(() => {
    const hr = history.filter((item) => item.type === "HR");
    const tech = history.filter((item) => item.type === "Technical");

    return [
      { name: "HR", score: average(hr.map((item) => parseScore(item.score))) },
      {
        name: "Technical",
        score: average(tech.map((item) => parseScore(item.score))),
      },
    ];
  }, [history]);

  const behavioralData = useMemo(() => {
    const keys = [
      ["Confidence", "confidence"],
      ["Communication", "communication"],
      ["Leadership", "leadership"],
      ["Problem Solving", "problemSolving"],
      ["Ownership", "ownership"],
    ];

    return keys.map(([label, key]) => ({
      metric: label,
      score: average(
        history.map((item) => Number(item.behavioralScores?.[key] || 0))
      ),
    }));
  }, [history]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Performance Dashboard
          </h1>
          <p className="mt-2 text-gray-500">
            Track score, confidence, and behavioral growth across interviews.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-xl bg-white shadow" />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 text-center shadow">
                <h3 className="text-gray-500">Average Score</h3>
                <p className="mt-2 text-4xl font-bold text-blue-600">
                  {avgScore}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 text-center shadow">
                <h3 className="text-gray-500">Average Confidence</h3>
                <p className="mt-2 text-4xl font-bold text-green-600">
                  {avgConfidence}%
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 text-center shadow">
                <h3 className="text-gray-500">Improvement</h3>
                <p
                  className={`mt-2 text-4xl font-bold ${
                    improvement >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {improvement >= 0 ? `+${improvement}` : improvement}
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow">
                <h2 className="text-xl font-semibold">No interviews yet</h2>
                <p className="mt-2 text-gray-500">
                  Complete an interview to unlock score and confidence analytics.
                </p>
              </div>
            ) : (
              <div className="grid gap-8 xl:grid-cols-2">
                <section className="rounded-xl bg-white p-6 shadow">
                  <h3 className="mb-4 font-semibold">Score Trend</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#2563eb" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-xl bg-white p-6 shadow">
                  <h3 className="mb-4 font-semibold">Confidence Trend</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={confidenceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="confidence"
                          stroke="#16a34a"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-xl bg-white p-6 shadow">
                  <h3 className="mb-4 font-semibold">HR vs Technical</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="rounded-xl bg-white p-6 shadow">
                  <h3 className="mb-4 font-semibold">Behavioral Analysis</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={behavioralData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          dataKey="score"
                          fill="#0f766e"
                          fillOpacity={0.35}
                          stroke="#0f766e"
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Progress;
