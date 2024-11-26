import type { Metadata } from "next";
import {auth0} from "@/lib/auth0";
import Header from "@/components/header/Header";
import Container from "@/components/container/Container";
import styles from "@/app/admin/page.module.css";
import {IoMdAlert} from "react-icons/io";
import Link from "next/link";
import './layout.css';
import SidebarMenu from "@/components/sidebarMenu/SidebarMenu";
import {SocketProvider} from "@/components/socketProvider/SocketProvider";

export const metadata: Metadata = {
    title: "상당고등학교 전자투표시스템",
    description: "상당고등학교 전자투표시스템",
};

export default async function RootLayout({children,}: Readonly<{
    children: React.ReactNode;
}>) {

    // uid 이용해서 관리자 여부 확인
    
    const session = await auth0.getSession()
    const uid = session?.user?.sub;

    if (!session) {
        return (
            <>
                <Header/>
                <Container>
                    <div className={styles.alert}>
                        <IoMdAlert style={{color: 'black'}} size={30}/>
                        <div className={styles.text}>로그인이 필요합니다</div>
                        <div className={styles.miniText}>권한 부여된 인원에 한해 접근이 제한적으로 허용됩니다</div>
                        <Link href={"/auth/login?returnTo="+process.env.NEXT_PUBLIC_URL+"/admin"} style={{textDecoration: 'none'}}>
                            <div className={styles.button}>
                                <div className={styles.text}>
                                    로그인
                                </div>
                            </div>
                        </Link>
                    </div>
                </Container>
            </>
        )
    }

    return (
        <>
            <SocketProvider>
                <SidebarMenu />
                {children}
            </SocketProvider>
        </>
    );
}
