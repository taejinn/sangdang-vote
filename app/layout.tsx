import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";

export const metadata: Metadata = {
  title: "상당고등학교 전자투표시스템",
  description: "상당고등학교 전자투표시스템",
};

const pretendard = localFont({
    src: "./fonts/PretendardVariable.woff2",
    variable: "--font-pretendard",
    display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
        <body className={`${pretendard.variable}`}>
                {children}
        </body>
    </html>
  );
}
