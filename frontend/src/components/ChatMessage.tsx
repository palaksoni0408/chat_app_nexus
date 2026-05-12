import styles from "./ChatMessage.module.css";

interface Message {
  id: number | string;
  text: string;
  username: string;
  userId: number;
  room: string;
  createdAt: string;
}

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getAvatarColor(username: string): string {
  const colors = [
    "#6c63ff", "#3ecf8e", "#f5a623", "#ff5f5f",
    "#4facfe", "#fa709a", "#a18cd1", "#fda085",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatMessage({ message, isOwn, showAvatar }: ChatMessageProps) {
  const color = getAvatarColor(message.username);

  return (
    <div className={`${styles.wrapper} ${isOwn ? styles.own : styles.other}`}>
      {!isOwn && (
        <div className={styles.avatarCol}>
          {showAvatar ? (
            <div className={styles.avatar} style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}>
              {message.username[0].toUpperCase()}
            </div>
          ) : (
            <div className={styles.avatarSpacer} />
          )}
        </div>
      )}

      <div className={styles.content}>
        {showAvatar && !isOwn && (
          <div className={styles.meta}>
            <span className={styles.name} style={{ color }}>{message.username}</span>
            <span className={styles.time}>{formatTime(message.createdAt)}</span>
          </div>
        )}
        <div className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}>
          {message.text}
          {isOwn && <span className={styles.timeInline}>{formatTime(message.createdAt)}</span>}
        </div>
      </div>
    </div>
  );
}
