import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check if user is logged in before initiating socket logic
    const userData = localStorage.getItem("user");
    if (!userData) {
      console.log("No authenticated user session found. Socket connection deferred.");
      return;
    }

    let user;
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error("Failed to parse user data:", e);
      return;
    }

    // Explicit '127.0.0.1' to prevent IPv6/IPv4 address resolution mismatches on localhost
    const socketInstance = io("http://localhost:5000/api", {  
      withCredentials: true,  
      transports: ["websocket", "polling"],
      autoConnect: true
    });  

    socketInstance.on("connect", () => {  
      console.log("Socket Connected successfully!");  
      
      if (user && user.id) {  
        socketInstance.emit("join", {  
          user_id: user.id,  
          role: user.role || "customer",  
        });  
      }  
    });  

    socketInstance.on("connect_error", (err) => {  
      console.error("Socket connection error details:", err.message);  
    });  

    setSocket(socketInstance);  

    // Cleanup hook to disconnect the socket instance when component unmounts
    return () => {  
      socketInstance.disconnect();  
    };  
  }, []);  

  return (  
    <SocketContext.Provider value={socket}>  
      {children}  
    </SocketContext.Provider>  
  );
}