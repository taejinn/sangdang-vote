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
        const newVoteSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL + '/vote');

        newVoteSocket.on('connect', () => {
            console.log('Socket connected');
            setVoteSocket(newVoteSocket);
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