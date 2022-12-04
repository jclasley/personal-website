import {getSortedPosts, Post} from "../../lib/posts";

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

export default function Blog({ posts }: Props) {
    return posts.map(post => (
        <div key={post.id} className="post-excerpt">
            <h1>{post.title}</h1>
            <h2>{post.date}</h2>
            <p>{post.description}</p>
        </div>
    ));
}