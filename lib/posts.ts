import fs from 'fs';
import path from 'path';
import matter, {GrayMatterFile} from 'gray-matter';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import html from 'remark-html';
import rehypeHighlight from "rehype-highlight";
import { rehype } from 'rehype';
import codeFrontmatter from 'remark-code-frontmatter';

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

    const processed = await unified()
        .use(remarkParse)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw) // *Parse* the raw HTML strings embedded in the tree
        .use(rehypeStringify)
        .process(content);
    const syntaxHighlighted = await rehype().use(rehypeHighlight, {detect: true}).process(processed);
    const processedHTML = syntaxHighlighted.toString();

    return {
        id,
        date: data.date,
        title: data.title,
        description: data.description,
        content: processedHTML,
    }
}