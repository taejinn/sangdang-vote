import styles from "@/components/pageTitle/PageTitle.module.css"

export default function PageTitle(props: { children: string }) {
    return (
        <>
            <div className={styles.title}>
                <div className={styles.text}>
                    {props.children}
                </div>
            </div>
        </>
    )
}