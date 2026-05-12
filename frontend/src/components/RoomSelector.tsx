import styles from "./RoomSelector.module.css";

interface RoomSelectorProps {
  rooms: string[];
  currentRoom: string;
  onSelect: (room: string) => void;
}

export default function RoomSelector({ rooms, currentRoom, onSelect }: RoomSelectorProps) {
  return (
    <div className={styles.container}>
      <p className={styles.heading}>Channels</p>
      <ul className={styles.list}>
        {rooms.map((room) => (
          <li key={room}>
            <button
              className={`${styles.roomBtn} ${currentRoom === room ? styles.active : ""}`}
              onClick={() => onSelect(room)}
            >
              <span className={styles.hash}>#</span>
              <span className={styles.name}>{room.toLowerCase()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
