function ChatPanel({ messages }) {
  return (
    <div className="h-[400px] overflow-y-auto p-4 bg-slate-900 rounded-xl">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-4 flex ${
            msg.sender === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`px-4 py-2 rounded-xl max-w-xs ${
              msg.sender === "user"
                ? "bg-blue-600"
                : "bg-slate-700"
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ChatPanel;