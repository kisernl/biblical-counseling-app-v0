import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../../styles/CounselorDashboard.module.css';
import { useRouter } from 'next/router';

const CounselorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [meetingStartTime, setMeetingStartTime] = useState('');
  const [meetingEndTime, setMeetingEndTime] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [counselorBio, setCounselorBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Replace with actual counselor ID from authentication
  const [counselorId, setCounselorId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // In a real application, you would decode the token to get the user ID.
      // For this placeholder, we'll just set a hardcoded ID.
      setCounselorId('counselor123');
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!counselorId) return;

    const fetchAppointments = async () => {
      try {
        const response = await fetch(`/api/appointments/counselor/${counselorId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCounselorBio = async () => {
      try {
        const response = await fetch(`/api/counselors/${counselorId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCounselorBio(data.bio || '');
      } catch (err) {
        console.error("Error fetching counselor bio:", err);
        setError(err.message);
      }
    };

    fetchAppointments();
    fetchCounselorBio();
  }, [counselorId]);

  const handleApproveAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve appointment');
      }

      setAppointments(appointments.map(app => {
        if (app.id === appointmentId) {
          return { ...app, status: 'confirmed' };
        }
        return app;
      }));

    } catch (err) {
      setError(err.message);
    }
  };

  const handleRejectAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject appointment');
      }

      setAppointments(appointments.map(app => {
        if (app.id === appointmentId) {
          return { ...app, status: 'rejected' };
        }
        return app;
      }));

    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleMeeting = (appointment) => {
    setSelectedAppointment(appointment);
    setMeetingStartTime('');
    setMeetingEndTime('');
    setShowMeetingModal(true);
  };

  const handleCreateMeeting = async () => {
    if (!selectedAppointment || !meetingStartTime || !meetingEndTime) {
      alert('Please provide start and end times.');
      return;
    }

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          startTime: meetingStartTime,
          endTime: meetingEndTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }

      const data = await response.json();
      setAppointments(appointments.map(app => {
        if (app.id === selectedAppointment.id) {
          return { ...app, meeting_link: data.meetingLink };
        }
        return app;
      }));

      setShowMeetingModal(false);
      setSelectedAppointment(null);
      setMeetingStartTime('');
      setMeetingEndTime('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerateInvoice = (appointment) => {
    setSelectedAppointment(appointment);
    setInvoiceAmount('');
    setShowInvoiceModal(true);
  };

  const handleSendInvoice = async () => {
    if (!selectedAppointment || !invoiceAmount) {
      alert('Please provide an invoice amount.');
      return;
    }

    console.log('Generating invoice for appointment:', selectedAppointment.id, 'Amount:', invoiceAmount);
    alert(`Invoice for $${invoiceAmount} generated for appointment ${selectedAppointment.id} (Placeholder)`);
    setShowInvoiceModal(false);
    setSelectedAppointment(null);
    setInvoiceAmount('');
  };

  const handleAddNotes = (appointment) => {
    setSelectedAppointment(appointment);
    setSessionNotes('');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment || !sessionNotes) {
      alert('Please enter session notes.');
      return;
    }

    console.log('Saving notes for appointment:', selectedAppointment.id, 'Notes:', sessionNotes);
    alert(`Notes saved for appointment ${selectedAppointment.id} (Placeholder)`);
    setShowNotesModal(false);
    setSelectedAppointment(null);
    setSessionNotes('');
  };

  const sendReminderEmails = () => {
    appointments.forEach(appointment => {
      if (appointment.status === 'confirmed') {
        console.log(`Sending reminder emails for appointment ${appointment.id}`);
      }
    });
    alert('Reminder emails (placeholders) sent!');
  };

  const handleEditBio = () => {
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    try {
      const response = await fetch(`/api/counselors/${counselorId}/bio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: counselorBio }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bio');
      }

      alert('Bio updated successfully!');
      setIsEditingBio(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowMeetingModal(false);
    setShowInvoiceModal(false);
    setShowNotesModal(false);
    setSelectedAppointment(null);
    setMeetingStartTime('');
    setMeetingEndTime('');
    setInvoiceAmount('');
    setSessionNotes('');
  };

  if (!isLoggedIn) {
    return null; // Or redirect to login page
  }

  if (loading) return <div className={styles.loading}>Loading appointments...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <Head>
        <title>Counselor Dashboard</title>
        <meta name="description" content="Counselor dashboard for managing appointments" />
      </Head>

      <main className={styles.main}>
        <h1>Counselor Dashboard</h1>

        <h2>Appointment Requests</h2>
        {appointments.length === 0 && <p>No appointment requests.</p>}
        <div className={styles.appointments}>
          {appointments.map((appointment) => (
            <div key={appointment.id} className={styles.appointment}>
              <p>Client: {appointment.user_name}</p>
              <p>Date/Time: {appointment.appointment_datetime}</p>
              <p>Message: {appointment.message}</p>
              <p>Status: {appointment.status}</p>
              {appointment.status === 'pending' && (
                <div>
                  <button onClick={() => handleApproveAppointment(appointment.id)} className={styles.approveButton}>Approve</button>
                  <button onClick={() => handleRejectAppointment(appointment.id)} className={styles.rejectButton}>Reject</button>
                </div>
              )}
              {appointment.status === 'confirmed' && !appointment.meeting_link && (
                <button onClick={() => handleScheduleMeeting(appointment)} className={styles.scheduleButton}>Schedule Video Call</button>
              )}
              {appointment.meeting_link && (
                <a href={appointment.meeting_link} target="_blank" rel="noopener noreferrer" className={styles.meetingLink}>Join Meeting</a>
              )}
              {appointment.status === 'completed' && (
                <>
                  <button onClick={() => handleGenerateInvoice(appointment)} className={styles.invoiceButton}>Generate Invoice</button>
                  <button onClick={() => handleAddNotes(appointment)} className={styles.notesButton}>Add Notes</button>
                </>
              )}
            </div>
          ))}
        </div>

        <button onClick={sendReminderEmails} className={styles.reminderButton}>Send Reminder Emails (Placeholder)</button>

        <h2>Update Bio</h2>
        {isEditingBio ? (
          <div>
            <textarea
              value={counselorBio}
              onChange={(e) => setCounselorBio(e.target.value)}
              rows="4"
              className={styles.bioTextArea}
            />
            <button onClick={handleSaveBio} className={styles.saveBioButton}>Save Bio</button>
          </div>
        ) : (
          <div>
            <p>{counselorBio || 'No bio available.'}</p>
            <button onClick={handleEditBio} className={styles.editBioButton}>Edit Bio</button>
          </div>
        )}

        {/* Meeting Modal */}
        {showMeetingModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <span className={styles.close} onClick={closeModal}>&times;</span>
              <h2>Schedule Google Meet</h2>
              <div className={styles.formGroup}>
                <label htmlFor="meetingStartTime">Start Time:</label>
                <input
                  type="datetime-local"
                  id="meetingStartTime"
                  value={meetingStartTime}
                  onChange={(e) => setMeetingStartTime(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="meetingEndTime">End Time:</label>
                <input
                  type="datetime-local"
                  id="meetingEndTime"
                  value={meetingEndTime}
                  onChange={(e) => setMeetingEndTime(e.target.value)}
                />
              </div>
              <button onClick={handleCreateMeeting} className={styles.createMeetingButton}>Create Meeting</button>
            </div>
          </div>
        )}

        {/* Invoice Modal */}
        {showInvoiceModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <span className={styles.close} onClick={closeModal}>&times;</span>
              <h2>Generate Invoice</h2>
              <div className={styles.formGroup}>
                <label htmlFor="invoiceAmount">Amount:</label>
                <input
                  type="number"
                  id="invoiceAmount"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                />
              </div>
              <button onClick={handleSendInvoice} className={styles.createMeetingButton}>Send Invoice</button>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <span className={styles.close} onClick={closeModal}>&times;</span>
              <h2>Add Session Notes</h2>
              <div className={styles.formGroup}>
                <label htmlFor="sessionNotes">Notes:</label>
                <textarea
                  id="sessionNotes"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows="4"
                />
              </div>
              <button onClick={handleSaveNotes} className={styles.createMeetingButton}>Save Notes</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CounselorDashboard;
