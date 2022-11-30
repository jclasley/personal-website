import { h } from 'preact';
import style from './style.css';

import SshRepos from "../../components/sshRepos";

const Home = () => (
	<div class={style.home}>
		<h1>Home</h1>
		<p>This is the Home component.</p>
		<SshRepos />
	</div>
);

export default Home;
