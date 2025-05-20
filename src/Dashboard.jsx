// src/Dashboard.jsx

import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend, Sector
} from 'recharts'

export default function Dashboard({ data }) {
  const [activeIndex, setActiveIndex] = useState(null)

  // CSV imports
  const watched    = data.watched        || []
  const ratings    = data.ratings        || []
  const diary      = data.diary          || []
  const likedFilms = data['likes/films'] || []
  const reviews    = data.reviews        || []

  // Helper data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // 1) Metrics
  const totalEntries   = watched.length
  const totalRatings   = ratings.length
  const totalReviews   = reviews.length
  const totalFavorites = likedFilms.length
  const avgRating      = (
    ratings.reduce((s,r)=>(s+Number(r.Rating)||0),0) /
    (ratings.length||1)
  ).toFixed(1)
  const rewatchCount = diary.filter(d => {
    const v=d.Rewatch??d.rewatch
    return v==='Yes'||v==='TRUE'||v===true
  }).length

  // 2) First/Last watch
  const watchDates = watched
    .map(w=>new Date(w.Date)).filter(d=>!isNaN(d))
  const firstWatch = watchDates.length
    ? new Date(Math.min(...watchDates)).toLocaleDateString() : '—'
  const lastWatch = watchDates.length
    ? new Date(Math.max(...watchDates)).toLocaleDateString() : '—'

  // 3) Monthly Activity for BarChart
  const activityCounts = watched.reduce((acc,w)=>{
    const m=new Date(w.Date)
      .toLocaleString('default',{month:'short'})
    if (months.includes(m)) acc[m]=(acc[m]||0)+1
    return acc
  },{})
  const monthlyActivity = months.map(m=>({month:m, count:activityCounts[m]||0}))

  // 4) Rating Distribution for PieChart
  const distMap = ratings.reduce((acc,r)=>{
    const v=Math.round((Number(r.Rating)||0)*2)/2
    acc[v]=(acc[v]||0)+1
    return acc
  },{})
  const pieData = Object.entries(distMap)
    .map(([name,value])=>({name,value}))
    .sort((a,b)=>parseFloat(a.name)-parseFloat(b.name))
  const COLORS=['#C5A3FF','#A1C4FD','#6B5B95','#5B84B1','#FFB3C1','#FFD460']

  // 5) Rating Trend for LineChart
  const ratingAgg = ratings.reduce((acc,r)=>{
    const m=new Date(r.Date)
      .toLocaleString('default',{month:'short'})
    if (months.includes(m)) {
      acc[m]=acc[m]||{sum:0,count:0}
      acc[m].sum   += Number(r.Rating)||0
      acc[m].count += 1
    }
    return acc
  },{})
  const monthlyAvg = months.map(m=>({
    month: m,
    avg: ratingAgg[m] ? +(ratingAgg[m].sum/ratingAgg[m].count).toFixed(1) : 0
  }))

  // Pie hover shape
  const renderActiveShape = props => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
    return (
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius+10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    )
  }

  return (
    <div className="dashboard">
      <h2 style={{ margin: '1rem 2rem' }}>Your Cinematic Wrapped</h2>
      <div className="grid">

        {/* 1) Small metric tiles */}
        <div className="dashboard-card tile--small">
          <h3>Total Entries</h3><p>{totalEntries}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Rewatches</h3><p>{rewatchCount}</p>
        </div>

        {/* 2) Large Bar Chart */}
        <div className="dashboard-card tile--large">
          <h3>Monthly Activity</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={monthlyActivity} margin={{ top:20,right:30,left:0,bottom:0 }}>
              <XAxis dataKey="month" stroke="#555"/>
              <YAxis allowDecimals={false} stroke="#555"/>
              <Tooltip/>
              <Bar dataKey="count" fill="#C5A3FF" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3) More metric tiles */}
        <div className="dashboard-card tile--small">
          <h3>Total Ratings</h3><p>{totalRatings}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Average Rating</h3><p>{avgRating}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Total Reviews</h3><p>{totalReviews}</p>
        </div>

        {/* 4) Large Pie Chart */}
        <div className="dashboard-card tile--large">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_,i)=>setActiveIndex(i)}
                onMouseLeave={()=>setActiveIndex(null)}
                labelLine={false}
              >
                {pieData.map((_,i)=>(
                  <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                ))}
              </Pie>
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={val=>`${val}★`}
                wrapperStyle={{paddingLeft:20}}
              />
              <Tooltip formatter={v=>`${v} films`}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 5) Final metrics */}
        <div className="dashboard-card tile--small">
          <h3>Total Favorites</h3><p>{totalFavorites}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>First Watch</h3><p>{firstWatch}</p>
        </div>

        {/* 6) Large Line Chart */}
        <div className="dashboard-card tile--large">
          <h3>Rating Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={monthlyAvg} margin={{ top:20,right:30,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="month" stroke="#555"/>
              <YAxis domain={[0,5]} stroke="#555"/>
              <Tooltip/>
              <Line type="monotone" dataKey="avg" stroke="#6B5B95" dot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 7) Last watch */}
        <div className="dashboard-card tile--small">
          <h3>Last Watch</h3><p>{lastWatch}</p>
        </div>
      </div>
    </div>
  )
}
