import fs from 'fs';
import path from 'path';
import matter, {GrayMatterFile} from 'gray-matter';

import { remark } from 'remark';
import html from 'remark-html';

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

        const {data} = matter(fileContent);

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

export interface PostIDParams {
    params: {
        id: string;
    }
}

export function getPostIDs(): Array<PostIDParams> {
    const files = fs.readdirSync(postsDirectory);
    return files.map((file) => ({
        params: {
            id: file.replace(/\.md$/, '')

        }
    }));
}

export function getSortedPosts(): Array<Post> {
    return sortPosts(getPosts());
}

export interface PostWithContent extends Post {
    content: string;
}

export async function getPostData(id: string): Promise<PostWithContent> {
    const filePath = path.join(postsDirectory, `${id}.md`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const {data, content} = matter(fileContent);

    const processed = await remark().use(html).process(content);
    const processedHTML = processed.toString();

    return {
        id,
        date: data.date,
        title: data.title,
        description: data.description,
        content: processedHTML,
    }
}