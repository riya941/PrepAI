import { useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

const statusClass = {
  strong: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  weak: "bg-red-100 text-red-700",
};

function ListCard({ title, items = [] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {items.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No items returned.</p>
      )}
    </div>
  );
}

function ResumeBooster() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!resume) {
      setError("Please upload a PDF resume.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jd", jd);

      const { data } = await API.post("/resume/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Resume Booster</h1>
          <p className="mt-2 text-gray-500">
            Compare your resume against a job description and prioritize the highest-impact fixes.
          </p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Resume PDF
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setResume(e.target.files[0])}
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">
                Job Description
              </span>
              <textarea
                placeholder="Paste the job description"
                className="h-32 w-full rounded-lg border border-gray-300 p-3"
                onChange={(e) => setJd(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-5 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>
        </section>

        {loading && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-xl bg-white shadow" />
            ))}
          </div>
        )}

        {result && !loading && (
          <section className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-sm font-semibold text-gray-500">ATS Score</h3>
                <p className="mt-2 text-4xl font-bold text-green-600">
                  {result.score}
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-sm font-semibold text-gray-500">
                  Keyword Match
                </h3>
                <p className="mt-2 text-4xl font-bold text-blue-600">
                  {result.keywordMatchScore || 0}%
                </p>
              </div>

              <div className="rounded-xl bg-white p-6 shadow">
                <h3 className="text-sm font-semibold text-gray-500">
                  Missing Skills
                </h3>
                <p className="mt-2 text-4xl font-bold text-red-500">
                  {result.missingSkills?.length || 0}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ListCard title="Strengths" items={result.strengths} />
              <ListCard title="Missing Keywords" items={result.missingKeywords} />
              <ListCard title="Missing Skills" items={result.missingSkills} />
              <ListCard title="Suggestions" items={result.suggestions} />
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">ATS Heatmap</h3>
              <div className="grid gap-4 md:grid-cols-4">
                {(result.atsHeatmap || []).map((item) => (
                  <div key={item.label} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-medium">{item.label}</h4>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          statusClass[item.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.status || "n/a"}
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${Number(item.score) || 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{item.score || 0}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">
                Resume Section Analysis
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(result.sectionAnalysis || {}).map(
                  ([section, details]) => (
                    <div key={section} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="capitalize font-medium">{section}</h4>
                        <span className="font-semibold text-blue-600">
                          {details?.score || 0}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {details?.feedback || "No feedback returned."}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ResumeBooster;
