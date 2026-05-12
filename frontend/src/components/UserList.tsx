import styles from "./UserList.module.css";

interface ActiveUser {
  socketId: string;
  username: string;
  userId: number;
}

interface UserListProps {
  users: ActiveUser[];
  currentUserId: number;
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

export default function UserList({ users, currentUserId }: UserListProps) {
  const uniqueUsers = users.filter((user, idx, self) =>
    self.findIndex((u) => u.userId === user.userId) === idx
  );

  return (
    <div className={styles.container}>
      <p className={styles.heading}>Online — {uniqueUsers.length}</p>
      <ul className={styles.list}>
        {uniqueUsers.map((user) => {
          const color = getAvatarColor(user.username);
          const isMe = user.userId === currentUserId;
          return (
            <li key={user.socketId} className={styles.item}>
              <div className={styles.avatarWrap}>
                <div
                  className={styles.avatar}
                  style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <span className={styles.onlineDot} />
              </div>
              <span className={`${styles.name} ${isMe ? styles.me : ""}`}>
                {user.username}{isMe && " (you)"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
