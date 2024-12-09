"use client";

import styles from "./page.module.css";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import 'bootstrap/dist/css/bootstrap.min.css';
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import {useParams, useRouter} from "next/navigation";
import {Badge, Button, Form} from "react-bootstrap";
import formatDate from "@/components/formatDate/formatDate";
import Table from "react-bootstrap/Table";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";

export default function StatusChange() {

    const {voteSocket} = useSocket();
    const {user} = useUser();
    const params = useParams<{ voteId: string }>();
    const [loading, setLoading] = useState(true);
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
    const [changeStatusValue, setChangeStatusValue] = useState<string>("");
    const [inputDisabled, setInputDisabled] = useState<boolean>(true);
    const router = useRouter();

    const changeStatus = (status: string) => {
        if (status == changeStatusValue) {
            return;
        }

        if (status !== "시작" && status !== "종료") {
            return;
        }

        // setVoteInfo(prevData => ({...prevData, status: status}));
        setChangeStatusValue(status);
    }

    const saveButton = async () => {

        setInputDisabled(true);
        let message: string;

        if (voteInfo.status == changeStatusValue) {
            message = "투표 상태가 이전과 동일합니다. 그래도 계속 진행하시겠습니까?";
        } else {
            message = "투표 상태를 변경하시겠습니까?";
        }

        const check = confirm(message);

        if (!check) {
            alert("취소하였습니다.");
            setInputDisabled(false);
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('changeVoteStatus', {
                    voteId: voteInfo?.voteId,
                    uid: user?.sub,
                    status: changeStatusValue,
                })
                if (res.status === "SUCCESS") {
                    setInputDisabled(false);
                    alert(`투표 상태가 [${changeStatusValue}](으)로 변경되었습니다.`);
                    // router.push("/admin/vote/status");
                    window.location.reload();
                } else {
                    setInputDisabled(false);
                    alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
                }
            } catch (e) {
                console.error(e);
                alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
                setInputDisabled(false);
                return;
            }
        }
    }

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            if (voteSocket?.connected) {
                const res = await voteSocket.emitWithAck('getVoteDetail', { uid: user?.sub, voteId: params.voteId[0] });
                setVoteInfo({
                    name: res.name,
                    choices: res.choices,
                    minChoices: res.minChoices,
                    maxChoices: res.maxChoices,
                    createdAt: res.createdAt,
                    status: res.status,
                    voteId: res.voteId,
                });
                setChangeStatusValue(res.status);
                setInputDisabled(false);
                setLoading(false);
            }
        }
        setVoteListData();
    }, [user?.sub, voteSocket?.connected]);

    if (loading) {
        return (
            <AdminContainer>
                <PageTitle>
                    투표 상태 변경
                </PageTitle>
                <LiveConnectionStatus />
                <AdminLoadingData style={{marginTop: "20px"}} />
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
                <MenuTitle title={"선택된 투표 정보"} description={"선택한 투표가 맞는지 확인하세요"} />
                <Table striped bordered className={styles.table}>
                    <thead>
                        <tr>
                            <th>투표 제목</th>
                            <th>투표 선택지</th>
                            <th>상태</th>
                            <th>선택 최소</th>
                            <th>선택 최대</th>
                            <th>생성일</th>
                            <th>투표 ID</th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{voteInfo.name}</td>
                        <td>{voteInfo.choices?.map((data, key) => {
                            return (
                                <div key={'choice-' + key}>
                                    {key + 1}. {data} <br/>
                                </div>
                            )
                        })}</td>
                        <td>
                            {
                                voteInfo.status === "" ? "" : voteInfo.status === "시작" ? <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>
                            }
                        </td>
                        <td>{voteInfo.minChoices === 0 ? "" : voteInfo.minChoices}</td>
                        <td>{voteInfo.maxChoices === 0 ? "" : voteInfo.maxChoices}</td>
                        <td>{voteInfo.createdAt === "" ? "" : formatDate(voteInfo.createdAt)}</td>
                        <td>{voteInfo.voteId}</td>
                    </tr>
                    </tbody>
                </Table>

                <MenuTitle title={"투표 상태 변경"} description={"선택한 투표의 상태를 변경합니다"} />

                <Form>
                    <Form.Check
                        disabled={inputDisabled}
                        checked={changeStatusValue == "시작"}
                        label={(
                            <div className={styles.radioText} id={styles.start}>
                                시작
                            </div>
                        )}
                        type={"radio"}
                        onChange={()=>changeStatus("시작")}
                    />
                    <Form.Check
                        disabled={inputDisabled}
                        checked={changeStatusValue == "종료"}
                        label={(
                            <div className={styles.radioText} id={styles.end}>
                                종료
                            </div>
                        )}
                        type={"radio"}
                        onChange={()=>changeStatus("종료")}
                    />
                </Form>

                <Table striped bordered className={styles.table} style={{marginTop: "20px", textAlign: "center"}}>
                    <thead>
                        <tr>
                            <th>변경 전</th>
                            <th className={styles.changeStatusBorder1}>변경 후</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {
                                    voteInfo.status === "" ? "" : voteInfo.status === "시작" ? <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>
                                }
                            </td>
                            <td className={styles.changeStatusBorder2}>{changeStatusValue === "" ? "" : changeStatusValue === "시작" ? <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>}</td>
                        </tr>
                    </tbody>
                </Table>

                <Button disabled={inputDisabled} variant="success" className={styles.saveButton} onClick={saveButton}>
                        상태 변경하기
                </Button>
            </AdminContainer>
        </>
    )
}