"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./page.module.css";
import PageTitle from "@/components/pageTitle/PageTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import AdminContainer from "@/components/adminContainer/AdminContainer";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {Button, ButtonGroup, Form, InputGroup} from "react-bootstrap";
import {useCallback, useEffect, useState} from "react";
import {useUser} from "@auth0/nextjs-auth0";
import {useParams, useRouter} from "next/navigation";

//
//
// 이미 1명이라도 투표했을 경우, 수정이 불가능하도록 하게 만들고,
// 이 페이지 접속 시 변경 메뉴는 모두 비활성화 후
// 투표 결과 미집계 및 초기화 할 수 있도록 버튼 추가할 것
//
//


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
    const router = useRouter();

    const [voteInfo, setVoteInfo] = useState<{
        name: string,
        choices: string[],
        minChoices: number,
        maxChoices: number,
        createdAt: string,
        status: string,
        voteId: string
    }>();

    useEffect(() => {
        const setVoteListData = async () => {
            if (user?.sub == null) return;
            if (voteSocket?.connected) {
                const res = await voteSocket.emitWithAck('getVoteDetail', { uid: user?.sub, voteId: params.voteId[0] });
                setVoteInfo(res);
                setUserInput({
                    name: res.name,
                    choices: res.choices,
                    minChoices: res.minChoices,
                    maxChoices: res.maxChoices,
                });
                setInputDisabled(false);
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

        const saveCheck = confirm("변경된 내용을 저장하시겠습니까?")

        if (!saveCheck) {
            alert("취소하였습니다.");
            return;
        }

        if (voteSocket?.connected) {
            const res = await voteSocket?.emitWithAck('saveVoteDetails', {
                voteId: voteInfo?.voteId,
                uid: user?.sub,
                data: userInput,
            })
            if (res.status === "SUCCESS") {
                alert("저장되었습니다.");
                router.push("/admin/vote/edit");
            } else {
                alert("알 수 없는 오류가 발생하였습니다.\n새로고침 후 다시 시도해주세요.");
            }
        } else {
            alert("실시간 통신 서버와 연결되지 않았습니다.\n연결된 후 다시 시도해주세요.");
        }
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