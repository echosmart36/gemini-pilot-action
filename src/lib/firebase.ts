import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
// Request repo access for GitHub Action deployment
githubProvider.addScope('repo');
githubProvider.addScope('workflow');
