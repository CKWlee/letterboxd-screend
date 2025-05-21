import React, { useState } from 'react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import Dashboard from './dashboard';
import logo from './assets/letterboxd-logo.png';
import './App.css';

function App() {
  const [stage, setStage] = useState('upload');      // 'upload', 'loading', 'dashboard'
  const [parsedData, setParsedData] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.zip')) {
      alert('Please upload a valid Letterboxd ZIP export file.');
      return;
    }

    setStage('loading');
    try {
      const zip = await JSZip.loadAsync(file);
      const csvFiles = Object.keys(zip.files).filter((name) => name.endsWith('.csv'));
      const total = csvFiles.length;
      let count = 0;
      const results = {};

      for (const filename of csvFiles) {
        const content = await zip.files[filename].async('string');
        await new Promise((resolve) => {
          Papa.parse(content, {
            header: true,
            complete: (res) => {
              const key = filename.replace('.csv', '');
              results[key] = res.data;
              count += 1;
              setProgress(Math.round((count / total) * 100));
              resolve();
            },
          });
        });
      }

      setParsedData(results);
      setStage('dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to parse ZIP file. Please try again.');
      setStage('upload');
    }
  };

  return (
    <div className="app-container">
      {stage === 'upload' && (
        <div className="upload-container">
          <img src={logo} alt="Letterboxd Screend Logo" className="logo" />
          <h1>Letterboxd Screend</h1>
          <p>Upload your Letterboxd ZIP export to get your Wrapped summary.</p>
          <input
            type="file"
            id="file-input"
            accept=".zip"
            onChange={handleFileChange}
          />
          <label htmlFor="file-input" className="upload-button">
            Upload ZIP
          </label>
        </div>
      )}

      {stage === 'loading' && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Parsing your data…</p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{progress}%</p>
        </div>
      )}

      {stage === 'dashboard' && parsedData && (
        <Dashboard parsedData={parsedData} />
      )}
    </div>
  );
}

export default App;
