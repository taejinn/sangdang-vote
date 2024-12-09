'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
    voteSocket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ voteSocket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [voteSocket, setVoteSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newVoteSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL + '/vote', {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1500,
            timeout: 2000,
        });

        setVoteSocket(newVoteSocket);

        // 나중에 reconnect_attempt, reconnect 이벤트 구현하기

        newVoteSocket.on('connect', () => {
            console.log('Socket connected');
        });

        newVoteSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return () => {
            newVoteSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ voteSocket }}>
            {children}
        </SocketContext.Provider>
    );
};