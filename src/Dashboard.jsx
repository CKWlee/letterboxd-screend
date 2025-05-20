// src/Dashboard.jsx

import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend, Sector
} from 'recharts'

export default function Dashboard({ data }) {
  const watched    = data.watched        || []
  const ratings    = data.ratings        || []
  const diary      = data.diary          || []
  const likedFilms = data['likes/films'] || []
  const reviews    = data.reviews        || []

  // months labels
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  // simple metrics
  const totalEntries   = watched.length
  const totalRatings   = ratings.length
  const totalReviews   = reviews.length
  const totalFavorites = likedFilms.length
  const rewatchCount   = diary.filter(d => ['Yes','TRUE',true].includes(d.Rewatch || d.rewatch)).length
  const avgRating = (
    ratings.reduce((sum,r)=>(sum + Number(r.Rating)||0),0) /
    (ratings.length||1)
  ).toFixed(1)

  // first/last watch
  const dates = watched.map(w=>new Date(w.Date)).filter(d=>!isNaN(d))
  const firstWatch = dates.length
    ? new Date(Math.min(...dates)).toLocaleDateString()
    : '—'
  const lastWatch = dates.length
    ? new Date(Math.max(...dates)).toLocaleDateString()
    : '—'

  // 1) monthly activity bar
  const monthlyActivity = months.map((m,i)=>({
    month: m,
    count: watched.filter(w=> {
      const d=new Date(w.Date)
      return !isNaN(d)&&d.getMonth()===i
    }).length
  }))

  // 2) rating distribution pie
  const starBuckets = {}
  ratings.forEach(r=>{
    const v=parseFloat(r.Rating)
    if(!isNaN(v)) starBuckets[v]=(starBuckets[v]||0)+1
  })
  const pieData = Object.keys(starBuckets)
    .map(k=>({ name:k, value:starBuckets[k] }))
    .sort((a,b)=>parseFloat(a.name)-parseFloat(b.name))
  const COLORS = ['#C5A3FF','#A1C4FD','#6B5B95','#FF9AA2','#FFB7B2','#FFDAC1','#E2F0CB','#B5EAD7']

  // 3) rating trend line
  const monthlyAvg = months.map((m,i)=> {
    const vals = ratings
      .map((r,j)=>({ d:new Date(r.Date), v:Number(r.Rating)||0 }))
      .filter(x=>!isNaN(x.d)&& x.d.getMonth()===i)
      .map(x=>x.v)
    const avg = vals.length
      ? vals.reduce((a,b)=>a+b,0)/vals.length
      : 0
    return { month:m, avg:Number(avg.toFixed(1)) }
  })

  // pie hover expansion
  const [activeI,setActiveI] = useState(null)
  const renderActive = props => {
    const { cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill } = props
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

        {/* small metrics */}
        <div className="dashboard-card tile--small">
          <h3>Total Entries</h3>
          <p>{totalEntries}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Rewatches</h3>
          <p>{rewatchCount}</p>
        </div>

        {/* monthly activity bar spans 2 cols */}
        <div className="dashboard-card tile--wide">
          <h3>Monthly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyActivity} margin={{ top:20,right:30,left:0,bottom:0 }}>
              <XAxis dataKey="month" stroke="#555" />
              <YAxis allowDecimals={false} stroke="#555" />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS[0]} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* more small metrics */}
        <div className="dashboard-card tile--small">
          <h3>Total Ratings</h3>
          <p>{totalRatings}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Average Rating</h3>
          <p>{avgRating}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>Total Reviews</h3>
          <p>{totalReviews}</p>
        </div>

        {/* pie chart spans 2 cols */}
        <div className="dashboard-card tile--wide">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={70}
                activeIndex={activeI}
                activeShape={renderActive}
                onMouseEnter={(_,i)=>setActiveI(i)}
                onMouseLeave={()=>setActiveI(null)}
                labelLine={false}
              >
                {pieData.map((_,i)=>(
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={v=>`${v}★`}
                wrapperStyle={{ paddingLeft:20 }}
              />
              <Tooltip formatter={v=>`${v} films`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* remaining small */}
        <div className="dashboard-card tile--small">
          <h3>Total Favorites</h3>
          <p>{totalFavorites}</p>
        </div>
        <div className="dashboard-card tile--small">
          <h3>First Watch</h3>
          <p>{firstWatch}</p>
        </div>

        {/* rating trend line spans 2 cols */}
        <div className="dashboard-card tile--wide">
          <h3>Rating Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyAvg} margin={{ top:20,right:30,left:0,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#555" />
              <YAxis domain={[0,5]} stroke="#555" />
              <Tooltip />
              <Line type="monotone" dataKey="avg" stroke={COLORS[2]} dot={{ r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card tile--small">
          <h3>Last Watch</h3>
          <p>{lastWatch}</p>
        </div>
      </div>
    </div>
  )
}
