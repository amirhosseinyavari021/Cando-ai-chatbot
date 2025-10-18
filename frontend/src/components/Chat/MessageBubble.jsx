import styles from './MessageBubble.module.css';

const MessageBubble = ({ message }) => {
  // image removed from destructuring
  const { sender, text, isError } = message;
  const isUser = sender === 'user';

  const bubbleClass = isUser
    ? styles.userBubble
    : isError
      ? styles.errorBubble
      : styles.botBubble;

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.botRow}`}>
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {/* Only render text */}
        {text && <p>{text}</p>}
      </div>
    </div>
  );
};

export default MessageBubble;