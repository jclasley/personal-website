import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Link from "next/link";

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>Create Next App</title>
                <meta name="description" content="Generated by create next app"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className={styles.main}>
                <div className={styles.body}>
                    <p style={{fontWeight: '500'}}>hello friend.</p>
                    <p>
                        i'm jon. a software engineer, musician, and climbing enthusiast.
                        <br/>
                        currently working at <a href="https://circleci.com">circleci</a>.
                        <br/>
                        my passions are the command line and backend development.
                        <br/>
                    </p>
                    {/* TODO: add powered by */}
                    <p>
                        check out my <Link href="/blog">blog</Link>.
                        <br/>
                        you can also read it via the terminal with <span className={styles.code}>ssh #FILL ME IN#</span>.
                        <br/>
                    </p>
                    <p>
                        check out my <a href="github.com/jclasley">github</a>.
                        <br/>
                        you can also read it via the terminal with <span className={styles.code}>ssh #FILL ME IN#</span>.
                        <br/>
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
    )
}
