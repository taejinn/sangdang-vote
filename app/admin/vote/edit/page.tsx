"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import {Alert, Badge} from "react-bootstrap";
import formatDate from "@/components/formatDate/formatDate";
import Table from "react-bootstrap/Table";
import {useEffect, useState} from "react";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useUser} from "@auth0/nextjs-auth0";
import {useRouter} from "next/navigation";

export default function Edit() {
    const {voteSocket} = useSocket();
    const { user } = useUser();
    const router = useRouter();
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
            }
        }
        const voteUpdateInterval = setInterval(async ()=>{
            await setVoteListData();
        }, 500)

        return () => {
            clearInterval(voteUpdateInterval)
        }
    }, [voteSocket?.connected, user?.sub])

    return (
        <>
            <AdminContainer>
                <PageTitle>
                    투표 정보 수정
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"투표 수정"} description={"투표를 클릭하여 정보를 수정합니다"} />
                <Alert variant={"info"} className={styles.voteWarning}>
                    투표가 1표 이상 집계되었다면 <span id={styles.bold}>반드시 투표 집계 초기화</span>가 진행되야 수정할 수 있습니다
                    <br/>(아래 표에서 투표 클릭 후 이동되는 화면에서 확인 가능)
                </Alert>
                <Table striped hover bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th>투표 제목</th>
                        <th>상태</th>
                        <th>선택 최소</th>
                        <th>선택 최대</th>
                        <th>생성일</th>
                    </tr>
                    </thead>
                    <tbody>
                    {voteList.map((data, key) => {
                        return (
                            <tr className={styles.tableItem} key={key} onClick={()=>router.push("/admin/vote/edit/"+data.voteId)}>
                                <td>{data.name}</td>
                                <td>{data.status === "시작" ? <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>}</td>
                                <td>{data.minChoices}</td>
                                <td>{data.maxChoices}</td>
                                <td>{formatDate(data.createdAt)}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </Table>
            </AdminContainer>
        </>
    )
}