import styles from './MessageBubble.module.css';
import { RefreshCw } from 'lucide-react'; // Import the icon

const MessageBubble = ({
  message,
  index, // Receive index
  showThinkDeeper,
  onThinkDeeper,
  originalUserPrompt,
  originalMessageIndex // Receive original user message index
}) => {
  const { sender, text, isError } = message;
  const isUser = sender === 'user';

  const bubbleClass = isUser
    ? styles.userBubble
    : isError
      ? styles.errorBubble
      : styles.botBubble;

  // Handler for the think deeper button click
  const handleDeeperClick = () => {
    if (onThinkDeeper && originalUserPrompt !== undefined && originalMessageIndex !== undefined) {
      onThinkDeeper(originalUserPrompt, originalMessageIndex);
    } else {
      console.error("Missing props for Think Deeper functionality");
    }
  };


  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.botRow}`}>
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {text && <p>{text}</p>}

        {/* --- Add Think Deeper Button --- */}
        {showThinkDeeper && (
          <button onClick={handleDeeperClick} className={styles.thinkDeeperButton}>
            <RefreshCw size={14} /> Think Deeper
          </button>
        )}
        {/* --- End Think Deeper Button --- */}

      </div>
    </div>
  );
};

export default MessageBubble;