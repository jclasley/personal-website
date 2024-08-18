import React from "react";
import Back from "./Back";
import styles from "./bloglayout.module.css";
import ScrollUp from "./ScrollUp";

interface Props {
	children: React.ReactNode;
	prev: 'blog' | 'home';
}

export default function BlogLayout({ children, prev }: Props) {
	return (
		<>
			<div className={styles.container}>
				<Back to={prev} />
				{children}
			</div>
			<ScrollUp />
		</>
	)
}
