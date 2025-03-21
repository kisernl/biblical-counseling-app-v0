import CounselorCard from './CounselorCard';
import styles from '../styles/CounselorList.module.css';

const CounselorList = ({ counselors }) => {
  return (
    <div className={styles.list}>
      {counselors.map((counselor) => (
        <CounselorCard key={counselor.id} counselor={counselor} />
      ))}
    </div>
  );
};

export default CounselorList;
