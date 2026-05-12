import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:1337", {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
