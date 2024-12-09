"use client";

import 'bootstrap/dist/css/bootstrap.min.css';
import styles from "./AdminLoadingData.module.css";
import {Spinner} from "react-bootstrap";
import { CSSProperties } from 'react';

export default function AdminLoadingData(props: { style?: CSSProperties | undefined; }) {

    return (
        <>
            <div className={styles.loading} style={{...props.style}}>
                <Spinner animation="border" variant="dark" />
                <div className={styles.text}>
                    데이터를 불러오는 중...
                </div>
            </div>
        </>
    )

}