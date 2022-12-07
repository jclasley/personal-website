import React from "react";
import Back from "./Back";
import styles from "./bloglayout.module.css";
import ScrollUp from "./ScrollUp";

interface Props {
    children: React.ReactNode;
    prev: 'blog' | 'home';
}

export default function BlogLayout({ children, prev }: Props) {
    return (
        <>
            <Back to={prev} />
            <div className={styles.container}>
                {children}
            </div>
            <ScrollUp />
        </>
    )
}