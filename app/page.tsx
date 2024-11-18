'use client';

import styles from "./page.module.css";
import { MdHowToVote } from "react-icons/md";
import { MdSettings } from "react-icons/md";
import { useRouter } from 'next/navigation';

export default function Home() {

    const router = useRouter();

  return (
    <>
        <div className={styles.container}>
            <div className={styles.title}>
                상당고 <span id={styles.titleGradient}>전자투표시스템</span>
            </div>
            <div className={styles.description}>
                아래 유형을 선택해주세요
            </div>
            <div className={styles.box}>
                <div onClick={() => router.push('/vote')} className={styles.select} id={styles.selectGradient}>
                    <MdHowToVote size={40}/>
                    <div className={styles.name}>
                        투표 참여
                    </div>
                </div>
                <div className={styles.select}>
                    <MdSettings size={40}/>
                    <div onClick={() => router.push('/admin')} className={styles.name}>
                        투표 관리
                    </div>
                </div>
            </div>
        </div>
    </>
  );
}
