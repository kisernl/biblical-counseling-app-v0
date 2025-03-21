require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const MailerSend = require("mailersend");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('Connected to MySQL!');
  }
});

// Google OAuth2 Setup (for Google Meet and Drive)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Google Drive API setup
const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// MailerSend setup
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Nodemailer setup (fallback for MailerSend)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // Use `true` for port 465, `false` for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to send emails (using MailerSend or Nodemailer)
async function sendEmail(to, subject, text, html) {
  try {
    const recipients = [{ email: to }];
    const emailParams = {
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Biblical Counseling App',
      },
      to: recipients,
      subject: subject,
      text: text,
      html: html,
    };

    const response = await mailerSend.email.send(emailParams);
    console.log('MailerSend email sent:', response);
    return true; // Indicate success
  } catch (mailerSendError) {
    console.error('MailerSend email error:', mailerSendError);

    // Fallback to Nodemailer if MailerSend fails
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: subject,
        text: text,
        html: html,
      };

      await transporter.sendMail(mailOptions);
      console.log('Nodemailer email sent successfully');
      return true; // Indicate success
    } catch (nodemailerError) {
      console.error('Nodemailer email error:', nodemailerError);
      return false; // Indicate failure
    }
  }
}

// API Endpoints

// 1. Counselor Listing
app.get('/api/counselors', (req, res) => {
  db.query('SELECT * FROM counselors', (err, results) => {
    if (err) {
      console.error('Error fetching counselors:', err);
      return res.status(500).send('Error fetching counselors');
    }
    res.json(results);
  });
});

// 2. Counselor Profile
app.get('/api/counselors/:id', (req, res) => {
  const counselorId = req.params.id;
  db.query('SELECT * FROM counselors WHERE id = ?', [counselorId], (err, results) => {
    if (err) {
      console.error('Error fetching counselor:', err);
      return res.status(500).send('Error fetching counselor');
    }
    if (results.length === 0) {
      return res.status(404).send('Counselor not found');
    }
    res.json(results[0]);
  });
});

// 3. Appointment Request
app.post('/api/appointments', async (req, res) => {
  const { counselorId, userId, appointmentDateTime, message } = req.body;

  // Validate input (e.g., check date/time format)
  if (!counselorId || !userId || !appointmentDateTime) {
    return res.status(400).send('Missing required fields');
  }

  // Insert appointment into the database
  db.query(
    'INSERT INTO appointments (counselor_id, user_id, appointment_datetime, message, status) VALUES (?, ?, ?, ?, "pending")',
    [counselorId, userId, appointmentDateTime, message],
    async (err, result) => {
      if (err) {
        console.error('Error creating appointment:', err);
        return res.status(500).send('Error creating appointment');
      }

      const appointmentId = result.insertId;

      // Fetch counselor and user details for email
      db.query('SELECT * FROM counselors WHERE id = ?', [counselorId], async (err, counselorResults) => {
        if (err || counselorResults.length === 0) {
          console.error('Error fetching counselor for email:', err);
          return; // Don't send email if counselor not found
        }
        const counselor = counselorResults[0];

        db.query('SELECT * FROM users WHERE id = ?', [userId], async (err, userResults) => {
          if (err || userResults.length === 0) {
            console.error('Error fetching user for email:', err);
            return; // Don't send email if user not found
          }
          const user = userResults[0];

          // Send email to counselor
          const counselorEmailSubject = 'New Appointment Request';
          const counselorEmailText = `You have a new appointment request from ${user.name} on ${appointmentDateTime}.  Message: ${message}`;
          const counselorEmailHtml = `
            <p>You have a new appointment request from ${user.name} on ${appointmentDateTime}.</p>
            <p>Message: ${message}</p>
          `;
          await sendEmail(counselor.email, counselorEmailSubject, counselorEmailText, counselorEmailHtml);

          // Send email to user
          const userEmailSubject = 'Appointment Request Received';
          const userEmailText = `Your appointment request has been received. You will be notified once the counselor confirms.`;
          const userEmailHtml = `<p>Your appointment request has been received. You will be notified once the counselor confirms.</p>`;
          await sendEmail(user.email, userEmailSubject, userEmailText, userEmailHtml);

          res.status(201).json({ message: 'Appointment request created successfully', appointmentId });
        });
      });
    }
  );
});

// 4. Get Appointments for a User (Client)
app.get('/api/appointments/user/:userId', (req, res) => {
  const userId = req.params.userId;
  db.query(
    'SELECT a.*, c.name AS counselor_name FROM appointments a JOIN counselors c ON a.counselor_id = c.id WHERE a.user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        return res.status(500).send('Error fetching appointments');
      }
      res.json(results);
    }
  );
});

// 5. Get Appointments for a Counselor
app.get('/api/appointments/counselor/:counselorId', (req, res) => {
  const counselorId = req.params.counselorId;
  db.query(
    'SELECT a.*, u.name AS user_name FROM appointments a JOIN users u ON a.user_id = u.id WHERE a.counselor_id = ?',
    [counselorId],
    (err, results) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        return res.status(500).send('Error fetching appointments');
      }
      res.json(results);
    }
  );
});

// 6. Update Appointment Status (Counselor)
app.put('/api/appointments/:appointmentId/status', (req, res) => {
  const appointmentId = req.params.appointmentId;
  const { status } = req.body; // e.g., "confirmed", "rejected"

  // Validate status
  if (!['pending', 'confirmed', 'rejected', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).send('Invalid status');
  }

  db.query(
    'UPDATE appointments SET status = ? WHERE id = ?',
    [status, appointmentId],
    async (err, result) => {
      if (err) {
        console.error('Error updating appointment status:', err);
        return res.status(500).send('Error updating appointment status');
      }

      if (result.affectedRows === 0) {
        return res.status(404).send('Appointment not found');
      }

      // Fetch appointment details for email notifications
      db.query('SELECT * FROM appointments WHERE id = ?', [appointmentId], async (err, appointmentResults) => {
        if (err || appointmentResults.length === 0) {
          console.error('Error fetching appointment for email:', err);
          return;
        }
        const appointment = appointmentResults[0];

        db.query('SELECT * FROM counselors WHERE id = ?', [appointment.counselor_id], async (err, counselorResults) => {
          if (err || counselorResults.length === 0) {
            console.error('Error fetching counselor for email:', err);
            return;
          }
          const counselor = counselorResults[0];

          db.query('SELECT * FROM users WHERE id = ?', [appointment.user_id], async (err, userResults) => {
            if (err || userResults.length === 0) {
              console.error('Error fetching user for email:', err);
              return;
            }
            const user = userResults[0];

            // Send email to user
            let userEmailSubject = '';
            let userEmailText = '';
            let userEmailHtml = '';

            if (status === 'confirmed') {
              userEmailSubject = 'Appointment Confirmed';
              userEmailText = `Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been confirmed.`;
              userEmailHtml = `<p>Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been confirmed.</p>`;
            } else if (status === 'rejected') {
              userEmailSubject = 'Appointment Rejected';
              userEmailText = `Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been rejected.`;
              userEmailHtml = `<p>Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been rejected.</p>`;
            } else if (status === 'cancelled') {
              userEmailSubject = 'Appointment Cancelled';
              userEmailText = `Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been cancelled.`;
              userEmailHtml = `<p>Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been cancelled.</p>`;
            } else if (status === 'completed') {
              userEmailSubject = 'Appointment Completed';
              userEmailText = `Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been completed.`;
              userEmailHtml = `<p>Your appointment with ${counselor.name} on ${appointment.appointment_datetime} has been completed.</p>`;
            }

            if (userEmailSubject) {
              await sendEmail(user.email, userEmailSubject, userEmailText, userEmailHtml);
            }

            res.json({ message: 'Appointment status updated successfully' });
          });
        });
      });
    }
  );
});

// 7. Create Google Meet Meeting (Counselor)
app.post('/api/meetings', async (req, res) => {
  const { appointmentId, startTime, endTime } = req.body;

  // Validate input
  if (!appointmentId || !startTime || !endTime) {
    return res.status(400).send('Missing required fields');
  }

  try {
    // 1. Get access token (assuming you have already handled the OAuth flow and have a valid token)
    const accessToken = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({ access_token: accessToken.token });

    // 2. Create the Google Meet event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = {
      summary: 'Biblical Counseling Session',
      description: 'Video call for counseling session',
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'America/Los_Angeles', // Replace with your timezone
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'America/Los_Angeles', // Replace with your timezone
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2, 15), // Unique ID
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary', // Use 'primary' for the user's primary calendar
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = response.data.hangoutLink;

    // 3. Update the appointment with the meeting link
    db.query(
      'UPDATE appointments SET meeting_link = ? WHERE id = ?',
      [meetLink, appointmentId],
      (err, result) => {
        if (err) {
          console.error('Error updating appointment with meeting link:', err);
          return res.status(500).send('Error updating appointment with meeting link');
        }

        if (result.affectedRows === 0) {
          return res.status(404).send('Appointment not found');
        }

        res.json({ meetingLink: meetLink });
      }
    );
  } catch (error) {
    console.error('Error creating Google Meet meeting:', error);
    res.status(500).send('Error creating Google Meet meeting');
  }
});

// 8. Get Google Drive Folder (for counselor session notes) - Placeholder
app.get('/api/drive/folder/:counselorId', async (req, res) => {
  const counselorId = req.params.counselorId;

  // In a real implementation, you would:
  // 1. Authenticate with Google Drive (already done with oauth2Client)
  // 2. Check if a folder exists for the counselor. If not, create one.
  // 3. Return the folder ID.

  // For now, return a placeholder.
  res.json({ folderId: `placeholder_folder_id_for_counselor_${counselorId}` });
});

// 9. Upload Session Notes to Google Drive (Placeholder)
app.post('/api/drive/upload', async (req, res) => {
  const { counselorId, appointmentId, notesContent } = req.body;

  // In a real implementation, you would:
  // 1. Authenticate with Google Drive (already done with oauth2Client)
  // 2. Get the folder ID for the counselor (from the previous endpoint or a database).
  // 3. Upload the notesContent as a text file to the counselor's folder.

  // For now, return a placeholder.
  res.json({ message: `Notes uploaded for counselor ${counselorId} and appointment ${appointmentId}` });
});

// 10. Update Counselor Bio
app.put('/api/counselors/:counselorId/bio', (req, res) => {
  const counselorId = req.params.counselorId;
  const { bio } = req.body;

  db.query('UPDATE counselors SET bio = ? WHERE id = ?', [bio, counselorId], (err, result) => {
    if (err) {
      console.error('Error updating counselor bio:', err);
      return res.status(500).send('Error updating counselor bio');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Counselor not found');
    }

    res.json({ message: 'Counselor bio updated successfully' });
  });
});

// 11. User Authentication (Placeholder - Implement with MailerSend)
app.post('/api/auth/register', (req, res) => {
  // Placeholder - Implement registration with MailerSend
  res.status(200).json({ message: 'Registration successful (placeholder)' });
});

app.post('/api/auth/login', (req, res) => {
  // Placeholder - Implement login with MailerSend
  res.status(200).json({ message: 'Login successful (placeholder)' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
