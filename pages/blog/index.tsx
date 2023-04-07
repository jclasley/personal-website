import {getSortedPosts, Post} from "../../lib/posts";
import BlogLayout from "../../components/BlogLayout";
import Link from "next/link";
import Head from 'next/head';
import styles from './blogpost.module.css';

export async function getStaticProps() {
    const posts = getSortedPosts()
    return {
        props: {
            posts,
        }
    }
}

interface Props {
    posts: Array<Post>
}

export default function Blog({posts}: Props) {
    return (
        <>
            <Head>
                <title>jon lasley&apos;s blog</title>
        </Head>
        <BlogLayout prev={'home'}>
            {posts.map(post => (
                <div key={post.id} className={styles.excerpt}>
                    <div className={styles.title}><Link href={`/blog/${post.id}/`}>{post.title}</Link></div>
                    <div className={styles.date}>{post.date}</div>
                    <p>{post.description}</p>
                    <hr />
                </div>
            ))}
        </BlogLayout>
        </>
    );
}