import React from "react";

const MessageList = ({ messages, user }) => {
  const formatTime = (time) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.sender === user.username ? "sent" : "received"
            }`}
        >
          <strong>{msg.sender}: </strong>
          {msg.message}

          <div className="d-flex justify-content-end align-items-center">
            <span className="text-muted small me-1">
              {formatTime(msg.createdAt)}
            </span>

            {msg.sender === user.username && (
              <span className="small">
                {msg.read ? "✔✔" : "✔"}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
