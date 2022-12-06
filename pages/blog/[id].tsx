import {getPostData, getPostIDs, PostWithContent} from "../../lib/posts";
import BlogLayout from "../../components/BlogLayout";

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
        <BlogLayout>
            <h1>{post.title}</h1>
            <h2>{post.date}</h2>
            <div dangerouslySetInnerHTML={{ __html: post.content }}/>
        </BlogLayout>
    );
}
