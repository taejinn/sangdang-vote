"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import {useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import styles from './page.module.css'
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import Table from 'react-bootstrap/Table';
import {useSocket} from "@/components/socketProvider/SocketProvider";
import AdminContainer from "@/components/adminContainer/AdminContainer";

export default function Admin() {

    const { user, isLoading, error } = useUser()
    const { voteSocket } = useSocket();
    const [socketPing, setSocketPing] = useState<number | '-'>('-')
    const [liveConnectedClients, setLiveConnectedClients] = useState<number | '-'>('-');

    const measurePing = async () => {
        const start = Date.now();
        if (voteSocket?.connected) {
            const res = await voteSocket?.emitWithAck('ping') as Date
            const now = new Date().getTime();
            return now - start;
        } else {
            return '-'
        }
    }

    useEffect(() => {
        const checkPing = setInterval(async () => {
            const calcPing = await measurePing();
            setSocketPing(calcPing)
        }, 500)

        return () => clearInterval(checkPing);
    }, [voteSocket]);

    useEffect(() => {
        const checkClients = setInterval(async () => {
            if (voteSocket?.connected) {
                const data = await voteSocket.emitWithAck("countConnectedClients");
                setLiveConnectedClients(data);
            } else {
                setLiveConnectedClients('-');
            }
        }, 500);

        return () => clearInterval(checkClients);
    }, [voteSocket]);

    return (
        <>
            <AdminContainer>
                <PageTitle>
                    홈
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle
                    title={"실시간 서버 현황"}
                    description={"서버에서 확인할 수 있는 정보를 보여줍니다"}
                />
                <Table striped hover bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th>실시간 통신 접속 인원</th>
                        <th>실시간 통신 지연시간</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{liveConnectedClients}명 (근사치)</td>
                        <td>{socketPing}ms ({(Number(socketPing) / 1000) || "-"}초)</td>
                    </tr>
                    </tbody>
                </Table>

            </AdminContainer>
        </>
    )
}