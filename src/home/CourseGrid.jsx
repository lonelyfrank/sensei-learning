import React from 'react'

/* Contenitore griglia o lista per le card */
function CourseGrid({ view, children }) {
  if (view === 'list') {
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
      {children}
    </div>
  )
}

export default CourseGrid