import { useState, useEffect } from 'react';
import CounselorList from '../components/CounselorList';
import Head from 'next/head';
import styles from '../styles/Counselors.module.css';

const CounselorsPage = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCounselors = async () => {
      try {
        const response = await fetch('/api/counselors');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCounselors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCounselors();
  }, []);

  if (loading) return <div className={styles.loading}>Loading counselors...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Find a Counselor</title>
        <meta name="description" content="Browse our list of biblical counselors" />
      </Head>

      <main className={styles.main}>
        <h1>Find a Biblical Counselor</h1>
        <CounselorList counselors={counselors} />
      </main>
    </div>
  );
};

export default CounselorsPage;
