import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("./Chat.css");

let conversationId = "";

type Message = { sender: string; text: string };

function Chat() {
  useEffect(() => {
    const init = async () => {
      const response = await fetch("http://localhost:8000");
      const { conversation_id } = await response.json();
      conversationId = conversation_id;
    }
    init();
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current!.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`http://localhost:8000/conversation/${conversationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const messageResponse = (await response.json()).response_message;

      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "bot", text: messageResponse }
      ]);

      setIsTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={`chat-container ${darkTheme ? "dark-theme" : ""}`}>
      <div>
        <button className="darkBtn" onClick={() => setDarkTheme(!darkTheme)}>
          {!darkTheme ? "🌙" : "☀️"}
        </button>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.sender}`}>
            <div className={`message ${msg.sender}`}>
              <ReactMarkdown
                children={msg.text}
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, "")}
                        style={materialDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              />
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message-container bot">
            <div className="message bot">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button className="button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
