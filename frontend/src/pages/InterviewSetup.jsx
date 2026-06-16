import { useState } from "react";
import InterviewModal from "../components/InterviewModal";

function InterviewSetup() {
  const [type, setType] = useState("HR");
  const [role, setRole] = useState("");
  const [start, setStart] = useState(false);
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");

  return (
    <div className="flex justify-center items-center h-screen">

      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-96">

        <h1 className="text-2xl font-bold mb-6 text-center">
          🎯 Start Interview
        </h1>

        <select
          className="w-full p-3 mb-4 rounded bg-slate-700"
          onChange={(e) => setType(e.target.value)}
        >
          <option value="HR">HR Interview</option>
          <option value="Technical">Technical Interview</option>
        </select>

        <input
          type="text"
          placeholder="Enter Role"
          className="w-full p-3 mb-6 rounded bg-slate-700"
          onChange={(e) => setRole(e.target.value)}
        />

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="w-full p-3 mb-4 rounded bg-slate-700"
          onChange={(e) => setResume(e.target.files[0])}
        />

        <textarea
          placeholder="Paste Job Description"
          className="w-full p-3 mb-4 rounded bg-slate-700"
          rows={4}
          onChange={(e) => setJd(e.target.value)}
        />

        <button
          onClick={() => setStart(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-xl transition"
        >
          Start Interview 🚀
        </button>

      </div>

      {start && (
        <InterviewModal
          type={type}
          role={role}
          resume={resume}
          jd={jd}
        />
      )}
    </div>
  );
}

export default InterviewSetup;