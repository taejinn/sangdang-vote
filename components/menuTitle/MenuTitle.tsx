import styles from "@/components/menuTitle/MenuTitle.module.css"

export default function MenuTitle(props: { title: string, description?: string }) {

    return (
        <>
            <div className={styles.box}>
                <div className={styles.text}>
                    {props.title}
                </div>
                {props.description && (
                    <div className={styles.miniText}>
                        {props.description}
                    </div>
                )}
            </div>
        </>
    )
}