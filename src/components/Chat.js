import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import MessageList from "./MessageList";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";

const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);

export const Chat = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const [typingUser, setTypingUser] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users`, {
        params: { currentUser: user.username },
      });
      setUsers(data);
    };

    fetchUsers();

    socket.on("receive_message", (data) => {
      if (data.sender === user.username) return;

      if (data.sender === currentChat || data.receiver === currentChat) {
        setMessages((prev) => [
          ...prev,
          {
            ...data,
            createdAt: data.createdAt || new Date().toISOString(),
            read: data.read ?? false,
          },
        ]);
      }
    });

    socket.on("user_typing", ({ sender, receiver }) => {
      if (receiver === user.username && sender === currentChat) {
        setTypingUser(sender);
      }
    });

    socket.on("user_stop_typing", () => {
      setTypingUser("");
    });

    // ✅ FIXED READ RECEIPT LISTENER
    socket.on("message_read", ({ sender, receiver }) => {
      if (receiver === user.username && sender === currentChat) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === user.username
              ? { ...m, read: true }
              : m
          )
        );
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("message_read");
    };
  }, [currentChat, user.username]);

  const fetchMessages = async (receiver) => {
    const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/messages`, {
      params: { sender: user.username, receiver },
    });

    setMessages(data);
    setCurrentChat(receiver);

    // ✅ MARK MESSAGES AS READ
    socket.emit("mark_read", {
      sender: receiver,
      receiver: user.username,
    });
  };

  let typingTimeout;

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);

    socket.emit("typing", {
      sender: user.username,
      receiver: currentChat,
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        sender: user.username,
        receiver: currentChat,
      });
    }, 1000);
  };

  const sendMessage = () => {
    if (!currentMessage.trim()) return;

    const messageData = {
      sender: user.username,
      receiver: currentChat,
      message: currentMessage,
      createdAt: new Date().toISOString(),
      read: false,
    };

    socket.emit("send_message", messageData);

    setMessages((prev) => [
      ...prev,
      { ...messageData, read: false },
    ]);

    setCurrentMessage("");
    setShowEmoji(false);
  };

  return (
    <div className="chat-container">
      <h2>Welcome, {user.username}</h2>

      <div className="chat-list">
        <h3>Chats</h3>
        {users.map((u) => (
          <div
            key={u._id}
            className={`chat-user ${currentChat === u.username ? "active" : ""
              }`}
            onClick={() => fetchMessages(u.username)}
          >
            {u.username}
          </div>
        ))}
      </div>

      {currentChat && (
        <div className="chat-window">
          <h5>You are chatting with {currentChat}</h5>

          {typingUser && (
            <p className="text-muted small">{typingUser} is typing...</p>
          )}

          <MessageList messages={messages} user={user} />

          <div className="message-field">
            <button
              className="btn btn-light me-2"
              onClick={() => setShowEmoji(!showEmoji)}
            >
              😊
            </button>

            {showEmoji && (
              <EmojiPicker
                onEmojiClick={(emoji) =>
                  setCurrentMessage((prev) => prev + emoji.emoji)
                }
              />
            )}

            <input
              type="text"
              placeholder="Type a message..."
              value={currentMessage}
              style={{ minWidth: "400px" }}
              onChange={handleTyping}
            />

            <button className="btn-prime" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
