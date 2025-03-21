import '../styles/globals.css'
import '../styles/CounselorCard.module.css';
import '../styles/CounselorList.module.css';
import '../styles/Counselors.module.css';
import '../styles/CounselorProfile.module.css';
import '../styles/AppointmentRequestForm.module.css';
import '../styles/Messaging.module.css';
import '../styles/CounselorDashboard.module.css';
import '../styles/LoginForm.module.css';
import '../styles/Register.module.css';
import Layout from '../components/Layout';

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
