import {useEffect, useState} from "react";
import styles from './scrollup.module.css';

export default function ScrollUp() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 200) {
                setShow(true);
            } else {
                setShow(false);
            }
        }

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={styles.bottom_right}>
            <a href="#top" className={show ? styles.show : styles.hide}>
                👆🏻
            </a>
        </div>
    );
}