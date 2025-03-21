import { useState } from 'react';
import styles from '../styles/AppointmentRequestForm.module.css';

const AppointmentRequestForm = ({ counselorId, userId, onAppointmentRequested }) => {
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counselorId,
          userId, // Replace with actual user ID from auth
          appointmentDateTime,
          message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request appointment');
      }

      const data = await response.json();
      onAppointmentRequested(data.appointmentId); // Notify parent component
      setAppointmentDateTime('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Request an Appointment</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="appointmentDateTime">Date and Time:</label>
          <input
            type="datetime-local"
            id="appointmentDateTime"
            value={appointmentDateTime}
            onChange={(e) => setAppointmentDateTime(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="message">Message (Optional):</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4"
          />
        </div>
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Requesting...' : 'Request Appointment'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentRequestForm;
