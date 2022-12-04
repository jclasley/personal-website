import React from "react";
import Link from "next/link";

export default function BlogLayout({ children }: React.PropsWithChildren<{}>) {
    return (
        <>
            <Link href="/blog">Back to blog</Link>
            {children}
        </>
    )
}