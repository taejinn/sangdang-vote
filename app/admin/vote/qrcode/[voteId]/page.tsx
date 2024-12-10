"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import {useEffect, useState} from "react";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useUser} from "@auth0/nextjs-auth0";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";
import {useParams} from "next/navigation";
import {Badge, Button, Form} from "react-bootstrap";
import Table from "react-bootstrap/Table";
import {MdOutlineOpenInNew} from "react-icons/md";
// import Link from "next/link";

export default function QrcodeView() {

    const {voteSocket} = useSocket();
    const [loading, setLoading] = useState(true);
    const {user} = useUser();
    const params = useParams<{ voteId: string }>();
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
    const [qrcodeUserOptions, setQrcodeUserOptions] = useState<{ voteStatus: boolean, voteCount: boolean, participantCount: boolean, liveConnectionStatus: boolean }>({
        voteCount: true,
        participantCount: true,
        liveConnectionStatus: true,
        voteStatus: true,
    })

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            try {
                if (voteSocket?.connected) {
                    const res = await voteSocket.emitWithAck('getVoteDetail', { uid: user?.sub, voteId: params.voteId });
                    setVoteInfo({
                        name: res.name,
                        choices: res.choices,
                        minChoices: res.minChoices,
                        maxChoices: res.maxChoices,
                        createdAt: res.createdAt,
                        status: res.status,
                        voteId: res.voteId,
                        votes: res.voteCount,
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

    if (loading) {
        return (
            <>
                <AdminContainer>
                    <PageTitle>QRCode</PageTitle>
                    <LiveConnectionStatus />
                    <MenuTitle title={"QRCode 확인"} description={"투표에 참여할 수 있는 QRCode를 확인합니다"} />
                    <AdminLoadingData />
                </AdminContainer>
            </>
        )
    }

    return (
        <>
            <AdminContainer>
                <PageTitle>QRCode</PageTitle>
                <LiveConnectionStatus />
                <MenuTitle title={"QRCode 확인"} description={"투표에 참여할 수 있는 QRCode를 확인합니다"} />

                <Table striped bordered className={styles.table}>
                    <thead>
                    <tr>
                        <th>투표 제목</th>
                        <th>투표 선택지</th>
                        <th>상태</th>
                        <th>선택 최소</th>
                        <th>선택 최대</th>
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
                        <td>{voteInfo?.minChoices === 0 ? "" : voteInfo?.minChoices}</td>
                        <td>{voteInfo?.maxChoices === 0 ? "" : voteInfo?.maxChoices}</td>
                        <td>{voteInfo?.voteId}</td>
                    </tr>
                    </tbody>
                </Table>

                <div className={styles.check}>
                    <Form.Check
                        label={<div className={styles.text}>실시간 통신 서버 상태 표시</div>}
                        checked={qrcodeUserOptions.liveConnectionStatus}
                        onChange={(e) => {
                            setQrcodeUserOptions((data) => ({
                                ...data, liveConnectionStatus: e.target.checked,
                            }))
                        }}
                    />
                    <Form.Check
                        label={<div className={styles.text}>투표 상태 표시</div>}
                        checked={qrcodeUserOptions.voteStatus}
                        onChange={(e) => {
                            setQrcodeUserOptions((data) => ({
                                ...data, voteStatus: e.target.checked,
                            }))
                        }}
                    />
                    <Form.Check
                        label={<div className={styles.text}>실시간 접속자 수 표시</div>}
                        checked={qrcodeUserOptions.participantCount}
                        onChange={(e) => {
                            setQrcodeUserOptions((data) => ({
                                ...data, participantCount: e.target.checked,
                            }))
                        }}
                    />
                    <Form.Check
                        label={<div className={styles.text}>실시간 투표자 수 표시</div>}
                        checked={qrcodeUserOptions.voteCount}
                        onChange={(e) => {
                            setQrcodeUserOptions((data) => ({
                                ...data, voteCount: e.target.checked,
                            }))
                        }}
                    />
                </div>

                <Button variant="info" className={styles.button} onClick={()=>window.open(`${process.env.NEXT_PUBLIC_URL}/admin/vote/qrcode/${voteInfo?.voteId}/view?voteStatus=${qrcodeUserOptions.voteStatus}&voteCount=${qrcodeUserOptions.voteCount}&participantCount=${qrcodeUserOptions.participantCount}&liveConnectionStatus=${qrcodeUserOptions.liveConnectionStatus}`, '_blank')}>
                    {/*<Link*/}
                    {/*    style={{textDecoration: "none", color: "black"}}*/}
                    {/*    // href={`${process.env.NEXT_PUBLIC_URL}/admin/vote/qrcode/${voteInfo?.voteId}/view?voteStatus=${qrcodeUserOptions.voteStatus}&voteCount=${qrcodeUserOptions.voteCount}&participantCount=${qrcodeUserOptions.participantCount}&liveConnectionStatus=${qrcodeUserOptions.liveConnectionStatus}`}*/}
                    {/*    // target="_blank"*/}
                    {/*>*/}
                    <MdOutlineOpenInNew size={15} /> QRCode 확인하기
                    {/*</Link>*/}
                </Button>
            </AdminContainer>
        </>
    )
}