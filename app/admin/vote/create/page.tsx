"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import AdminContainer from "@/components/adminContainer/AdminContainer";
import PageTitle from "@/components/pageTitle/PageTitle";
import MenuTitle from "@/components/menuTitle/MenuTitle";
import LiveConnectionStatus from "@/components/liveConnectionStatus/LiveConnectionStatus";
import {useCallback, useState} from "react";
import {useSocket} from "@/components/socketProvider/SocketProvider";
import {useUser} from "@auth0/nextjs-auth0";
import styles from "@/app/admin/vote/create/page.module.css";
import {Alert, Badge, Button, ButtonGroup, Form, InputGroup} from "react-bootstrap";
import {useRouter} from "next/navigation";

export default function Create() {

    const {voteSocket} = useSocket();
    const router = useRouter();
    const { user } = useUser();
    const [inputDisabled, setInputDisabled] = useState<boolean>(false);
    const [userInput, setUserInput] = useState<{
        name: string, choices: string[], minChoices: number, maxChoices: number
    }>({
        name: "", choices: [''], minChoices: 0, maxChoices: 0 // choices 1개는 미리 생성해둠
    });

    const saveButton = async () => {

        setInputDisabled(true);

        if (userInput.name.trim().length < 1) {
            alert("[투표 이름]을 1글자 이상 입력해주세요.");
            setInputDisabled(false);
            return;
        }

        if (userInput.choices.length == 0) {
            alert("[투표 선택지]는 최소 1개가 있어야합니다.");
            setInputDisabled(false);
            return;
        }

        let choiceStringLengthIsZero = false;
        userInput.choices.map((choice) => {
            if (choice.length == 0) choiceStringLengthIsZero = true;
        })

        if (choiceStringLengthIsZero) {
            setInputDisabled(false);
            alert("[투표 선택지]는 빈 칸이 허용되지 않습니다.");
            return;
        }

        if (userInput.minChoices == 0 || userInput.maxChoices == 0) {
            setInputDisabled(false);
            alert("[최소 선택 개수] 또는 [최대 선택 개수]는 '0'이 될 수 없습니다.");
            return;
        }

        if (userInput.minChoices > userInput.maxChoices) {
            setInputDisabled(false);
            alert("[최소 선택 개수]는 [최대 선택 개수]보다 클 수 없습니다.");
            return;
        }

        if (userInput.choices.length < userInput.maxChoices) {
            setInputDisabled(false);
            alert("[투표 선택지]의 개수보다 [최대 선택 개수]가 큽니다.");
            return;
        }

        if (userInput.choices.length < userInput.minChoices) {
            setInputDisabled(false);
            alert("[투표 선택지]의 개수보다 [최소 선택 개수]가 큽니다.");
            return;
        }

        const checkJungbok = new Set(userInput.choices);
        if (checkJungbok.size != userInput.choices.length) {
            setInputDisabled(false);
            alert("[투표 선택지]의 선택지 중 중복되는 선택지가 있습니다.\n같은 선택지가 2개 이상 존재할 수 없습니다.");
            return;
        }

        const saveCheck = confirm("투표를 생성하시겠습니까?");

        if (!saveCheck) {
            alert("취소하였습니다.");
            setInputDisabled(false);
            return;
        }

        if (voteSocket?.connected) {
            try {
                const res = await voteSocket?.emitWithAck('createVote', {
                    uid: user?.sub,
                    ...userInput,
                })
                if (res.status === "SUCCESS") {
                    setInputDisabled(false);
                    alert("투표가 생성되었습니다.");
                    router.push("/admin/vote/list");
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

    return (
        <>
            <AdminContainer>
                <PageTitle>투표 생성</PageTitle>
                <LiveConnectionStatus/>
                <MenuTitle title={"투표 생성하기"} description={"진행하고자 하는 투표를 생성합니다"}/>

                <Alert variant={"info"} className={styles.voteWarning}>
                    <span id={styles.bold}>※ 투표 생성 시 참고하세요</span>
                    <ul style={{marginBottom: "0"}}>
                        <li>투표 ID는 5~15자리의 무작위 문자열로 생성됩니다.</li>
                        <li>투표 상태의 기본 값은 <Badge bg="danger">종료</Badge> 입니다.</li>
                    </ul>
                </Alert>

                <div className={styles.formTitle}>투표 제목</div>
                <Form.Control
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

                <Button variant="success" className={styles.saveButton} onClick={saveButton}>투표 생성하기</Button>
            </AdminContainer>
        </>
    )
}