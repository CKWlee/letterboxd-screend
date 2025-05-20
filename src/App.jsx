import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import JSZip from 'jszip'
import Papa from 'papaparse'
import Dashboard from './Dashboard'
import logoUrl from '/letterboxd-decal-dots-neg-rgb-1.png'


export default function App() {
  const [stage, setStage] = useState('upload') // 'upload' | 'loading' | 'dashboard'
  const [data, setData] = useState(null)

  const handleUpload = async e => {
    const file = e.target.files[0]
    if (!file) return
    setStage('loading')

    const zip = await JSZip.loadAsync(file)
    const parsed = {}
    await Promise.all(
      Object.keys(zip.files)
        .filter(fn => fn.endsWith('.csv'))
        .map(async fn => {
          const text = await zip.files[fn].async('string')
          parsed[fn.replace('.csv', '')] = Papa.parse(text, {
            header: true,
            skipEmptyLines: true
          }).data
        })
    )

    // extended delay so the progress bar remains visible
    setTimeout(() => {
      setData(parsed)
      setStage('dashboard')
    }, 2000)
  }

  return (
    <div className="App">
      <AnimatePresence exitBeforeEnter>
        {stage === 'upload' && (
          <motion.div
            className="upload-screen"
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              src={`${import.meta.env.BASE_URL}letterboxd-decal-dots-neg-rgb-1.png`}
              alt="Letterboxd Logo"
              className="logo-flicker"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
          />
            <h1>Letterboxd Screend</h1>
            <p className="subtext">
              Upload your Letterboxd export (.zip of CSVs) to reveal a cinematic dashboard of your movie journey.
            </p>
            <input
              id="file"
              type="file"
              accept=".zip"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="file" className="UploadBtn">
              Select File
            </label>
          </motion.div>
        )}

        {stage === 'loading' && (
          <motion.div
            className="loading-screen"
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="progress-container">
              <div className="progress-bar" />
            </div>
            <p className="subtext">Parsing your cinematic history…</p>
          </motion.div>
        )}

        {stage === 'dashboard' && <Dashboard key="dashboard" data={data} />}
      </AnimatePresence>
    </div>
  )
}
