import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../../styles/CounselorProfile.module.css';
import AppointmentRequestForm from '../../components/AppointmentRequestForm';
import Messaging from '../../components/Messaging';

const CounselorProfile = () => {
  const router = useRouter();
  const { id } = router.query;
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointmentRequested, setAppointmentRequested] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCounselor = async () => {
      try {
        const response = await fetch(`/api/counselors/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCounselor(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCounselor();
  }, [id]);

  const handleAppointmentRequested = (appointmentId) => {
    setAppointmentRequested(true);
    // Optionally, you can show a success message or redirect the user
    console.log('Appointment requested with ID:', appointmentId);
  };

  if (loading) return <div className={styles.loading}>Loading counselor profile...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!counselor) return <div className={styles.error}>Counselor not found.</div>;

  // Replace with actual user ID from authentication
  const userId = 'user123';

  return (
    <div className={styles.container}>
      <Head>
        <title>{counselor.name} - Biblical Counseling</title>
        <meta name="description" content={`Learn more about ${counselor.name}`} />
      </Head>

      <main className={styles.main}>
        <div className={styles.profile}>
          <div className={styles.imageContainer}>
            <Image
              src={counselor.photo || '/default-counselor-image.jpg'}
              alt={counselor.name}
              width={200}
              height={200}
              className={styles.image}
            />
          </div>
          <div className={styles.details}>
            <h1>{counselor.name}</h1>
            <p className={styles.credentials}>{counselor.credentials}</p>
            <p className={styles.education}>
              {counselor.institution}, {counselor.degree}
            </p>
            <p className={styles.bio}>{counselor.bio}</p>
            {!appointmentRequested && (
              <AppointmentRequestForm
                counselorId={counselor.id}
                userId={userId}
                onAppointmentRequested={handleAppointmentRequested}
              />
            )}
            {appointmentRequested && (
              <p className={styles.successMessage}>Appointment request sent!</p>
            )}
            <Messaging counselorId={counselor.id} userId={userId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CounselorProfile;
