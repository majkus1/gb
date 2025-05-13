import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'

function EmployeeLeaveCalendar() {
	const { userId } = useParams()
	const [leavePlans, setLeavePlans] = useState([])
	const currentYear = new Date().getFullYear()
	const [user, setUser] = useState(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchUserDetails()
		fetchLeavePlans()
	}, [userId])

	const fetchUserDetails = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/${userId}`)
			setUser(response.data)
		} catch (error) {
			console.error('Failed to fetch user details:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchLeavePlans = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/admin/leave-plans/${userId}`)
			setLeavePlans(response.data)
		} catch (error) {
			console.error('Error fetching leave plans:', error)
		} finally {
			setLoading(false)
		}
	}

	const renderMonths = () => {
		return Array.from({ length: 12 }, (_, month) => (
			<div key={month} className="month-calendar allleaveplans" style={{ margin: '10px', border: '1px solid #ddd' }}>
				<FullCalendar
					plugins={[dayGridPlugin]}
					initialView="dayGridMonth"
					initialDate={new Date(currentYear, month)}
					locale={i18n.resolvedLanguage}
					height="auto"
					showNonCurrentDates={false}
					events={leavePlans.map(date => ({
						title: t('leaveplanner.vactiontitle'),
						start: date,
						allDay: true,
						backgroundColor: 'blue',
					}))}
				/>
			</div>
		))
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div className="leave-calendar-plans-one-employee">
				{user && (
					<h3 style={{ padding: '20px', paddingLeft: '10px' }}>
						{t('leaveplanone.h3')} {user.firstName} {user.lastName}
					</h3>
				)}
				<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>{renderMonths()}</div>
			</div>
			)}
		</>
	)
}

export default EmployeeLeaveCalendar
