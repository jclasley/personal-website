import {getSortedPosts, Post} from "../../lib/posts";
import BlogLayout from "../../components/BlogLayout";
import Link from "next/link";

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
        <BlogLayout>
            {posts.map(post => (
                <div key={post.id} className="post-excerpt">
                    <h1><Link href={`/blog/${post.id}/`}>{post.title}</Link></h1>
                    <h2>{post.date}</h2>
                    <p>{post.description}</p>
                </div>
            ))}
        </BlogLayout>
    );
}