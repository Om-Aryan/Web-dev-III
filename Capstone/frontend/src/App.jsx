import { useState } from 'react'
import './App.css'

const API = 'http://localhost:5000/api'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState('')
  const [page, setPage] = useState('Dashboard')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stats, setStats] = useState({ users: '—', courses: '—', announcements: '—' })

  const [adminUsers, setAdminUsers] = useState([])
  const [adminCourses, setAdminCourses] = useState([])
  const [sections, setSections] = useState([])
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', password: 'Faculty@12345', department: 'Computer Science', facultyId: '' })
  const [courseForm, setCourseForm] = useState({ code: '', title: '', department: 'Computer Science', faculty: '', section: '', credits: 3, description: '' })
  const [enrollForm, setEnrollForm] = useState({ student: '', course: '', section: '' })

  const [attendanceCourses, setAttendanceCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [enrolledStudents, setEnrolledStudents] = useState([])
  const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [attendanceStatuses, setAttendanceStatuses] = useState({})
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  const request = async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    })
    const result = await response.json()
    if (!response.ok || result.success === false) throw new Error(result.message || 'Request failed')
    return result.data
  }

  const login = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Login failed')
      const details = result.data
      const accessToken = details.accessToken || details.tokens?.accessToken
      const loggedInUser = details.user || details.profile
      if (!accessToken || !loggedInUser) throw new Error('Invalid login response')
      setToken(accessToken)
      setUser(loggedInUser)
      localStorage.setItem('campusconnect_token', accessToken)
      setPage('Dashboard')
      await loadDashboard(accessToken, loggedInUser)
    } catch (err) {
      setError(err.message || 'Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async (authToken = token, currentUser = user) => {
    setLoading(true)
    setError('')
    try {
      const headers = { Authorization: `Bearer ${authToken}` }
      const paths = ['/courses', '/announcements']
      if (currentUser?.role === 'admin') paths.push('/users?limit=100')
      const responses = await Promise.all(paths.map(path => fetch(`${API}${path}`, { headers })))
      const results = await Promise.all(responses.map(response => response.json()))
      if (results.some((result, i) => !responses[i].ok || !result.success)) throw new Error('Could not load dashboard')
      const userData = results[2]?.data
      setStats({
        users: currentUser?.role === 'admin' ? (userData?.pagination?.total ?? userData?.users?.length ?? 0) : '—',
        courses: Array.isArray(results[0].data) ? results[0].data.length : 0,
        announcements: Array.isArray(results[1].data) ? results[1].data.length : 0
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    const [usersResult, coursesResult, sectionsResult] = await Promise.all([
      request('/users?limit=100'), request('/courses'), request('/sections')
    ])
    setAdminUsers(usersResult.users || usersResult || [])
    setAdminCourses(coursesResult || [])
    setSections(sectionsResult || [])
  }

  const loadPage = async (nextPage) => {
    setPage(nextPage)
    setData(null)
    setError('')
    setNotice('')
    if (nextPage === 'Dashboard') return loadDashboard()
    if (nextPage === 'My Profile') return
    setLoading(true)
    try {
      if (nextPage === 'Manage Campus') {
        await loadAdminData()
      } else if (nextPage === 'Attendance' && user.role !== 'student') {
        const courseList = await request(user.role === 'faculty' ? `/courses?faculty=${user._id}` : '/courses')
        setAttendanceCourses(courseList || [])
        setSelectedCourse('')
        setEnrolledStudents([])
      } else {
        const endpoints = {
          Courses: '/courses',
          Users: '/users?limit=100',
          Attendance: '/attendance/me',
          'Attendance Summary': '/attendance/summary',
          'Low Attendance': '/reports/low-attendance',
          Announcements: '/announcements'
        }
        if (endpoints[nextPage]) setData(await request(endpoints[nextPage]))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createFaculty = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await request('/users', {
        method: 'POST',
        body: JSON.stringify({ ...facultyForm, role: 'faculty' })
      })
      setNotice('Faculty account created successfully.')
      setFacultyForm({ name: '', email: '', password: 'Faculty@12345', department: 'Computer Science', facultyId: '' })
      await loadAdminData()
    } catch (err) { setError(err.message) }
  }

  const createCourse = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await request('/courses', {
        method: 'POST',
        body: JSON.stringify({ ...courseForm, credits: Number(courseForm.credits) })
      })
      setNotice('Course created successfully.')
      setCourseForm({ code: '', title: '', department: 'Computer Science', faculty: '', section: '', credits: 3, description: '' })
      await loadAdminData()
    } catch (err) { setError(err.message) }
  }

  const enrollStudent = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await request('/enrollments', { method: 'POST', body: JSON.stringify(enrollForm) })
      setNotice('Student enrolled in the selected course.')
      setEnrollForm({ student: '', course: '', section: '' })
    } catch (err) { setError(err.message) }
  }

  const renameAarav = async (person) => {
    if (!window.confirm(`Rename ${person.name} to Om?`)) return
    try {
      await request(`/users/${person._id}`, { method: 'PATCH', body: JSON.stringify({ name: 'Om' }) })
      setNotice('Student name updated to Om.')
      await loadAdminData()
    } catch (err) { setError(err.message) }
  }

  const loadEnrolledStudents = async (courseId) => {
    setSelectedCourse(courseId)
    setEnrolledStudents([])
    setAttendanceStatuses({})
    if (!courseId) return
    setAttendanceLoading(true)
    try {
      const rows = await request(`/enrollments?course=${courseId}`)
      const activeRows = (rows || []).filter(row => row.status === 'active')
      setEnrolledStudents(activeRows)
      const initial = {}
      activeRows.forEach(row => { initial[row.student._id] = 'present' })
      setAttendanceStatuses(initial)
    } catch (err) { setError(err.message) }
    finally { setAttendanceLoading(false) }
  }

  const saveAttendance = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const course = attendanceCourses.find(item => item._id === selectedCourse)
    if (!course || !enrolledStudents.length) {
      setError('Select a course with enrolled students first.')
      return
    }
    const sectionId = course.section?._id || course.section || enrolledStudents[0]?.section?._id
    if (!sectionId) {
      setError('This course has no section assigned. Ask the admin to assign a section.')
      return
    }
    setAttendanceLoading(true)
    try {
      const records = enrolledStudents.map(row => ({
        student: row.student._id,
        status: attendanceStatuses[row.student._id] || 'present'
      }))
      await request('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ course: selectedCourse, section: sectionId, date: attendanceDate, records })
      })
      setNotice(`Attendance saved for ${records.length} students.`)
    } catch (err) { setError(err.message) }
    finally { setAttendanceLoading(false) }
  }

  const logout = () => {
    setUser(null); setToken(''); setData(null); setEmail(''); setPassword('')
    setError(''); setNotice(''); localStorage.removeItem('campusconnect_token')
  }

  if (!user) return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-icon">CC</div>
        <p className="eyebrow">CAMPUS MANAGEMENT PLATFORM</p>
        <h1>CampusConnect</h1>
        <p className="subtitle">Your campus, connected.</p>
        <form onSubmit={login}>
          <label>Email address</label>
          <input type="email" placeholder="Enter your college email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button className="primary-button login-button" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="login-footer">One place for learning, teaching and campus life.</p>
      </div>
    </div>
  )

  const role = user.role || 'student'
  const commonPages = ['Dashboard', 'My Profile', 'Courses', 'Attendance', 'Attendance Summary', 'Announcements']
  const rolePages = {
    admin: ['Manage Campus', 'Users', 'Low Attendance'],
    faculty: ['Low Attendance'],
    student: []
  }
  const pages = [...commonPages, ...(rolePages[role] || [])]
  const users = Array.isArray(data) ? data : data?.users || []
  const students = adminUsers.filter(person => person.role === 'student')
  const facultyMembers = adminUsers.filter(person => person.role === 'faculty')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="brand-icon small">CC</span><span>CampusConnect</span></div>
        <p className="menu-heading">WORKSPACE</p>
        {pages.map(item => (
          <button key={item} className={`nav-item ${page === item ? 'active' : ''}`} onClick={() => loadPage(item)}>
            <span className="nav-dot">{item === 'Dashboard' ? '⌂' : item === 'Courses' ? '▤' : item === 'Attendance' ? '✓' : item === 'Manage Campus' ? '+' : item === 'Users' ? '♙' : item === 'Low Attendance' ? '!' : item === 'Announcements' ? '◉' : item === 'My Profile' ? '○' : '▥'}</span>
            {item}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="sidebar-user"><div className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div><div><strong>{user.name}</strong><span>{role}</span></div></div>
          <button className="logout-button" onClick={logout}>↪ Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div><p className="eyebrow">CAMPUSCONNECT / {role.toUpperCase()}</p><h2>{page}</h2><p className="topbar-subtitle">Your campus, connected.</p></div>
          <div className="user-info"><div className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div><div><strong>{user.name}</strong><span>{role}</span></div></div>
        </header>
        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}

        {page === 'Dashboard' ? (
          <>
            <section className="welcome-card"><div><p className="eyebrow">WELCOME BACK</p><h1>Hello, {user.name}!</h1><p>Everything happening on your campus, in one place.</p></div><div className="welcome-art"><span>CC</span><i>✦</i></div></section>
            <div className="section-heading"><div><p className="eyebrow">AT A GLANCE</p><h3>Campus overview</h3></div></div>
            <section className="stats-grid">
              {role === 'admin' && <StatCard label="Registered users" value={stats.users} icon="♙" />}
              <StatCard label="Active courses" value={stats.courses} icon="▤" />
              <StatCard label="Announcements" value={stats.announcements} icon="◉" />
            </section>
            {loading && <p className="muted">Refreshing overview…</p>}
            <div className="section-heading"><div><p className="eyebrow">GET STARTED</p><h3>Quick access</h3></div></div>
            <section className="dashboard-grid">{pages.filter(item => item !== 'Dashboard').map(item => <button className="dashboard-card" key={item} onClick={() => loadPage(item)}><span className="quick-icon">{item === 'Courses' ? '▤' : item === 'Attendance' ? '✓' : item === 'Manage Campus' ? '+' : item === 'Users' ? '♙' : item === 'Low Attendance' ? '!' : item === 'Announcements' ? '◉' : '▥'}</span><strong>{item}</strong><span>Open section <b>→</b></span></button>)}</section>
          </>
        ) : page === 'My Profile' ? (
          <section className="panel profile-panel"><div className="profile-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div><h2>{user.name}</h2><span className={`role-badge role-${role}`}>{role}</span><div className="profile-details"><Detail label="Email" value={user.email} /><Detail label="Role" value={role} /><Detail label="Department" value={user.department || 'Not assigned'} /><Detail label="Student / Faculty ID" value={user.studentId || user.facultyId || 'Not applicable'} /></div></section>
        ) : page === 'Manage Campus' ? (
          <div className="manage-grid">
            <section className="panel"><PanelTitle eyebrow="PEOPLE" title="Add faculty member" /><form className="stack-form" onSubmit={createFaculty}>
              <label>Full name<input required value={facultyForm.name} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} placeholder="e.g. Dr. Asha Sharma" /></label>
              <label>College email<input required type="email" value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} placeholder="faculty@college.edu" /></label>
              <label>Faculty ID<input required value={facultyForm.facultyId} onChange={e => setFacultyForm({ ...facultyForm, facultyId: e.target.value })} placeholder="FAC002" /></label>
              <label>Department<input required value={facultyForm.department} onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })} /></label>
              <label>Initial password<input required value={facultyForm.password} onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })} /></label>
              <button className="primary-button">Create faculty account</button>
            </form></section>

            <section className="panel"><PanelTitle eyebrow="ACADEMICS" title="Add a course" /><form className="stack-form" onSubmit={createCourse}>
              <label>Course code<input required value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} placeholder="e.g. CSE302" /></label>
              <label>Course title<input required value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Web Development" /></label>
              <label>Department<input required value={courseForm.department} onChange={e => setCourseForm({ ...courseForm, department: e.target.value })} /></label>
              <label>Faculty<select required value={courseForm.faculty} onChange={e => setCourseForm({ ...courseForm, faculty: e.target.value })}><option value="">Select faculty</option>{facultyMembers.map(person => <option key={person._id} value={person._id}>{person.name} — {person.facultyId || person.email}</option>)}</select></label>
              <label>Section<select required value={courseForm.section} onChange={e => setCourseForm({ ...courseForm, section: e.target.value })}><option value="">Select section</option>{sections.map(section => <option key={section._id} value={section._id}>{section.name} · Semester {section.semester}</option>)}</select></label>
              <label>Credits<input type="number" min="1" max="10" required value={courseForm.credits} onChange={e => setCourseForm({ ...courseForm, credits: e.target.value })} /></label>
              <button className="primary-button">Create course</button>
            </form></section>

            <section className="panel"><PanelTitle eyebrow="ENROLMENT" title="Enroll a student" /><form className="stack-form" onSubmit={enrollStudent}>
              <label>Student<select required value={enrollForm.student} onChange={e => setEnrollForm({ ...enrollForm, student: e.target.value })}><option value="">Select student</option>{students.map(person => <option key={person._id} value={person._id}>{person.name} · {person.studentId || person.email}</option>)}</select></label>
              <label>Course<select required value={enrollForm.course} onChange={e => setEnrollForm({ ...enrollForm, course: e.target.value })}><option value="">Select course</option>{adminCourses.map(course => <option key={course._id} value={course._id}>{course.code} — {course.title}</option>)}</select></label>
              <label>Section<select required value={enrollForm.section} onChange={e => setEnrollForm({ ...enrollForm, section: e.target.value })}><option value="">Select section</option>{sections.map(section => <option key={section._id} value={section._id}>{section.name}</option>)}</select></label>
              <button className="primary-button">Enroll student</button>
            </form></section>

            <section className="panel"><PanelTitle eyebrow="CURRENT RECORDS" title="Faculty and student list" /><div className="compact-list">{adminUsers.map(person => <div className="compact-row" key={person._id}><div><strong>{person.name}</strong><span>{person.email}</span></div><span className={`role-badge role-${person.role}`}>{person.role}</span>{person.role === 'student' && person.name.toLowerCase().includes('aarav') && <button className="small-button" onClick={() => renameAarav(person)}>Rename to Om</button>}</div>)}</div></section>
          </div>
        ) : page === 'Attendance' && role !== 'student' ? (
          <section className="panel"><PanelTitle eyebrow="FACULTY WORKSPACE" title="Mark class attendance" /><p className="muted">Choose a course and date, then set each enrolled student's status. Saved records are stored in the database.</p>
            <div className="attendance-controls"><label>Course<select value={selectedCourse} onChange={e => loadEnrolledStudents(e.target.value)}><option value="">Select course</option>{attendanceCourses.map(course => <option key={course._id} value={course._id}>{course.code} — {course.title}</option>)}</select></label><label>Class date<input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></label></div>
            {attendanceLoading && <p className="muted">Loading enrolled students…</p>}
            {selectedCourse && !attendanceLoading && enrolledStudents.length === 0 && <p className="empty-state">No actively enrolled students found for this course. Ask the admin to enroll students first.</p>}
            {enrolledStudents.length > 0 && <form onSubmit={saveAttendance}><div className="attendance-table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Student ID</th><th>Attendance status</th></tr></thead><tbody>{enrolledStudents.map(row => <tr key={row._id}><td><strong>{row.student.name}</strong><span className="table-sub">{row.student.email}</span></td><td>{row.student.studentId || '—'}</td><td><select value={attendanceStatuses[row.student._id] || 'present'} onChange={e => setAttendanceStatuses({ ...attendanceStatuses, [row.student._id]: e.target.value })}><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option></select></td></tr>)}</tbody></table></div><button className="primary-button save-attendance" disabled={attendanceLoading}>Save attendance</button></form>}
          </section>
        ) : (
          <section className="panel"><PanelTitle eyebrow="CAMPUS RECORDS" title={page} />
            {loading ? <p className="muted">Loading records…</p> : data === null ? <p className="empty-state">No information to display.</p> : page === 'Courses' && Array.isArray(data) ? (
              data.length ? <div className="course-grid">{data.map(course => <article className="course-card" key={course._id}><span className="course-code">{course.code}</span><h3>{course.title}</h3><p>{course.department}</p><div className="course-meta"><span>{course.credits} credits</span><span>{course.section?.name || 'Section not assigned'}</span></div><div className="course-faculty">Faculty: <strong>{course.faculty?.name || 'Not assigned'}</strong></div></article>)}</div> : <p className="empty-state">No active courses found.</p>
            ) : page === 'Users' ? (
              users.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>ID</th><th>Status</th></tr></thead><tbody>{users.map(person => <tr key={person._id}><td><strong>{person.name}</strong></td><td>{person.email}</td><td><span className={`role-badge role-${person.role}`}>{person.role}</span></td><td>{person.department || '—'}</td><td>{person.studentId || person.facultyId || '—'}</td><td>{person.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div> : <p className="empty-state">No users found.</p>
            ) : page === 'Announcements' && Array.isArray(data) ? (
              data.length ? <div className="announcement-grid">{data.map(item => <article className="announcement-card" key={item._id}><span className="announcement-tag">{item.audience}</span><h3>{item.title}</h3><p>{item.message}</p><div className="announcement-footer"><span>By {item.createdBy?.name || 'Campus Admin'}</span><span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''}</span></div></article>)}</div> : <p className="empty-state">No announcements available.</p>
            ) : page === 'Attendance Summary' && Array.isArray(data) ? (
              data.length ? <div className="attendance-grid">{data.map(item => <article className="attendance-card" key={item.courseId}><span className="course-code">{item.courseCode}</span><h3>{item.courseTitle}</h3><div className="attendance-percentage">{item.percentage}%</div><div className="progress-track"><div className="progress-value" style={{ width: `${Math.min(100, item.percentage)}%` }} /></div><p>{item.attended} of {item.totalClasses} classes attended</p><span className={`attendance-pill ${item.percentage < 75 ? 'low' : 'good'}`}>{item.percentage < 75 ? 'Below 75%' : 'On track'}</span></article>)}</div> : <p className="empty-state">No attendance summary yet. It will appear after faculty marks attendance.</p>
            ) : page === 'Attendance' && Array.isArray(data) ? (
              data.length ? <div className="record-list">{data.map(item => <div className="record-row" key={item._id}><div><strong>{item.course?.code || 'Course'}</strong><span>{item.course?.title || 'Course attendance'}</span><small>{new Date(item.date).toLocaleDateString()}</small></div><span className={`status-pill ${item.status}`}>{item.status}</span></div>)}</div> : <p className="empty-state">No attendance records yet. Faculty will add them after your classes.</p>
            ) : page === 'Low Attendance' && Array.isArray(data) ? (
              data.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Course</th><th>Classes attended</th><th>Attendance</th></tr></thead><tbody>{data.map((item, index) => <tr key={`${item.studentEmail}-${item.courseCode}-${index}`}><td><strong>{item.studentName}</strong><span className="table-sub">{item.studentEmail}</span></td><td>{item.courseCode} · {item.courseTitle}</td><td>{item.attended}/{item.totalClasses}</td><td><span className="attendance-pill low">{item.percentage}%</span></td></tr>)}</tbody></table></div> : <p className="empty-state">No students are currently below the attendance threshold.</p>
            ) : <pre className="json-output">{JSON.stringify(data, null, 2)}</pre>}
          </section>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, icon }) {
  return <article className="stat-card"><span className="stat-icon">{icon}</span><p>{label}</p><h2>{value}</h2></article>
}
function PanelTitle({ eyebrow, title }) {
  return <div className="panel-title"><p className="eyebrow">{eyebrow}</p><h3>{title}</h3></div>
}
function Detail({ label, value }) {
  return <div className="profile-detail"><span>{label}</span><strong>{value || 'Not available'}</strong></div>
}

export default App
