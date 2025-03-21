import Image from 'next/image';
import styles from '../styles/CounselorCard.module.css';

const CounselorCard = ({ counselor }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Image
          src={counselor.photo || '/default-counselor-image.jpg'} // Use a default image if none is provided
          alt={counselor.name}
          width={150}
          height={150}
          className={styles.image}
        />
      </div>
      <div className={styles.details}>
        <h3>{counselor.name}</h3>
        <p className={styles.credentials}>{counselor.credentials}</p>
        <p className={styles.education}>
          {counselor.institution}, {counselor.degree}
        </p>
        <button className={styles.button}>View Profile</button>
      </div>
    </div>
  );
};

export default CounselorCard;
