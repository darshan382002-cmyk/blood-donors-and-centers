import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorRegister from './pages/DonorRegister';
import SeekerDashboard from './pages/SeekerDashboard';
import DonorDashboard from './pages/DonorDashboard';
import SearchBlood from './pages/SearchBlood';
import Results from './pages/Results';
import BloodRequest from './pages/BloodRequest';
import RequestConfirmation from './pages/RequestConfirmation';
import Emergency from './pages/Emergency';
import BloodCenters from './pages/BloodCenters';
import DonorRequests from './pages/DonorRequests';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/centers" element={<BloodCenters />} />
          <Route path="/search" element={<SearchBlood />} />
          <Route path="/results" element={<Results />} />
          <Route path="/request-confirmation" element={
            <ProtectedRoute><RequestConfirmation /></ProtectedRoute>
          } />

          <Route path="/donor-register" element={
            <ProtectedRoute><DonorRegister /></ProtectedRoute>
          } />

          <Route path="/seeker" element={
            <ProtectedRoute roles={['seeker', 'admin']}><SeekerDashboard /></ProtectedRoute>
          } />
          <Route path="/request" element={
            <ProtectedRoute roles={['seeker', 'admin']}><BloodRequest /></ProtectedRoute>
          } />
          <Route path="/emergency" element={
            <ProtectedRoute roles={['seeker', 'admin']}><Emergency /></ProtectedRoute>
          } />

          <Route path="/donor" element={
            <ProtectedRoute roles={['donor', 'admin']}><DonorDashboard /></ProtectedRoute>
          } />
          <Route path="/donor/requests" element={
            <ProtectedRoute roles={['donor', 'admin']}><DonorRequests /></ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute><Notifications /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
