"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import PageTitle from "@/components/pageTitle/PageTitle";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import {useEffect, useState} from "react";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useUser} from "@auth0/nextjs-auth0";
import Table from "react-bootstrap/Table";
import formatDate from "@/components/formatDate/formatDate";
import {Badge, Button} from 'react-bootstrap';
import {MdOutlineOpenInNew} from "react-icons/md";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";

export default function List() {

    const {voteSocket} = useSocket();
    const { user } = useUser()
    const [loading, setLoading] = useState(true);
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
                    투표 목록
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle
                    title={"생성된 투표 목록"}
                    description={"실시간으로 정보가 업데이트 됩니다"}
                />
                <AdminLoadingData />
            </AdminContainer>
        )
    }

    return (
        <>
            <AdminContainer>
                <PageTitle>
                    투표 목록
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle
                    title={"생성된 투표 목록"}
                    description={"실시간으로 정보가 업데이트 됩니다"}
                />

                <Table striped hover bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th style={{textAlign: "center"}}>투표화면</th>
                        <th>투표 제목</th>
                        <th>선택지</th>
                        <th>상태</th>
                        <th>선택 최소</th>
                        <th>선택 최대</th>
                        <th>생성일</th>
                        <th>투표 ID</th>
                    </tr>
                    </thead>
                    <tbody>
                        {voteList.map((data, key) => {
                            return (
                                <tr key={key}>
                                    <td style={{textAlign: "center"}}>
                                        <Button
                                            variant={"primary"}
                                            onClick={() => {
                                                window.open(process.env.NEXT_PUBLIC_URL + "/vote?id="+data.voteId);
                                            }}
                                        >
                                            <MdOutlineOpenInNew size={15} />
                                        </Button>
                                    </td>
                                    <td>{data.name}</td>
                                    <td>{data.choices.map((data, key) => {
                                        return (
                                            <div key={'choice-' + key}>
                                                {key + 1}. {data} <br/>
                                            </div>
                                        )
                                    })}</td>
                                    <td>{data.status === "시작" ? <Badge bg="success">시작</Badge> :
                                        <Badge bg="danger">종료</Badge>}</td>
                                    <td>{data.minChoices}</td>
                                    <td>{data.maxChoices}</td>
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