import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ChatAssistant() {

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Predefined Questions
  const predefinedQuestions = [
    {
      question: "Open Supplier Page",
      answer: "Opening Supplier Management Page..."
    },
    {
      question: "Open RFQ Page",
      answer: "Opening RFQ Management Page..."
    },
    {
      question: "Open Orders Page",
      answer: "Opening Orders Page..."
    },
    {
      question: "How many active RFQs?",
      answer: "There are 76 active RFQs."
    }
  ];
  

  // Menu Button Click
  const handleQuestionClick = (item) => {

    setMessages((prev) => [
      ...prev,
      { text: item.question, sender: "user" },
      { text: item.answer, sender: "bot" }
    ]);

    // Navigation
    if (item.question.includes("Supplier")) {
      setTimeout(() => {
        navigate("/admin/suppliers");
      }, 1000);
    }

    else if (item.question.includes("RFQ")) {
      setTimeout(() => {
        navigate("/admin/rfqs");
      }, 1000);
    }

    else if (item.question.includes("Orders")) {
      setTimeout(() => {
        navigate("/admin/orders");
      }, 1000);
    }
  };

  // Send Message
  const sendMessage = () => {

   if (!input.trim()) return;

  const userMessage = {
    text: input,
    sender: "user",
  };

  const text = input.toLowerCase();

  let botReply =
    "Sorry, I don't have any idea about that yet. Please ask something related to Suppliers, RFQs, or Orders.";

  // FAQs

  if (text.includes("how many active rfqs")) {
    botReply = "There are currently 76 active RFQs.";
  }

  else if (text.includes("how many suppliers")) {
    botReply = "There are 245 registered suppliers.";
  }

  else if (text.includes("pending orders")) {
    botReply = "There are 18 pending orders.";
  }

  else if (text.includes("completed orders")) {
    botReply = "There are 124 completed orders this month.";
  }

  else if (text.includes("top supplier")) {
    botReply = "ABC Technologies is currently the top supplier.";
  }

  else if (text.includes("latest rfq")) {
    botReply = "The latest RFQ was created today.";
  }

  else if (text.includes("approved suppliers")) {
    botReply = "198 suppliers are approved.";
  }

  else if (text.includes("rejected suppliers")) {
    botReply = "12 supplier requests were rejected.";
  }

  else if (text.includes("today orders")) {
    botReply = "9 new orders were created today.";
  }

  else if (text.includes("help")) {
    botReply =
      "You can ask me about suppliers, RFQs, orders, and dashboard pages.";
  }

  else if (text.includes("what can you do")) {
    botReply =
      "I can help you navigate pages and provide procurement-related information.";
  }

  else if (text.includes("open supplier")) {

    botReply = "Opening Supplier Page...";

    setTimeout(() => {
      navigate("/admin/suppliers");
    }, 1000);
  }

  else if (text.includes("open rfq")) {

    botReply = "Opening RFQ Page...";

    setTimeout(() => {
      navigate("/admin/rfqs");
    }, 1000);
  }

  else if (text.includes("open orders")) {

    botReply = "Opening Orders Page...";

    setTimeout(() => {
      navigate("/admin/orders");
    }, 1000);
  }

  else if (text.includes("open dashboard")) {

    botReply = "Opening Dashboard...";

    setTimeout(() => {
      navigate("/admin/dashboard");
    }, 1000);
  }

  // Update Messages
  setMessages((prev) => [
    ...prev,
    userMessage,
    {
      text: botReply,
      sender: "bot",
    },
  ]);

  setInput("");
};

  return (
    <>

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: "28px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            zIndex: 999,
          }}
        >
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "320px",
            height: "450px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            overflow: "hidden",
            zIndex: 999,
            fontFamily: "Arial",
            display: "flex",
            flexDirection: "column",
          }}
        >

          {/* Header */}
          <div
            style={{
              background: "#2563eb",
              color: "white",
              padding: "15px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              Chat Assistant
            </span>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
            
          </div>
           Hello 👋 How can I help you?

          {/* Menu Buttons */}
          <div
            style={{
              padding: "10px",
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              flexDirection:"column",
              borderBottom: "1px solid #ddd",
            }}
          >
            {predefinedQuestions.map((item, index) => (
              <button
                key={index}
                onClick={() => handleQuestionClick(item)}
                style={{
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "20px",
                  background: "#dbeafe",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {item.question}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              background: "#f9fafb",
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  background: "#e5e7eb",
                  padding: "10px",
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              >
               
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  background:
                    msg.sender === "user"
                      ? "#2563eb"
                      : "#e5e7eb",
                  color:
                    msg.sender === "user"
                      ? "white"
                      : "black",
                  padding: "10px",
                  borderRadius: "10px",
                  marginBottom: "10px",
                  maxWidth: "80%",
                  marginLeft:
                    msg.sender === "user"
                      ? "auto"
                      : "0",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #ddd",
            }}
          >
            <input
              type="text"
              placeholder="Type message..."
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              style={{
                flex: 1,
                padding: "12px",
                border: "none",
                outline: "none",
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                padding: "12px 18px",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>

        </div>
      )}
    </>
  );
}