"use client";

import styles from '@/components/liveConnectionStatus/LiveConnectionStatus.module.css';
import {useEffect, useState} from "react";
import {useSocket} from "@/components/socketProvider/SocketProvider";

export default function LiveConnectionStatus() {
    
    const [statusMessage, setStatusMessage] = useState<string>("실시간 통신 서버 연결 상태 확인 중입니다");
    const [statusCircle, setStatusCircle] = useState<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT">("UNKNOWN");
    const { voteSocket: socket } = useSocket();
    const [liveConnectionStatus, setLiveConnectionStatus] = useState<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT">("UNKNOWN");

    useEffect(() => {
        if (socket != null && liveConnectionStatus != "BAD" && liveConnectionStatus != "GOOD") {
            setLiveConnectionStatus("GOOD")
        }
    }, [socket]);

    socket?.on('connect_error', () => {
        setLiveConnectionStatus("BAD")
    })
    socket?.on('connect', () => {
        setLiveConnectionStatus("GOOD")
    })
    socket?.on('reconnect', () => {
        setLiveConnectionStatus("RECONNECT")
    })
    socket?.on('reconnection_attempt', () => {
        setLiveConnectionStatus("RECONNECT")
    })

    useEffect(() => {
        if (liveConnectionStatus === "GOOD") {
            setStatusCircle("GOOD");
            setStatusMessage("실시간 통신 서버 연결이 원활합니다");
        }

        if (liveConnectionStatus === "BAD") {
            setStatusCircle("BAD");
            setStatusMessage("실시간 통신 서버에 연결할 수 없습니다");
        }

        if (liveConnectionStatus === "RECONNECT") {
            setStatusCircle("RECONNECT");
            setStatusMessage("실시간 통신 서버에 재연결 중 입니다");
        }

        if (liveConnectionStatus === "UNKNOWN") {
            setStatusCircle("UNKNOWN");
            setStatusMessage("실시간 통신 서버 연결 중입니다");
        }
    }, [liveConnectionStatus])
    
    return (
        <>
            <div className={styles.box}>
                <div className={styles.circle} id={
                    (statusCircle === "GOOD" && styles.statusSuccess) ||
                    (statusCircle === "BAD" && styles.statusError) ||
                    (statusCircle === "UNKNOWN" && styles.statusUnknown) ||
                    (statusCircle === "RECONNECT" && styles.statusReconnect) ||
                    undefined
                }></div>
                <div className={styles.text}>
                    {statusMessage}
                </div>
            </div>
        </>
    )
}