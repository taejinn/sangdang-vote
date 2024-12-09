"use client";

import styles from '@/components/liveConnectionStatus/LiveConnectionStatus.module.css';
import React, { CSSProperties, useEffect, useState } from "react";
import { useSocket } from "@/components/socketProvider/SocketProvider";

type LiveConnectionStatusProps = {
    messageStyle?: CSSProperties | undefined;
} & (
    | { type: "hook"; hook: React.Dispatch<React.SetStateAction<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT" | "RECONNECT_ATTEMPT">> }
    | { type?: Exclude<string, "hook">; hook?: never }
    );

export default function LiveConnectionStatus(props: LiveConnectionStatusProps) {
    const [statusMessage, setStatusMessage] = useState<string>("실시간 통신 서버 연결 상태 확인 중입니다");
    const [statusCircle, setStatusCircle] = useState<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT">("UNKNOWN");
    const { voteSocket: socket } = useSocket();
    const [liveConnectionStatus, setLiveConnectionStatus] = useState<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT" | "RECONNECT_ATTEMPT">("UNKNOWN");

    useEffect(() => {
        if (socket != null && liveConnectionStatus != "BAD" && liveConnectionStatus != "GOOD") {
            setLiveConnectionStatus("GOOD");
        }

        const onConnectError = () => setLiveConnectionStatus("BAD");
        const onConnect = () => setLiveConnectionStatus("GOOD");
        const onReconnect = () => setLiveConnectionStatus("RECONNECT");
        const onReconnectionAttempt = () => setLiveConnectionStatus("RECONNECT_ATTEMPT");

        socket?.on('connect_error', onConnectError);
        socket?.on('connect', onConnect);
        socket?.on('reconnect', onReconnect);
        socket?.on('reconnection_attempt', onReconnectionAttempt);

        return () => {
            socket?.off('connect_error', onConnectError);
            socket?.off('connect', onConnect);
            socket?.off('reconnect', onReconnect);
            socket?.off('reconnection_attempt', onReconnectionAttempt);
        };
    }, [socket, liveConnectionStatus]);

    useEffect(() => {
        if (liveConnectionStatus === "GOOD") {
            setStatusCircle("GOOD");
            setStatusMessage("실시간 통신 서버 연결이 원활합니다");
        } else if (liveConnectionStatus === "BAD") {
            setStatusCircle("BAD");
            setStatusMessage("실시간 통신 서버에 연결할 수 없습니다");
        } else if (liveConnectionStatus === "RECONNECT") {
            setStatusCircle("GOOD");
            setStatusMessage("실시간 통신 서버에 재연결 되었습니다");
        } else if (liveConnectionStatus === "UNKNOWN") {
            setStatusCircle("UNKNOWN");
            setStatusMessage("실시간 통신 서버 연결 중입니다");
        } else if (liveConnectionStatus === "RECONNECT_ATTEMPT") {
            setStatusCircle("RECONNECT");
            setStatusMessage("실시간 통신 서버에 재연결 중입니다");
        }

        if (props.type === "hook") {
            props.hook?.(liveConnectionStatus);
        }
    }, [liveConnectionStatus, props]);

    if (props.type === "hook") {
        return null;
    }

    return (
        <div className={styles.box}>
            <div className={styles.circle} id={
                (statusCircle === "GOOD" && styles.statusSuccess) ||
                (statusCircle === "BAD" && styles.statusError) ||
                (statusCircle === "UNKNOWN" && styles.statusUnknown) ||
                (statusCircle === "RECONNECT" && styles.statusReconnect) ||
                undefined
            }></div>
            <div className={styles.text} style={{...props.messageStyle}}>
                {statusMessage}
            </div>
        </div>
    );
}