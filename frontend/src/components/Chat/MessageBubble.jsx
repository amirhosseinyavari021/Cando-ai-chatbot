import styles from './MessageBubble.module.css';
// RefreshCw icon removed

const MessageBubble = ({ message }) => { // Removed extra props
  const { sender, text, isError } = message;
  const isUser = sender === 'user';

  const bubbleClass = isUser
    ? styles.userBubble
    : isError
      ? styles.errorBubble
      : styles.botBubble;

  // handleDeeperClick removed

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.botRow}`}>
      {/* Removed hasThinkDeeper class */}
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {text && <p>{text}</p>}
        {/* Think Deeper button completely removed */}
      </div>
    </div>
  );
};

export default MessageBubble;