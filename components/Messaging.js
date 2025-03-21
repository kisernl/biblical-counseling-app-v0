import { useState, useEffect } from 'react';
import styles from '../styles/Messaging.module.css';

const Messaging = ({ counselorId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Placeholder: Implement fetching messages from the backend
  useEffect(() => {
    // In a real application, you would fetch messages from an API endpoint
    // For example: /api/messages?counselorId=${counselorId}&userId=${userId}
    // For now, we'll simulate some messages
    const initialMessages = [
      { id: 1, senderId: counselorId, text: 'Hello, how can I help you?' },
    ];
    setMessages(initialMessages);
  }, [counselorId, userId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // In a real application, you would send the message to an API endpoint
      // For example: /api/messages
      // For now, we'll simulate sending a message
      const message = {
        id: Date.now(), // Replace with actual message ID from backend
        senderId: userId, // Or counselorId, depending on who's sending
        text: newMessage,
      };
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.messagingContainer}>
      <h2>Messages</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.senderId === userId ? styles.sent : styles.received
              }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className={styles.inputArea}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className={styles.messageInput}
        />
        <button onClick={handleSendMessage} disabled={loading} className={styles.sendButton}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Messaging;
