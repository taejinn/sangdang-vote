'use client';

import styles from "./page.module.css";
import Header from "@/components/header/Header";
import Container from "@/components/container/Container";
import {useSearchParams} from "next/navigation";
import {IoMdAlert, IoMdCheckmarkCircle} from "react-icons/io";
import {BarLoader, PulseLoader} from "react-spinners";
import {Suspense, useEffect, useState} from "react";
import axios from "axios";
import {io, Socket} from "socket.io-client";

function VoteContent() {

    const searchParams = useSearchParams()
    const voteId = searchParams.get("id")

    const [progress, setProgress] = useState<string>("checkVoteId")
    const [socket, setSocket] = useState<Socket | null>(null);
    const [liveClientCount, setLiveClientCount] = useState<number | '-'>('-');
    const [studentId, setStudentId] = useState<string>("");
    const [inputError, setInputError] = useState<boolean>(false);
    const [voteInfo, setVoteInfo] = useState<{ name: string, choices: string[], maxChoices: number, minChoices: number }>({
        name: "", choices: [], maxChoices: 0, minChoices: 0,
    });
    const [userVote, setUserVote] = useState<{ choices: string[] }>({ choices: [] });
    const [isVoteLoading, setIsVoteLoading] = useState<boolean>(false);
    const [isVoteSaveLoading, setIsVoteSaveLoading] = useState<boolean>(false);
    const [voteSubmitButtonDisabled, setVoteSubmitButtonDisabled] = useState<boolean>(true);
    const [liveConnectStatus, setLiveConnectStatus] = useState<"GOOD" | "BAD" | "UNKNOWN">("UNKNOWN");

    const MAX_RETRIES = 50;
    const RETRY_DELAY = 2000; // 2초

    useEffect(() => {
        const interval = setInterval(async () => {
            if (socket?.connected) {
                try {
                    const data = await socket.emitWithAck("countConnectedClients");
                    setLiveClientCount(data)
                    setLiveConnectStatus("GOOD")
                } catch (err) {
                    setLiveConnectStatus("BAD")
                    console.error("서버 응답 실패:", err);
                }
            }
        }, 500);

        return () => clearInterval(interval);
    }, [socket]);

    useEffect(() => {
        socket?.on("voteStatusIsEnded", (data) => {
            if (voteId == data) {
                setProgress("voteIsEnded");
            }
        })
    }, [socket]);

    const isValidVote = async () => { // true: 투표 진행 중 / false: 투표 진행 불가 및 유효하지 않음
        let validVote: boolean = false;
        let error: boolean = false;
        try {
            const data = await axios({
                method: "GET",
                url: process.env.NEXT_PUBLIC_API_URL + "/v1/vote/status",
                params: {
                    id: voteId,
                }
            })
            if (data.data.status == "SUCCESS" && data.data.data?.status == "시작") {
                validVote = true;
            }
        } catch (err) {
            console.error(err);
            error = true;
        }

        return { validVote: validVote, error: error };
    }

    useEffect(() => {
        const initialProgress = async () => {
            const nowVote = await isValidVote();
            if (nowVote.validVote) {
                setProgress("inputStudentId");

                const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL + "/vote", {
                    reconnectionDelay: 100,
                });
                setSocket(socketInstance);

                socketInstance.on("connect", () => {
                    setLiveConnectStatus("GOOD")
                    console.log("소켓 서버에 연결되었습니다.");
                });

                socketInstance.on("connect_error", () => {
                    setLiveConnectStatus("BAD")
                })

                return () => {
                    setLiveConnectStatus("BAD")
                    socketInstance.disconnect();
                };
            } else if (nowVote.error) {
                setLiveConnectStatus("BAD")
                setProgress("errorVote");
                return
            } else {
                setLiveConnectStatus("BAD")
                setProgress("invalidVote");
                return
            }
        }
        initialProgress();
    }, []);

    // voteId가 없어나 공백일 경우
    if (voteId == null || voteId === "") {
        return (
            <>
                <Container>
                    <div className={styles.title}>
                        <div className={styles.text}>
                            🗳️ 투표 참여하기
                        </div>
                    </div>
                    <div className={styles.notice}>
                        <div className={styles.text}>
                            투표 참여는 주어진 QR코드를 인식 후 참여 가능합니다.
                        </div>
                    </div>
                </Container>
            </>
        )
    }

    // const changeOnlyNumber = (text: string) => {
    //     const regex = /^[0-9]{0,5}$/;
    //     return regex.test(text) ? text : text.slice(0, 5).replace(/[^0-9]/g, '');
    // }

    const changeOnlyNumber = (text: string) => {
        const regex = /[^0-9]/g
        return text.replace(regex, '')
    }

    const studentIdInput = (vaule: string) => {
        const changeInputValue = changeOnlyNumber(vaule);
        if (changeInputValue.length > 5) return
        setStudentId(changeInputValue)
    }

    const checkStudentId = (studentId: string) => {
        // 학번은 5자리
        if(String(studentId).length != 5) {
            return false
        }
        // 1, 2, 3학년만 통과
        if (Number(studentId.charAt(0)) <= 0 || Number(studentId.charAt(0)) >= 4) {
            return false;
        }
        // 1~10반까지 통과
        if (Number(studentId.slice(1, 3)) <= 0 || Number(studentId.slice(1, 3)) >= 11) {
            return false;
        }
        // 1~35번 까지 통과
        if (Number(studentId.slice(3)) <= 0 || Number(studentId.slice(3)) >= 36) {
            return false;
        }
        return true
    }

    const studentIdFormButton = async () => {
        setInputError(false);
        const check = checkStudentId(studentId);
        if (!check) {
            setInputError(true);
            return;
        }

        // 로딩 화면 띄우기
        setIsVoteLoading(true);

        let retries = 0;
        while (retries < MAX_RETRIES) {
            if (socket?.connected) {
                try {
                    const voteData = await socket.emitWithAck("getVoteData", {
                        studentId: studentId,
                        voteId: voteId,
                    });

                    if (voteData?.status == "ERROR") {
                        setIsVoteLoading(false);
                        setProgress("deadlineVote");
                        socket.disconnect();
                        setSocket(null);
                        setLiveConnectStatus("BAD")
                        return;
                    }

                    if (voteData?.data.voteResult != null) {
                        setIsVoteLoading(false);
                        setProgress("alreadyVoted");
                        setLiveConnectStatus("GOOD")
                        setVoteInfo({
                            name: voteData?.data.voteInfo.name,
                            choices: voteData?.data.voteInfo.choices,
                            maxChoices: voteData?.data.voteInfo.maxChoices,
                            minChoices: voteData?.data.voteInfo.minChoices,
                        });
                        setUserVote({ choices: voteData.data.voteResult.choices });
                        return;
                    }

                    setVoteInfo({
                        name: voteData?.data.voteInfo.name,
                        choices: voteData?.data.voteInfo.choices,
                        maxChoices: voteData?.data.voteInfo.maxChoices,
                        minChoices: voteData?.data.voteInfo.minChoices,
                    });
                    setIsVoteLoading(false);
                    setProgress("startVote");
                    setLiveConnectStatus("GOOD")
                    return;

                } catch (err) {
                    setLiveConnectStatus("BAD")
                    console.error("서버 응답 실패:", err);
                    // 에러 발생 시 재시도
                    retries++;
                }
            } else {
                // 소켓이 연결되어 있지 않은 경우
                setLiveConnectStatus("BAD")
                console.log("소켓 연결 끊김. 재시도...");
                retries++;
            }

            // 딜레이
            if (retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
        }

        // 최대 재시도 횟수 초과
        setIsVoteLoading(false);
        setProgress("errorVote");
    };

    const voteSelectionClick = (data: string) => {
        let currentVote = userVote.choices;
        if (currentVote.includes(data)){
            currentVote = currentVote.filter(item => item != data);
        } else {
            currentVote.push(data)
        }
        setUserVote({ choices: currentVote });

        // [중요] 투표는 무조건 최소 1개를 선택해야함. 관리자도 최소 1개를 지정하게 해야함.
        if (currentVote.length == 0) {
            setVoteSubmitButtonDisabled(true);
            return;
        }
        if (currentVote.length < voteInfo.minChoices) {
            setVoteSubmitButtonDisabled(true);
            return;
        }
        if (currentVote.length > voteInfo.maxChoices) {
            setVoteSubmitButtonDisabled(true);
            return;
        }

        setVoteSubmitButtonDisabled(false);

    }

    const sortArrayBasedOnAnother = (a: string[], b: string[]): string[] => {
        return b.sort((x, y) => a.indexOf(x) - a.indexOf(y));
    };

    const voteSubmitButton = async () => {
        setIsVoteSaveLoading(true);
        setVoteSubmitButtonDisabled(true);

        const userVotes = sortArrayBasedOnAnother(voteInfo.choices, userVote.choices);

        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                const response = await emitWithPromise('saveStudentVote', {
                    voteId: voteId,
                    studentId: studentId,
                    choices: userVotes,
                });

                if (response.status === "SUCCESS" && response.code === "VOTED") {
                    setLiveConnectStatus("GOOD")
                    setProgress("voteSuccess");
                    return;
                } else if (response.status === "SUCCESS" && response.code === "ALREADY_VOTED") {
                    setLiveConnectStatus("GOOD")
                    setProgress("alreadyVoted");
                    console.log(response.data.choices);
                    setUserVote({ choices: response.data.choices });
                    return;
                } else {
                    throw new Error(response.code || "Unknown error");
                }
            } catch (error) {
                console.error('Error submitting vote:', error);
                setLiveConnectStatus("BAD")
                retries++;
                if (retries < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                }
            } finally {
                setIsVoteLoading(false);
                setVoteSubmitButtonDisabled(false);
            }
        }

        // 최대 재시도 횟수 초과
        setProgress("errorVote");
    }

    const emitWithPromise = (eventName: string, data: { voteId: string; studentId: string; choices: string[]; }) => {
        return new Promise<{ status: string, code: string, data: { choices: string[] } }>((resolve) => {
            socket?.emit(eventName, data, (response: { status: string, code: string, data: { choices: string[] } }) => {
                resolve(response);
            });
        });
    };

    // 이미 마감 된 투표일 경우

    const invalidVote = (
        <div className={styles.alert}>
            <IoMdAlert style={{color: 'black'}} size={30}/>
            <div className={styles.text}>참여할 수 없는 투표입니다</div>
        </div>
    )

    const errorVote = (
        <div className={styles.alert}>
            <IoMdAlert style={{color: 'black'}} size={30}/>
            <div className={styles.text}>오류가 발생하였습니다</div>
            <div className={styles.miniText}>잠시 후 다시 시도해주세요</div>
        </div>
    )

    const deadlineVote = (
        <div className={styles.alert}>
            <IoMdAlert style={{color: 'black'}} size={30}/>
            <div className={styles.text}>투표가 마감되었습니다</div>
        </div>
    )

    const voteEnded = (
        <div className={styles.alert}>
            <IoMdAlert style={{color: 'black'}} size={30}/>
            <div className={styles.text}>투표가 종료되었습니다.</div>
        </div>
    )

    // voteId가 정상일 경우

    const checkVoteId = (
        <div className={styles.loading}>
            {/*<IoMdAlert style={{color: 'black'}} size={30}/>*/}
            <div className={styles.loader}>
                <PulseLoader color={'#000000'}/>
            </div>
            <div className={styles.text}>잠시만 기다려주세요</div>
            <div className={styles.miniText}>투표 유효성 검사 중</div>
        </div>
    )

    const inputStudentId = (
        <>
            <div className={styles.title}>
                <div className={styles.text}>
                    🗳️ 투표 참여하기
                </div>
            </div>

            <div className={styles.box}>
                <div className={styles.label}>
                    본인의 학번을 입력해주세요 (숫자, 5자리) <span id={styles.required}>[필수]</span>
                </div>
                <input
                    className={styles.input}
                    placeholder={'학번'}
                    onChange={(e) => {
                        studentIdInput(e.target.value)
                    }}
                    value={studentId}
                    id={(inputError && styles.inputError) || undefined}
                />
                {inputError && (
                    <div className={styles.errorMessage}>올바르지 않은 학번입니다</div>
                )}
                <div className={styles.miniText}>
                    → 정확한 투표 집계를 위해 학번이 필요합니다.<br/>→ 1인 1표를 따르며, <span id={styles.highlight}>다른 학생의 학번을 도용하는 경우가 적발 될 시 참여가 제한됩니다.</span>
                </div>
            </div>

            <div className={styles.button} onClick={studentIdFormButton}>
                <div className={styles.text}>
                    입력 완료
                </div>
            </div>

            {isVoteLoading && (
                <div className={styles.voteLoadingBackground}>
                    <div className={styles.voteLoading}>
                        <div className={styles.text}>
                            불러오는 중
                        </div>
                        <div className={styles.miniText}>
                            잠시만 기다려주세요
                        </div>
                        <BarLoader/>
                    </div>
                </div>
            )}
        </>
    )

    const liveCount = (
        <div className={styles.status}>
            <div className={styles.box}>
                <div className={styles.circle} id={
                    (liveConnectStatus == "GOOD" && styles.statusSuccess) ||
                    (liveConnectStatus == "BAD" && styles.statusError) ||
                    (liveConnectStatus == "UNKNOWN" && styles.statusUnknown) ||
                    undefined
                }></div>
                <div className={styles.text}>
                    {liveConnectStatus == "GOOD" && (
                      `실시간 통신 중, ${liveClientCount}명 동시 접속 중`
                    )}
                    {liveConnectStatus == "BAD" && (
                        "실시간 서버에 다시 연결 중..."
                    )}
                    {liveConnectStatus == "UNKNOWN" && (
                        "실시간 서버 연결 중"
                    )}
                </div>
            </div>
        </div>
    )

    const startVote = (
        <div key={'startVote-1'}>
            <div className={styles.question}>
                <div className={styles.text}>
                    Q. {voteInfo?.name}
                </div>
            </div>
            <div className={styles.maxChoice}>
                <IoMdAlert style={{color: 'black'}} size={20}/>
                <div className={styles.text}>최소 {voteInfo?.minChoices}개, 최대 {voteInfo?.maxChoices}개 선택 가능합니다.</div>
            </div>
            <div className={styles.selection} key={'selection-1'}>
                {voteInfo?.choices?.map((data, key) => {
                    return (
                        <div
                            key={key}
                            className={styles.item}
                            id={userVote.choices.includes(data) ? styles.selected : undefined}
                            onClick={() => voteSelectionClick(data)}
                        >
                            <div className={styles.box}>
                                <div className={styles.number}>
                                    {key + 1}
                                </div>
                            </div>
                            <div className={styles.text}>
                                {data}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div
                className={styles.voteSubmitButton}
                id={voteSubmitButtonDisabled ? styles.voteSubmitButtonDisabled :  undefined}
                onClick={voteSubmitButtonDisabled ? ()=>{} : () => voteSubmitButton()}
            >
                <div className={styles.text}>투표 하기</div>
            </div>
            {isVoteSaveLoading && (
                <div className={styles.voteLoadingBackground}>
                    <div className={styles.voteLoading}>
                        <div className={styles.text}>
                            투표 전송 중
                        </div>
                        <div className={styles.miniText}>
                            잠시만 기다려주세요
                        </div>
                        <BarLoader/>
                    </div>
                </div>
            )}
        </div>
    )

    const alreadyVoted = (
        <div key={'alreadyVoted-1'}>
            <div className={styles.question}>
                <div className={styles.text}>
                    Q. {voteInfo?.name}
                </div>
            </div>
            <div className={styles.alreadyVoted}>
                <IoMdAlert style={{color: 'white'}} size={20}/>
                <div className={styles.text}>중복 투표는 불가능하며, 귀하의 투표 내역은 다음과 같습니다</div>
            </div>
            <div className={styles.selection}>
                {userVote?.choices?.map((data, key) => {
                    return (
                        <div
                            key={key}
                            className={styles.item}
                            id={styles.voted}
                        >
                            <div className={styles.box}>
                                <div className={styles.number}>
                                    {key + 1}
                                </div>
                            </div>
                            <div className={styles.text}>
                                {data}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const voteSuccess = (
        <>
            <div className={styles.alert} id={styles.voteSuccess}>
                <IoMdCheckmarkCircle style={{color: 'green'}} size={30}/>
                <div className={styles.text}>정상적으로 투표되었습니다</div>
                <div className={styles.miniText}><span id={styles.bold}>[{userVote.choices.join(", ")}]</span>에 투표됨</div>
            </div>
        </>
    )

    return (
        <>
                {(progress !== "checkVoteId" && progress !== "invalidVote" && progress !== "deadlineVote" && progress !== "errorVote") ? liveCount : null}

                {progress == "checkVoteId" ? checkVoteId : null}

                {progress == "inputStudentId" ? inputStudentId : null}

                {progress == "invalidVote" ? invalidVote : null}

                {progress == "deadlineVote" ? deadlineVote : null}

                {progress == "startVote" ? startVote : null}

                {progress == "alreadyVoted" ? alreadyVoted : null}

                {progress == "voteSuccess" ? voteSuccess : null}

                {progress == "errorVote" ? errorVote : null}

                {progress == "voteIsEnded" ? voteEnded : null}
        </>
    );
}

export default function Vote() {
    return (
        <>
            <Header />
            <Container>
                <Suspense fallback={<div>불러오는 중...</div>}>
                    <VoteContent />
                </Suspense>
            </Container>
        </>
    );
}