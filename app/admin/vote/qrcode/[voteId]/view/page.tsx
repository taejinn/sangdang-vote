"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import {usePathname, useSearchParams} from "next/navigation";
import {QRCodeSVG} from "qrcode.react";
import React, {useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";

export default function View() {

    const queryString = useSearchParams();
    const voteCountValue = queryString.get("voteCount")?.toLowerCase();
    const participantCountValue = queryString.get("participantCount")?.toLowerCase();
    const liveConnectionStatusValue = queryString.get("liveConnectionStatus")?.toLowerCase();
    const voteStatusValue = queryString.get("voteStatus")?.toLowerCase();
    const path = usePathname();
    const voteId = path.split("/").at(-2);
    const {user} = useUser();
    const {voteSocket} = useSocket();
    const [voteInfo, setVoteInfo] = useState<{ voteParticipants: number, connectedClients: number, status: string }>({
        voteParticipants: 0,
        connectedClients: 0,
        status: "",
    })
    const [liveConnectionStatus, setLiveConnectionStatus] = useState<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT" | "RECONNECT_ATTEMPT">("UNKNOWN");
    const [isFlashing, setIsFlashing] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);

    const updateLiveConnectionStatus: React.Dispatch<React.SetStateAction<"GOOD" | "BAD" | "UNKNOWN" | "RECONNECT" | "RECONNECT_ATTEMPT">> = (value) => {
        if (typeof value === 'function') {
            setLiveConnectionStatus(value);
        } else {
            setLiveConnectionStatus(value);
        }
    };

    const changeVoteParticipantsEffect = () => {
        setAnimationKey(prevKey => prevKey + 1);
    };

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            if (voteSocket?.connected) {
                const res = await voteSocket.emitWithAck('getVoteQRCodeDataset', { uid: user?.sub, voteId: voteId });
                setVoteInfo(prevInfo => {
                    if (prevInfo.voteParticipants !== res.data.voteParticipants.totalVotes) {
                        changeVoteParticipantsEffect();
                    }
                    return {
                        voteParticipants: res.data.voteParticipants.totalVotes,
                        connectedClients: res.data.connectedClients,
                        status: res.data.status,
                    };
                });
            }
        }
        const voteUpdateInterval = setInterval(setVoteListData, 500);

        return () => {
            clearInterval(voteUpdateInterval);
        }
    }, [voteSocket?.connected, user?.sub, voteId]);

    return (
        <>
            <LiveConnectionStatus type={"hook"} hook={updateLiveConnectionStatus} />
            <div className={styles.box}>
                {(voteCountValue === "true" || participantCountValue === "true" || liveConnectionStatusValue === "true") && (
                    <div className={styles.info}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    { liveConnectionStatusValue === "true" && (
                                        <th className={styles.tableText}>실시간 통신 서버</th>
                                    )}
                                    { voteStatusValue === "true" && (
                                        <th className={styles.tableText}>투표 상태</th>
                                    )}
                                    { participantCountValue === "true" && (
                                        <th className={styles.tableText}>접속자 수</th>
                                    )}
                                    { voteCountValue === "true" && (
                                        <th key={`header-${animationKey}`} className={`${styles.tableText} ${styles.flashAnimation}`}>투표자 수</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>

                                    {/* SocketProvider에서 reconnect, recoonect_attempt 구현 필요 */}

                                    {liveConnectionStatusValue === "true" && (
                                        <td className={styles.tableText}>
                                            { (liveConnectionStatus === "GOOD" || liveConnectionStatus === "RECONNECT") && (
                                                <div id={styles.statusGood}>
                                                    원활
                                                </div>
                                            )}
                                            { liveConnectionStatus === "RECONNECT_ATTEMPT" && (
                                                <div id={styles.statusReconnectAttempt}>
                                                    재연결 중
                                                </div>
                                            ) }
                                            { liveConnectionStatus === "UNKNOWN" && (
                                                <div id={styles.statusUnknown}>
                                                    알 수 없음(연결 안됨)
                                                </div>
                                            ) }
                                            { liveConnectionStatus === "BAD" && (
                                                <div id={styles.statusBad}>
                                                    혼잡 (연결 실패 및 재연결 중)
                                                </div>
                                            ) }
                                        </td>
                                    )}
                                    {voteStatusValue === "true" && (
                                        <td className={styles.tableText}>
                                            {voteInfo.status === "" && (
                                                <div id={styles.statusUnknown}>
                                                    확인 중...
                                                </div>
                                            )}
                                            {voteInfo.status === "시작" && (
                                                <div id={styles.statusGood}>
                                                    {voteInfo.status}
                                                </div>
                                            )}
                                            {voteInfo.status === "종료" && (
                                                <div id={styles.statusBad}>
                                                    {voteInfo.status}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    {participantCountValue === "true" && (
                                        <td className={styles.tableText}>{voteInfo.connectedClients}명</td>
                                    )}
                                    { voteCountValue === "true" && (
                                        <td key={`data-${animationKey}`} className={`${styles.tableText} ${styles.flashAnimation}`}>{voteInfo.voteParticipants}명</td>
                                    )}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
                <div className={styles.qrcode}>
                    <QRCodeSVG value={`${process.env.NEXT_PUBLIC_URL}/vote?id=${voteId}`} height={570} width={570}/>
                </div>
            </div>
        </>
    )
}