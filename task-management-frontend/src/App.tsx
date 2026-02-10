// src/App.tsx
import { useState } from 'react';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { taskAPI } from './services/api';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const handleTaskCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      await taskAPI.downloadExcel();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download Excel file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app">
      <div className="background-pattern"></div>
      
      <div className="container">
        <header className="app-header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="white" strokeWidth="2"/>
                  <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="app-title">Task Management</h1>
                <p className="app-subtitle">Organize and track your tasks efficiently</p>
              </div>
            </div>

            <button
              className="download-button"
              onClick={handleDownloadExcel}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <div className="button-spinner" />
                  Downloading...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3V13M10 13L14 9M10 13L6 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 13V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Download Excel
                </>
              )}
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="content-grid">
            <div className="form-section">
              <TaskForm onSuccess={handleTaskCreated} />
            </div>

            <div className="list-section">
              <TaskList refresh={refreshKey} />
            </div>
          </div>
        </main>

        <footer className="app-footer">
          <p>Task Management System © 2024</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
