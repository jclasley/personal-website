import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Link from "next/link";

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>jon lasley</title>
                <meta name="description" content="click clack, computer go brrr" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <div className={styles.body}>
                    <p style={{ fontWeight: '500' }}>hello friend.</p>
                    <p>
                        i&apos;m jon. a software engineer, musician, and climbing enthusiast.
                        <br />
                        currently working at <a href="https://www.abbott.com" target="_blank" rel="noreferrer">abbott</a>, specifically the
                        <a href="https://www.diabetescare.abbott" target="_blank" rel="noreferrer"> diabetes care division</a>. i make APIs.
                        <br />
                        my software passions include the Go language,
                        CLIs (shoutout <a href='https://charm.sh' target="_blank" rel="noreferrer">charm</a>), and mentorship.
                        <br />
                    </p>
                    {/* TODO: add powered by */}
                    <p>
                        check out my <Link href="/blog">blog</Link>.
                    </p>
                    <p>
                        check out my <a href="https://github.com/jclasley" target="_blank" rel="noreferrer">github</a>.
                        {/* you can also read it via the terminal with{' '}
                        <span className={styles.code}>ssh #FILL ME IN#</span>. */}
                    </p>
                    <p>
                        find me on <a href="https://linkedin.com/in/jonlasley" target="_blank" rel="noreferrer">linkedin</a>.
                        <br />
                    </p>
                </div>
                {/* TODO: add powered by */}
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by NextJS
                </a>
            </footer>
        </div>
    );
}
