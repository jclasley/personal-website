import React from 'react';
import Link from 'next/link';
import styles from './back.module.css';

interface Props {
    to: 'blog' | 'home';
}
export default function Back({ to }: Props) {
    const href = to === 'blog' ? '/blog' : '/';

    return (
        <div className={styles.container}>
            <Link href={href} className={styles.link}>go back</Link>
        </div>
    )
}
