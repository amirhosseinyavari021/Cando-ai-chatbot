import styles from './MessageBubble.module.css';

const MessageBubble = ({ message }) => {
  // تصویر را از آبجکت پیام واکشی می‌کنیم
  const { sender, text, image, isError } = message;
  const isUser = sender === 'user';

  const bubbleClass = isUser
    ? styles.userBubble
    : isError
      ? styles.errorBubble
      : styles.botBubble;

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.botRow}`}>
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {/* نمایش تصویر، اگر وجود داشته باشد (فقط برای پیام کاربر) */}
        {image && isUser && (
          <img src={image} alt="User upload" className={styles.messageImage} />
        )}
        {/* نمایش متن، اگر وجود داشته باشد */}
        {text && <p>{text}</p>}
      </div>
    </div>
  );
};

export default MessageBubble;