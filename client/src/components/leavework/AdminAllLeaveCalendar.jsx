import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'

function AdminAllLeaveCalendar() {
	const [leavePlans, setLeavePlans] = useState([])
	const colorsRef = useRef({})
	const usedColors = useRef(new Set())
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const [users, setUsers] = useState([])
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, logout, username } = useAuth()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchAllLeavePlans()
		fetchUsers()
	}, [])

	const fetchUsers = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/alluserplans`)
			setUsers(response.data)
		} catch (error) {
			console.error('Failed to fetch users:', error)
			setError(t('list.error'))
		} finally {
			setLoading(false)
		}
	}

	const fetchAllLeavePlans = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/admin/all-leave-plans`)
			setLeavePlans(response.data)
		} catch (error) {
			console.error('Error fetching all leave plans:', error)
		} finally {
			setLoading(false)
		}
	}

	const generateUniqueColor = () => {
		let color
		do {
			const randomHue = Math.random() * 360
			color = `hsl(${randomHue}, 70%, 80%)`
		} while (usedColors.current.has(color))
		usedColors.current.add(color)
		return color
	}
	
	const getColorForUser = username => {
		if (!colorsRef.current[username]) {
			colorsRef.current[username] = generateUniqueColor()
		}
		return colorsRef.current[username]
	}

	const handleMonthSelect = event => {
		const newMonth = parseInt(event.target.value, 10)
		setCurrentMonth(newMonth)
		goToSelectedDate(newMonth, currentYear)
	}

	const handleYearSelect = event => {
		const newYear = parseInt(event.target.value, 10)
		setCurrentYear(newYear)
		goToSelectedDate(currentMonth, newYear)
	}

	const goToSelectedDate = (month, year) => {
		const calendarApi = calendarRef.current.getApi()
		calendarApi.gotoDate(new Date(year, month, 1))
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
	}

	const handleUserClick = userId => {
		navigate(`/leave-plans/${userId}`)
	}

	return (
		<>
			<Sidebar handleLogout={logout} role={role} username={username} />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id='all-leaveplans' style={{ padding: "20px" }}>
				<h3>{t('planslist.h3')}</h3>
				<hr />
				{error && <p style={{ color: 'red' }}>{error}</p>}
                <p>{t('planslist.emplo')}</p>
				<ul>
					{users.map(user => (
						<li key={user._id} onClick={() => handleUserClick(user._id)} style={{ cursor: "pointer" }}>
							{user.firstName} {user.lastName} - {user.roles.join(', ')} - {user.position || 'Brak stanowiska'}
						</li>
					))}
				</ul>
				<div className="calendar-controls">
					<label>
					{t('workcalendar.monthlabel')}
						<select value={currentMonth} onChange={handleMonthSelect} style={{ marginLeft: '5px' }}>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
										.replace(/^./, str => str.toUpperCase())}
								</option>
							))}
						</select>
					</label>
					<label style={{ marginLeft: '10px' }}>
					{t('workcalendar.yearlabel')}
						<select value={currentYear} onChange={handleYearSelect} style={{ marginLeft: '5px' }}>
							{Array.from({ length: 20 }, (_, i) => {
								const year = new Date().getFullYear() - 10 + i
								return (
									<option key={year} value={year}>
										{year}
									</option>
								)
							})}
						</select>
					</label>
				</div>
				<div>
					<FullCalendar
						plugins={[dayGridPlugin]}
						initialView='dayGridMonth'
						initialDate={new Date()}
						locale={i18n.resolvedLanguage}
						height='auto'
						firstDay={1}
						showNonCurrentDates={false}
						events={leavePlans.map(plan => ({
							title: `${plan.firstName} ${plan.lastName}`,
							start: plan.date,
							allDay: true,
							backgroundColor: getColorForUser(plan.username),
							borderColor: getColorForUser(plan.username),
						}))}
						ref={calendarRef}
						datesSet={handleMonthChange}
					/>
				</div>
			</div>
			)}
		</>
	)
}

export default AdminAllLeaveCalendar
