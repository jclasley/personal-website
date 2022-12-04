import fs from 'fs';
import path from 'path';
import matter, {GrayMatterFile} from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'posts');

interface GrayMatterData {
    [key: string]: any;
}

export interface Post {
    id: string,
    date: string,
    title: string,
    description: string,
}

function getPosts(): Array<Post> {
    const files = fs.readdirSync(postsDirectory);
    return files.map((file) => {
        const fileID = file.replace(/\.md$/, '');
        const filePath = path.join(postsDirectory, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const { data } = matter(fileContent);

        return {
            id: fileID,
            date: data.date,
            title: data.title,
            description: data.description,
        }
    });
}

function sortPosts(posts: Array<Post>): Array<Post> {
    return posts.sort((a, b) => a.date < b.date ? 1 : -1);
}

export function getSortedPosts(): Array<Post> {
    return sortPosts(getPosts());
}