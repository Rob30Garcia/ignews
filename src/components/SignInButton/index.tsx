import { FaGithub } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import styles from './styles.module.scss';

export function SignInButton() {
  const userIsLoggedIn = true;

  return userIsLoggedIn ? (
    <button
      className={styles.signInButton} 
      type="button" 
    >
      <FaGithub color='#04D361'/>
      
      Robert Garcia

      <FiX color='#737380' className={styles.closeIcon}/>
    </button>
  ) : (
    <button
      className={styles.signInButton} 
      type="button" 
    >
      <FaGithub color='#EBA417'/>
      Sign in with GitHub
    </button>
  );
}