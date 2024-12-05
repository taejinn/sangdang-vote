"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import Table from "react-bootstrap/Table";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useParams, useRouter} from "next/navigation";
import {useUser} from "@auth0/nextjs-auth0";
import {useEffect, useState} from "react";
import {Badge} from "react-bootstrap";

export default function CountVote() {

    const {voteSocket} = useSocket();
    const router = useRouter();
    const params = useParams<{ voteId: string }>();
    const { user } = useUser()
    const [voteInfo, setVoteInfo] = useState<{
        name: string,
        choices: string[],
        minChoices: number,
        maxChoices: number,
        createdAt: string,
        status: string,
        voteId: string
    }>({
        name: "",
        choices: [],
        minChoices: 0,
        maxChoices: 0,
        createdAt: "",
        status: "",
        voteId: ""
    })
    const [votes, setVotes] = useState<Array<{ choice: string, votes: number, ratio: number }>>()
    const [numberOfParticipants, setNumberOfParticipants] = useState<number>();
    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            if (voteSocket?.connected) {
                try {
                    const res = await voteSocket.emitWithAck('voteCountingWithVoteDetails', { uid: user?.sub, voteId: params.voteId[0] });

                    // 투표 정보 설정
                    setVoteInfo({
                        name: res.data.info.name,
                        choices: res.data.info.choices,
                        minChoices: res.data.info.minChoices,
                        maxChoices: res.data.info.maxChoices,
                        createdAt: res.data.info.createdAt,
                        status: res.data.info.status,
                        voteId: res.data.info.voteId,
                    });

                    // 데이터 유효성 검사
                    if (!res.data.votes.choiceCounts || res.data.votes.choiceCounts.length === 0) {
                        console.error("choiceCounts 값이 없음");
                        setVotes([]);
                        setNumberOfParticipants(0);
                        return;
                    }

                    // 총 투표 수 계산
                    const sumValues = res.data.votes.choiceCounts.reduce(
                        (acc: number, data: { choice: string; votes: number }) => acc + data.votes,
                        0
                    );

                    // 비율 계산
                    const voteDataWithRatio = res.data.votes.choiceCounts.map(
                        (data: { choice: string; votes: number }) => ({
                            choice: data.choice,
                            votes: data.votes,
                            ratio: sumValues > 0 ? Number(((data.votes / sumValues) * 100).toFixed(2)) : 0
                        })
                    );

                    setVotes(voteDataWithRatio);
                    setNumberOfParticipants(res.data.votes.totalVotes);
                } catch (e) {
                    console.error(e);
                }
            }
        };
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
                <PageTitle>투표 집계</PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"투표 정보"} description={"아래 투표에 대해 집계를 진행합니다."} />

                <Table striped bordered className={styles.table}>
                    <thead>
                        <tr>
                            <th>투표 제목</th>
                            <th>상태</th>
                            <th>선택 최소</th>
                            <th>선택 최대</th>
                            <th>투표 ID</th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{voteInfo.name}</td>
                        <td>{voteInfo.status === "" ? "" : voteInfo.status === "시작" ? <Badge bg="success">시작</Badge> :
                            <Badge bg="danger">종료</Badge>}</td>
                        <td>{voteInfo.minChoices === 0 ? "" : voteInfo.minChoices}</td>
                        <td>{voteInfo.maxChoices === 0 ? "" : voteInfo.maxChoices}</td>
                        <td>{voteInfo.voteId}</td>
                    </tr>
                    </tbody>
                </Table>

                <MenuTitle title={"투표 집계"} description={"투표 집계 정보를 실시간으로 보여줍니다."} />

                <div className={styles.numberOfParticipants}>
                    <div className={styles.text}>
                        참여자 수: <span id={styles.red}>{numberOfParticipants === undefined ? "-" : numberOfParticipants}명</span>
                    </div>
                </div>

                <Table striped bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th style={{textAlign: "center"}}>선택지 명</th>
                        <th style={{textAlign: "center"}}>득표 수</th>
                        <th style={{textAlign: "center"}}>득표 비율</th>
                    </tr>
                    </thead>
                    <tbody>
                        {votes?.map((data, key) => (
                            <tr key={`tr-${key}`}>
                                <td id={styles.choice}>{data.choice}</td>
                                <td id={styles.votes}>{data.votes}표</td>
                                <td id={styles.ratio}>{data.ratio}%</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>


            </AdminContainer>
        </>
    )
}