import {getPostData, getPostIDs, PostWithContent} from "../../lib/posts";
import BlogLayout from "../../components/BlogLayout";
import styles from './blogpost.module.css';

export async function getStaticPaths() {
    const paths = getPostIDs();
    return {
        paths,
        fallback: false,
    }
}

interface DynamicProps {
    params: DynamicParams
}

interface DynamicParams {
    id: string
}

export async function getStaticProps({ params }: DynamicProps) {
    const post = await getPostData(params.id);
    return {
        props: {
            post,
        }
    }
}

interface Props {
    post: PostWithContent,
}

export default function Post({ post }: Props) {
    return (
        <BlogLayout prev={'blog'}>
            <h1 className={styles.title}>{post.title}</h1>
            <hr/>
            <div dangerouslySetInnerHTML={{ __html: post.content }}/>
            <hr/>
            <div className={styles.date}>{post.date}</div>
        </BlogLayout>
    );
}
