import { useState, useEffect, useRef } from "react";
import "./App.css";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE_URL = import.meta.env.VITE_BASE_URL;
  

function App() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    {
      message: "Hello, how can I assist you today?",
      sender: "ChatGPT",
      direction: "incoming",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-3.5-turbo"); // Default model
  const chatbotRef = useRef(null); // Ref for chatbot panel

  const availableModels = [
    { name: "GPT", value: "openai/  " },
    { name: "Mistral", value: "mistralai/mistral-nemo" },
    { name: "Deepseek", value: "deepseek/deepseek-r1:free" },
  ];

  // Close chatbot when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        setShowChatbot(false);
      }
    };

    if (showChatbot) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showChatbot]);

  const stripHtml = (html) => {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const handleSend = async (message) => {
    const cleanMessage = stripHtml(message);
    const newMessage = {
      message: cleanMessage,
      sender: "User",
      direction: "outgoing",
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setTyping(true);
    await fetchChatGPTResponse(newMessages);
  };

  async function fetchChatGPTResponse(chatmessage) {
    let apiMessages = chatmessage.map((messageObject) => {
      let role = messageObject.sender === "ChatGPT" ? "assistant" : "user";
      return { role: role, content: messageObject.message };
    });

    const systemMessage = {
      role: "system",
      content:
        "Explain like a teacher.",
        // Provide detailed explanations and examples for better understanding.
    };

    const apiRequestBody = {
      model: selectedModel,
      messages: [systemMessage, ...apiMessages],
    };

    await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiRequestBody),
    })
      .then((data) => data.json())
      .then((data) => {
        let content = data?.choices[0]?.message?.content || "";
        content = content
          .replace(/[*#]/g, "")
          .replace(/---+/g, "")
          .replace(/^- /gm, "• ")
          .replace(/\n- /g, "\n• ");
        let lines = content.split("\n").filter((line) => line.trim() !== "");
        let currentMessage = "";
        setTyping(false);

        const typeLineByLine = (index) => {
          if (index >= lines.length) return;
          currentMessage += (currentMessage ? "\n" : "") + lines[index];
          setMessages([
            ...chatmessage,
            {
              message: currentMessage,
              sender: "ChatGPT",
              direction: "incoming",
            },
          ]);
          setTimeout(() => typeLineByLine(index + 1), 500);
        };
        typeLineByLine(0);
      })
      .catch((error) => {
        console.error("Error:", error);
        setTyping(false);
      });
  }

  return (
    <div className="app">
      {/* Blur overlay */}
      {showChatbot && <div className="chatbot-overlay"></div>}

      {/* Dashboard */}
      <div className={`dashboard ${showChatbot ? "blurred" : ""}`}>
        <header className="dashboard-header">
          <h1>School Plus Dashboard</h1>
        </header>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Student Details</h3>
            <p>Manage student information and profiles</p>
          </div>
          <div className="dashboard-card">
            <h3>Results</h3>
            <p>View academic results and performance</p>
          </div>
          <div className="dashboard-card">
            <h3>Timetable</h3>
            <p>Class schedules and timing information</p>
          </div>
          <div className="dashboard-card">
            <h3>Exams</h3>
            <p>Examination details and schedules</p>
          </div>
          <div className="dashboard-card">
            <h3>Fee Details</h3>
            <p>Payment and fee information</p>
          </div>
          <div className="dashboard-card">
            <h3>Events</h3>
            <p>School events and activities</p>
          </div>
          <div className="dashboard-card">
            <h3>Library</h3>
            <p>Book management and resources</p>
          </div>
          <div className="dashboard-card">
            <h3>Attendance</h3>
            <p>Student attendance tracking</p>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!showChatbot && (
        <button
          className="message-button"
          onClick={() => setShowChatbot(true)}
          aria-label="Open Chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1 .2 0 .3 0 .5-.1L14 18h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </button>
      )}

      {/* Chatbot Right Panel */}
      {showChatbot && (
        <div className="chatbot-panel" ref={chatbotRef}>
          <div className="chatbot-header">
            <h3>AI Assistant</h3>
            <select
              className="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              className="close-button"
              onClick={() => setShowChatbot(false)}
            >
              ×
            </button>
          </div>

          <div className="chatbot-container">
            <MainContainer>
              <ChatContainer>
                <MessageList
                  scrollBehavior="smooth"
                  typingIndicator={
                    typing ? <TypingIndicator content="typing" /> : null
                  }
                >
                  {messages.map((message, i) => (
                    <Message key={i} model={message} />
                  ))}
                </MessageList>
                <MessageInput
                  placeholder="Type a message here"
                  onSend={handleSend}
                  attachButton={false}
                >
                  {/* Model Selector */}
                  <div className="model-selector-container">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="model-select"
                    >
                      {availableModels.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </MessageInput>
              </ChatContainer>
            </MainContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
