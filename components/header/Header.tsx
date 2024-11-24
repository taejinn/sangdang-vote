import styles from './Header.module.css'

export default function Header() {
    return (
        <>
            <div className={styles.box}>
                <div className={styles.title}>
                    상당고 <span id={styles.titleGradient}>전자투표시스템</span>
                </div>
            </div>
        </>
    )
}