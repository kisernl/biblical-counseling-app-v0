import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';

const Layout = ({ children, title = 'Biblical Counseling App' }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Connect with biblical counselors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <Link href="/">
          <a className={styles.logo}>Biblical Counseling</a>
        </Link>
        <nav>
          <Link href="/counselors">
            <a>Find a Counselor</a>
          </Link>
          {/* Add conditional rendering for login/logout based on authentication status */}
          <Link href="/login">
            <a>Login</a>
          </Link>
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Biblical Counseling App</p>
      </footer>
    </div>
  );
};

export default Layout;
