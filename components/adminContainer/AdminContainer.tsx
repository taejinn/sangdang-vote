import { ReactElement, ReactNode, ReactPortal, AwaitedReactNode } from 'react';
import styles from './AdminContainer.module.css';

export default function AdminContainer(props: { children: string | number | bigint | boolean | ReactElement | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }) {

    return (
        <>
            <div className={styles.container}>
                {props.children}
            </div>
        </>
    )
}