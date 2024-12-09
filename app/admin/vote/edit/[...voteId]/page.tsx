"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {Alert, Badge, Button, ButtonGroup, Form, InputGroup} from "react-bootstrap";
import {useCallback, useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import {useParams} from "next/navigation";
import AdminLoadingData from "@/components/adminLoadingData/AdminLoadingData";
import Table from "react-bootstrap/Table";

export default function EditVote() {
    const {voteSocket} = useSocket();
    const { user } = useUser();
    const params = useParams<{ voteId: string }>();
    const [inputDisabled, setInputDisabled] = useState<boolean>(true);
    const [userInput, setUserInput] = useState<{
        name: string, choices: string[], minChoices: number, maxChoices: number
    }>({
        name: "", choices: [], minChoices: 0, maxChoices: 0
    });
    const [voteResetRequired, setVoteResetRequired] = useState<boolean | 'loading'>('loading');
    const [loading, setLoading] = useState(true);

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
            if (voteSocket?.connected) {
                const res = await voteSocket.emitWithAck('getVoteDetailListWithVotes', { uid: user?.sub, voteId: params.voteId[0] });
                const res2 = await voteSocket.emitWithAck('voteAllCounting', { uid: user?.sub, voteId: params.voteId[0] });
                if (res2.status === "SUCCESS") {
                    if (res2.data.count != 0) {
                        setVoteResetRequired(true);
                        setInputDisabled(true);
                    }
                }
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
                setUserInput({
                    name: res.name,
                    choices: res.choices,
                    minChoices: res.minChoices,
                    maxChoices: res.maxChoices,
                });
                setInputDisabled(false);
                setLoading(false);
            }
        }
        setVoteListData();
    }, [voteSocket?.connected, user?.sub, params.voteId]);

    const changeChoiceValue = useCallback((key: number, value: string) => {
        setUserInput(prevInput => ({
            ...prevInput,
            choices: prevInput.choices.map((choice, index) =>
                index === key ? value : choice
            )
        }));
    }, []);

    const addChoice = useCallback(() => {
        setUserInput(prevInput => ({
            ...prevInput,
            choices: [...prevInput.choices, ''],
        }));
    }, []);

    const removeLastChoice = useCallback(() => {
        setUserInput(prevInput => ({
            ...prevInput,
            choices: prevInput.choices.slice(0, -1),
        }));
    }, []);

    const changeMinChoicesValue = (value: string) => {
        const filteredNumbers = Number(value.replace(/\D/g, ''));
        if (filteredNumbers < 0) return;
        setUserInput(prevInput => ({
            ...prevInput,
            minChoices: filteredNumbers,
        }));
    };

    const changeMaxChoicesValue = (value: string) => {
        const filteredNumbers = Number(value.replace(/\D/g, ''));
        if (filteredNumbers < 0) return;
        setUserInput(prevInput => ({
            ...prevInput,
            maxChoices: filteredNumbers,
        }));
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

    const resetButton = async () => {
        const check = confirm("투표 집계 초기화를 진행하시겠습니까?");

        if (!check) {
            alert("취소하였습니다.");
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('resetVotes', {
                    voteId: voteInfo?.voteId,
                    uid: user?.sub,
                })
                if (res.status === "SUCCESS") {
                    alert("투표 집계가 초기화되었습니다.");
                    // setVoteResetRequired(false);
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

    const saveButton = async () => {

        if (userInput.name.trim().length < 1) {
            alert("[투표 이름]을 1글자 이상 입력해주세요.");
            return;
        }

        if (userInput.choices.length == 0) {
            alert("[투표 선택지]는 최소 1개가 있어야합니다.");
            return;
        }

        let choiceStringLengthIsZero = false;
        userInput.choices.map((choice) => {
            if (choice.length == 0) choiceStringLengthIsZero = true;
        })

        if (choiceStringLengthIsZero) {
            alert("[투표 선택지]는 빈 칸이 허용되지 않습니다.");
            return;
        }

        if (userInput.minChoices == 0 || userInput.maxChoices == 0) {
            alert("[최소 선택 개수] 또는 [최대 선택 개수]는 '0'이 될 수 없습니다.");
            return;
        }

        if (userInput.minChoices > userInput.maxChoices) {
            alert("[최소 선택 개수]는 [최대 선택 개수]보다 클 수 없습니다.");
            return;
        }

        if (userInput.choices.length < userInput.maxChoices) {
            alert("[투표 선택지]의 개수보다 [최대 선택 개수]가 큽니다.");
            return;
        }

        if (userInput.choices.length < userInput.minChoices) {
            alert("[투표 선택지]의 개수보다 [최소 선택 개수]가 큽니다.");
            return;
        }

        const checkJungbok = new Set(userInput.choices);
        if (checkJungbok.size != userInput.choices.length) {
            alert("[투표 선택지]의 선택지 중 중복되는 선택지가 있습니다.\n같은 선택지가 2개 이상 존재할 수 없습니다.");
            return;
        }

        setInputDisabled(true);
        const saveCheck = confirm("변경된 내용을 저장하시겠습니까?");

        if (!saveCheck) {
            alert("취소하였습니다.");
            setInputDisabled(false);
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('saveVoteDetails', {
                    voteId: voteInfo?.voteId,
                    uid: user?.sub,
                    data: userInput,
                })
                if (res.status === "SUCCESS") {
                    setInputDisabled(false);
                    alert("저장되었습니다.");
                    window.location.reload();
                } else {
                    setInputDisabled(false);
                    alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
                }
            } catch (e) {
                console.error(e);
                setInputDisabled(false);
                alert("알 수 없는 오류가 발생하였습니다.\n잠시 후 다시 시도해주세요.");
            }
        } else {
            setInputDisabled(false);
            alert("실시간 통신 서버와 연결되지 않았습니다.\n연결된 후 다시 시도해주세요.");
        }
    }

    if (loading) {
        return (
            <>
                <AdminContainer>
                    <PageTitle>투표 정보 수정</PageTitle>
                    <LiveConnectionStatus/>
                    <MenuTitle title={"투표 수정"} description={"투표를 클릭하여 정보를 수정합니다"}/>
                    <AdminLoadingData />
                </AdminContainer>
            </>
        )
    }

    if (voteInfo?.status == "시작") {
        return (
            <>
                <AdminContainer>
                    <PageTitle>투표 정보 수정</PageTitle>
                    <LiveConnectionStatus/>
                    <MenuTitle title={"투표 수정"} description={"투표를 클릭하여 정보를 수정합니다"}/>
                    <Table striped bordered className={styles.table}>
                        <thead>
                        <tr>
                            <th>투표 제목</th>
                            <th>투표 선택지</th>
                            <th>상태</th>
                            <th>투표자 수</th>
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
                            <td>{voteInfo?.votes}명</td>
                            <td>{voteInfo?.minChoices === 0 ? "" : voteInfo?.minChoices}</td>
                            <td>{voteInfo?.maxChoices === 0 ? "" : voteInfo?.maxChoices}</td>
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

    if (!loading && voteResetRequired !== "loading" && voteResetRequired) {
        return (
            <>
                <AdminContainer>
                    <PageTitle>투표 정보 수정</PageTitle>
                    <LiveConnectionStatus/>
                    <MenuTitle title={"투표 수정"} description={"투표를 클릭하여 정보를 수정합니다"}/>
                    <Table striped bordered className={styles.table}>
                        <thead>
                        <tr>
                            <th>투표 제목</th>
                            <th>투표 선택지</th>
                            <th>상태</th>
                            <th>투표자 수</th>
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
                                    voteInfo?.status === "" ? "" : voteInfo?.status === "시작" ?
                                        <Badge bg="success">시작</Badge> : <Badge bg="danger">종료</Badge>
                                }
                            </td>
                            <td>{voteInfo?.votes}명</td>
                            <td>{voteInfo?.minChoices === 0 ? "" : voteInfo?.minChoices}</td>
                            <td>{voteInfo?.maxChoices === 0 ? "" : voteInfo?.maxChoices}</td>
                            <td>{voteInfo?.voteId}</td>
                        </tr>
                        </tbody>
                    </Table>
                    <Alert variant={"danger"} className={styles.voteWarning}>
                        이미 1표 이상 투표가 집계되었으므로 집계 초기화 진행 후 수정이 가능합니다.
                        <br/>
                        아래 버튼을 클릭 시 초기화 후 투표 수정이 가능합니다.
                    </Alert>
                    <Button variant="danger" className={styles.resetButton} onClick={resetButton}>투표 집계 초기화</Button>
                </AdminContainer>
            </>
        )

    }

    return (
        <>
            <AdminContainer>
                <PageTitle>투표 정보 수정</PageTitle>
                <LiveConnectionStatus/>
                <MenuTitle title={"투표 수정"} description={"투표를 클릭하여 정보를 수정합니다"}/>

                <div className={styles.formTitle}>투표 제목</div>
                <Form.Control
                    placeholder={voteInfo?.name}
                    className={styles.formInput}
                    type="text"
                    id="inputTitle"
                    aria-describedby="inputTitle"
                    disabled={inputDisabled}
                    value={userInput.name}
                    onChange={(e) => setUserInput({...userInput, name: e.target.value})}
                />

                <div className={styles.formTitle}>투표 선택지</div>
                {userInput.choices.map((choice, key) => (
                    <InputGroup key={key} className={styles.inputGroup}>
                        <InputGroup.Text className={styles.inputNumber}>{key + 1}</InputGroup.Text>
                        <Form.Control
                            // placeholder={voteInfo?.choices[key] || ''}
                            className={styles.formInput}
                            type="text"
                            disabled={inputDisabled}
                            value={choice}
                            onChange={(e) => {
                                changeChoiceValue(key, e.target.value)
                            }}
                        />
                    </InputGroup>
                ))}
                <ButtonGroup className={styles.buttonGroup}>
                    <Button
                        className={styles.buttonGroupButton}
                        variant="success"
                        onClick={addChoice}
                    >
                        선택지 추가
                    </Button>
                    <Button
                        className={styles.buttonGroupButton}
                        variant="danger"
                        onClick={removeLastChoice}
                    >
                        마지막 선택지 삭제
                    </Button>
                </ButtonGroup>

                <div className={styles.formTitle}>최소 선택 개수</div>
                <Form.Control
                    className={styles.formInput}
                    type="text"
                    aria-describedby="inputTitle"
                    disabled={inputDisabled}
                    value={userInput.minChoices}
                    onChange={(e) => changeMinChoicesValue(e.target.value)}
                />

                <div className={styles.formTitle}>최대 선택 개수</div>
                <Form.Control
                    className={styles.formInput}
                    type="text"
                    aria-describedby="inputTitle"
                    disabled={inputDisabled}
                    value={userInput.maxChoices}
                    onChange={(e) => changeMaxChoicesValue(e.target.value)}
                />

                <Button variant="success" className={styles.saveButton} onClick={saveButton}>저장하기</Button>
            </AdminContainer>
        </>
    )
}