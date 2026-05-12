"use client";
import { useEffect, useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import ChatMessage from "@/components/ChatMessage";
import UserList from "@/components/UserList";
import RoomSelector from "@/components/RoomSelector";
import styles from "./chat.module.css";

interface Message {
  id: number | string;
  text: string;
  username: string;
  userId: number;
  room: string;
  createdAt: string;
}

interface ActiveUser {
  socketId: string;
  username: string;
  userId: number;
}

const DEFAULT_ROOMS = ["General", "Tech", "Random", "Gaming"];

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  const [currentRoom, setCurrentRoom] = useState("General");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");

    if (!token || !userCookie) {
      router.replace("/login");
      return;
    }

    const user = JSON.parse(userCookie);
    setCurrentUser(user);

    const socket = getSocket(token);

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { room: currentRoom, username: user.username, userId: user.id });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room-messages", (msgs: Message[]) => {
      setMessages(msgs);
    });

    socket.on("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("active-users", (users: ActiveUser[]) => {
      setActiveUsers(users);
    });

    socket.on("connect_error", () => {
      setIsConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-messages");
      socket.off("new-message");
      socket.off("active-users");
      socket.off("connect_error");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchRoomMessages(room: string) {
    try {
      const res = await api.get(`/api/messages?filters[room][$eq]=${room}&sort=createdAt:asc&pagination[limit]=50&populate=author`);
      const data = res.data.data.map((item: {
        id: number;
        attributes: { text: string; username: string; room: string; createdAt: string; author?: { data?: { id: number } } };
      }) => ({
        id: item.id,
        text: item.attributes.text,
        username: item.attributes.username,
        userId: item.attributes.author?.data?.id || 0,
        room: item.attributes.room,
        createdAt: item.attributes.createdAt,
      }));
      setMessages(data);
    } catch {
      setMessages([]);
    }
  }

  function handleRoomChange(room: string) {
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");
    if (!token || !userCookie || !currentUser) return;

    const socket = getSocket(token);
    socket.emit("leave-room", { room: currentRoom, username: currentUser.username });
    setCurrentRoom(room);
    setMessages([]);
    fetchRoomMessages(room);
    socket.emit("join-room", { room, username: currentUser.username, userId: currentUser.id });
    setIsMobileSidebarOpen(false);
    inputRef.current?.focus();
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !currentUser) return;

    const token = Cookies.get("token");
    if (!token) return;

    setInputText("");

    try {
      await api.post("/api/messages", {
        data: {
          text,
          room: currentRoom,
          username: currentUser.username,
          author: currentUser.id,
        },
      });
    } catch {
      setInputText(text);
    }
  }

  function handleLogout() {
    const token = Cookies.get("token");
    if (token && currentUser) {
      const socket = getSocket(token);
      socket.emit("leave-room", { room: currentRoom, username: currentUser.username });
    }
    disconnectSocket();
    Cookies.remove("token");
    Cookies.remove("user");
    router.replace("/login");
  }

  if (!currentUser) return null;

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.appName}>Nexus Chat</span>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
        </div>

        <RoomSelector rooms={DEFAULT_ROOMS} currentRoom={currentRoom} onSelect={handleRoomChange} />

        <UserList users={activeUsers} currentUserId={currentUser.id} />

        <div className={styles.sidebarFooter}>
          <div className={styles.currentUser}>
            <div className={styles.avatar}>{currentUser.username[0].toUpperCase()}</div>
            <span className={styles.username}>{currentUser.username}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
            ↪
          </button>
        </div>
      </aside>

      {isMobileSidebarOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <main className={styles.main}>
        <header className={styles.chatHeader}>
          <button className={styles.menuBtn} onClick={() => setIsMobileSidebarOpen(true)}>
            ☰
          </button>
          <div className={styles.roomInfo}>
            <span className={styles.hashIcon}>#</span>
            <span className={styles.roomName}>{currentRoom}</span>
          </div>
          <span className={styles.userCount}>{activeUsers.length} online</span>
        </header>

        <div className={styles.messagesArea}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>💬</p>
              <p className={styles.emptyText}>No messages yet in #{currentRoom}</p>
              <p className={styles.emptyHint}>Be the first to say something!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwn={msg.username === currentUser.username}
                showAvatar={idx === 0 || messages[idx - 1].username !== msg.username}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className={styles.inputArea} onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            className={styles.messageInput}
            placeholder={`Message #${currentRoom}…`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={500}
            autoComplete="off"
          />
          <button type="submit" className={styles.sendBtn} disabled={!inputText.trim()}>
            ↑
          </button>
        </form>
      </main>
    </div>
  );
}
