"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import {useParams, useRouter} from "next/navigation";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";
import {Alert, Badge, Button} from "react-bootstrap";
import Table from "react-bootstrap/Table";
import formatDate from "@/components/formatDate/formatDate";

export default function VoteDelete() {

    const {voteSocket} = useSocket();
    const [loading, setLoading] = useState(true);
    const {user} = useUser();
    const params = useParams<{ voteId: string }>();
    const router = useRouter();
    const [voteInfo, setVoteInfo] = useState<{
        name: string,
        choices: string[],
        minChoices: number,
        maxChoices: number,
        createdAt: string,
        status: string,
        voteId: string,
        votes: number,
    }>();

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            try {

                // 어떤 부분은 voteSocket connected가 아닐때도 alert 띄우는 부분 있던걸로 기억함.
                // 일관성 맞출 것. (나중에)

                if (voteSocket?.connected) {
                    const res = await voteSocket.emitWithAck('voteCountingWithVoteDetails', { uid: user?.sub, voteId: params.voteId });
                    setVoteInfo({
                        name: res.data.info.name,
                        choices: res.data.info.choices,
                        minChoices: res.data.info.minChoices,
                        maxChoices: res.data.info.maxChoices,
                        createdAt: res.data.info.createdAt,
                        status: res.data.info.status,
                        voteId: res.data.info.voteId,
                        votes: res.data.votes.totalVotes,
                    });
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                alert("서버와 통신 중 오류가 발생하였습니다. 새로고침 후 다시 시도해주세요.");
            }
        }
        setVoteListData();
    }, [voteSocket?.connected, user?.sub, params.voteId]);

    const deleteVote = async () => {
        const check = confirm("해당 투표의 모든 정보가 삭제됩니다.\n\n계속하시겠습니까?");

        if (!check) {
            alert("취소하였습니다.");
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('deleteVote', {
                    voteId: voteInfo?.voteId,
                    uid: user?.sub,
                })
                if (res.status === "SUCCESS") {
                    alert("투표가 정상적으로 삭제되었습니다.");
                    router.push("/admin/vote/delete")
                } else {
                    alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
                }
            } catch (e) {
                console.error(e);
                alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
            }
        } else {
            alert("실시간 통신 서버와 연결되지 않았습니다.\n연결된 후 다시 시도해주세요.");
        }
    };

    const changeStatusButton = async () => {
        const check = confirm("투표 상태를 [종료]로 변경하시겠습니까?");

        if (!check) {
            alert("취소하였습니다.");
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('changeVoteStatus', {
                    voteId: voteInfo?.voteId,
                    uid: user?.sub,
                    status: "종료",
                })
                if (res.status === "SUCCESS") {
                    alert("투표 상태가 [종료]로 변경되었습니다.");
                    window.location.reload();
                } else {
                    alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
                }
            } catch (e) {
                console.error(e);
                alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
            }
        } else {
            alert("실시간 통신 서버와 연결되지 않았습니다.\n연결된 후 다시 시도해주세요.");
        }
    }

    if (loading) {
        return (
            <AdminContainer>
                <PageTitle>
                    투표 삭제
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"투표 삭제"} description={"선택한 투표의 모든 정보를 삭제합니다"} />
                <AdminLoadingData />
            </AdminContainer>
        );
    };

    if (!loading && voteInfo?.status !== "종료") {
        return (
            <>
                <AdminContainer>
                    <PageTitle>
                        투표 삭제
                    </PageTitle>
                    <LiveConnectionStatus />
                    <MenuTitle title={"투표 삭제"} description={"선택한 투표의 모든 정보를 삭제합니다"} />

                    <Table striped bordered className={styles.table}>
                        <thead>
                        <tr>
                            <th>투표 제목</th>
                            <th>투표 선택지</th>
                            <th>상태</th>
                            <th>참여자 수</th>
                            <th>선택 최소</th>
                            <th>선택 최대</th>
                            <th>생성일</th>
                            <th>투표 ID</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{voteInfo?.name}</td>
                            <td>{voteInfo?.choices?.map((data, key) => {
                                return (
                                    <div key={'choice-' + key}>
                                        {key + 1}. {data} <br/>
                                    </div>
                                )
                            })}</td>
                            <td>
                                {
                                    voteInfo?.status.length == 0 ? "" : voteInfo?.status === "시작" ?
                                        <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>
                                }
                            </td>
                            <td>{voteInfo?.votes}명</td>
                            <td>{voteInfo?.minChoices === 0 ? "" : voteInfo?.minChoices}</td>
                            <td>{voteInfo?.maxChoices === 0 ? "" : voteInfo?.maxChoices}</td>
                            <td>{formatDate(voteInfo?.createdAt)}</td>
                            <td>{voteInfo?.voteId}</td>
                        </tr>
                        </tbody>
                    </Table>

                    <Alert variant={"danger"} className={styles.voteWarning}>
                        상태가 <Badge bg="success">시작</Badge> 인 투표는 <Badge bg="danger">종료</Badge> 로 변경 후 수정할 수 있습니다.
                    </Alert>
                    <Button variant="danger" className={styles.changeStatusButton} onClick={changeStatusButton}>투표 상태 변경</Button>
                </AdminContainer>
            </>
        )
    }

    return (
        <>
            <AdminContainer>
                <PageTitle>
                    투표 삭제
                </PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"투표 삭제"} description={"선택한 투표의 모든 정보를 삭제합니다"} />

                <Table striped bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th>투표 제목</th>
                        <th>투표 선택지</th>
                        <th>상태</th>
                        <th>참여자 수</th>
                        <th>선택 최소</th>
                        <th>선택 최대</th>
                        <th>생성일</th>
                        <th>투표 ID</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{voteInfo?.name}</td>
                        <td>{voteInfo?.choices?.map((data, key) => {
                            return (
                                <div key={'choice-' + key}>
                                    {key + 1}. {data} <br/>
                                </div>
                            )
                        })}</td>
                        <td>
                            {
                                voteInfo?.status.length == 0 ? "" : voteInfo?.status === "시작" ?
                                    <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>
                            }
                        </td>
                        <td>{voteInfo?.votes}명</td>
                        <td>{voteInfo?.minChoices === 0 ? "" : voteInfo?.minChoices}</td>
                        <td>{voteInfo?.maxChoices === 0 ? "" : voteInfo?.maxChoices}</td>
                        <td>{formatDate(voteInfo?.createdAt)}</td>
                        <td>{voteInfo?.voteId}</td>
                    </tr>
                    </tbody>
                </Table>

                <Alert variant={"danger"} className={styles.voteWarning}>
                    <span id={styles.alertBold}>투표 삭제가 진행되면 절대 복구할 수 없으며, 제거되는 데이터는 아래와 같습니다.</span>
                    <ul style={{marginBottom: "0"}}>
                        <li>투표 정보(투표 이름, 투표 선택지, 최대 선택지, 최소 선택지, 투표 ID 등 투표의 모든 요소)</li>
                        <li>투표 집계 정보(해당 투표 ID로 투표된 모든 표)</li>
                    </ul>
                </Alert>

                <Button variant="danger" className={styles.button} onClick={deleteVote}>투표 삭제하기</Button>
            </AdminContainer>

        </>
    )

}