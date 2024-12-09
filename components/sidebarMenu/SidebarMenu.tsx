"use client";

import {Menu, MenuItem, Sidebar, sidebarClasses} from "react-pro-sidebar";
import styles from "./SidebarMenu.module.css";
import React from "react";
import {usePathname, useRouter} from "next/navigation";
import {IoMdAdd, IoMdHome, IoMdList} from "react-icons/io";
import {MdEditNote, MdHowToVote} from "react-icons/md";
import {IoQrCode, IoStopwatch} from "react-icons/io5";

export default function SidebarMenu() {

    const router = useRouter();
    const path = usePathname();

    if (path.split("/").at(-1) === "view" && path.split("/").at(-3) === "qrcode") {
        return;
    }

    return (
        <>
            <Sidebar
                rootStyles={{
                    [`.${sidebarClasses.container}`]: {
                        position: "fixed",
                        width: "250px",
                        marginRight: "20px",
                    },
                }}
            >
                <Menu>
                    <div className={styles.sidebarTitle}>
                        <div className={styles.text}>
                            <span id={styles.titleGradient}>
                                전자투표시스템
                            </span>
                            <br/>관리자 페이지
                        </div>
                    </div>
                    <div className={styles.logout} onClick={()=>router.push("/auth/logout")}>
                        <div className={styles.text}>
                            로그아웃
                        </div>
                    </div>
                    <MenuItem
                        onClick={() => router.push('/admin')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<IoMdHome size={20} />}
                    >
                        홈
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/list')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<IoMdList size={20} />}
                    >
                        투표 목록
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/create')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<IoMdAdd size={20} />}
                    >
                        투표 생성
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/edit')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<MdEditNote size={20} />}
                    >
                        투표 정보 수정
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/status')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<IoStopwatch size={20} />}
                    >
                        투표 상태 변경
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/count')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<MdHowToVote size={20} />}
                    >
                        투표 집계
                    </MenuItem>
                    <MenuItem
                        onClick={() => router.push('/admin/vote/qrcode')}
                        rootStyles={{
                            textAlign: "left",
                            fontFamily: "pretendard",
                            fontWeight: "500"
                        }}
                        icon={<IoQrCode size={20} />}
                    >
                        QRCode
                    </MenuItem>
                </Menu>
            </Sidebar>
        </>
    )
}