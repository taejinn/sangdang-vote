"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import {Badge, Button} from "react-bootstrap";
import {MdOutlineOpenInNew} from "react-icons/md";
import formatDate from "@/components/formatDate/formatDate";
import Table from "react-bootstrap/Table";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useRouter} from "next/navigation";
import {useUser} from "@auth0/nextjs-auth0";
import {useEffect, useState} from "react";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";

export default function Status() {

    const {voteSocket} = useSocket();
    const router = useRouter();
    const { user } = useUser()
    const [loading, setLoading] = useState<boolean>(true);
    const [voteList, setVoteList] = useState<[ {
        name: string,
        choices: string[],
        minChoices: number,
        maxChoices: number,
        createdAt: string,
        status: string,
        voteId: string
    } ] | []>([]);

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            if (voteSocket?.connected) {
                const res = await voteSocket.emitWithAck('getAllVoteList', { uid: user?.sub });
                setVoteList(res);
                setLoading(false);
            }
        }
        const voteUpdateInterval = setInterval(async ()=>{
            await setVoteListData();
        }, 500)

        return () => {
            clearInterval(voteUpdateInterval)
        }
    }, [voteSocket?.connected, user?.sub])

    if (loading) {
        return (
            <AdminContainer>
                <PageTitle>
                    투표 상태 변경
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"투표 상태 변경"} description={"투표 상태를 변경하여 투표 진행 여부를 설정합니다"} />
                <AdminLoadingData />
            </AdminContainer>
        )
    }
    
    return (
        <>
            <AdminContainer>
                
                <PageTitle>
                    투표 상태 변경
                </PageTitle>

                <LiveConnectionStatus />

                <MenuTitle title={"투표 상태 변경"} description={"투표 상태를 변경하여 투표 진행 여부를 설정합니다"} />

                <Table striped hover bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th>투표 제목</th>
                        <th>상태</th>
                        <th>생성일</th>
                        <th>투표 ID</th>
                    </tr>
                    </thead>
                    <tbody>
                    {voteList.map((data, key) => {
                        return (
                            <tr className={styles.tableItem} key={key} onClick={()=>router.push("/admin/vote/status/"+data.voteId)}>
                                <td>{data.name}</td>
                                <td>{data.status === "시작" ? <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>}</td>
                                <td>{formatDate(data.createdAt)}</td>
                                <td>{data.voteId}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </Table>
            </AdminContainer>
        </>
    )
}