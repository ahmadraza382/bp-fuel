import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/shared/layout/Header';
import { Footer } from './components/shared/layout/Footer';
import { Toaster } from './components/shared/common/Toaster';
import { ScrollToTop } from './utils/ScrollToTop';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { BPCheck } from './pages/BPCheck';
import MealCheck  from './pages/MealCheck';
import { About } from './pages/About';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { HealthReports } from './pages/HealthReports';
import { ProgressTracking } from './pages/ProgressTracking';
import { Recommendations } from './pages/Recommendations';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <Header />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bp-check" element={<BPCheck />} />
            <Route path="/meal-check" element={<MealCheck />} />
            <Route path="/about" element={<About />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/health-reports" element={<HealthReports />} />
            <Route path="/progress-tracking" element={<ProgressTracking />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Routes>
        </div>
        
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;