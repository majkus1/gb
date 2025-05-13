import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Sidebar from '../dashboard/Sidebar'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function LeavePlanner() {
	const [selectedDates, setSelectedDates] = useState([])
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchLeavePlans()
	}, [])

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

	const fetchLeavePlans = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/leave-plans`)
			setSelectedDates(response.data)
		} catch (error) {
			console.error('Error fetching leave plans:', error)
		} finally {
			setLoading(false)
		}
	}

	const toggleDate = async date => {
		const formattedDate = new Date(date).toISOString().split('T')[0]

		try {
			const isSelected = selectedDates.includes(formattedDate)

			if (isSelected) {
				await axios.delete(`${API_URL}/api/users/leave-plans`, {
					data: { date: formattedDate }
				})
				setSelectedDates(selectedDates.filter(d => d !== formattedDate))
			} else {
				await axios.post(`${API_URL}/api/users/leave-plans`, { date: formattedDate })
				setSelectedDates([...selectedDates, formattedDate])
			}
		} catch (error) {
			console.error('Error toggling date:', error)
		}
	}

	const removeDate = async date => {
		try {
			await axios.delete(`${API_URL}/api/users/leave-plans`, {
				data: { date }
			})
			setSelectedDates(selectedDates.filter(d => d !== date))
		} catch (error) {
			console.error('Error removing date:', error)
		}
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div style={{ padding: '20px' }} id="leave-planner">
				<h3>{t('leaveplanner.mainheader')}</h3>
				<hr />
				<div style={{ marginBottom: '20px' }}>
					<h4>{t('leaveplanner.header')}</h4>
					<ul style={{ listStyle: 'none', padding: 0 }}>
						{selectedDates.map(date => (
							<li
								key={date}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '5px 10px',
									border: '1px solid #ddd',
									marginBottom: '5px',
									backgroundColor: '#f0f0f0',
									maxWidth: '300px',
								}}>
								{date}
								<button
									style={{
										background: 'red',
										color: 'white',
										border: 'none',
										borderRadius: '5px',
										cursor: 'pointer',
										padding: '5px 10px',
									}}
									onClick={() => removeDate(date)}>
									X
								</button>
							</li>
						))}
					</ul>
				</div>

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

				<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
					<FullCalendar
						plugins={[dayGridPlugin, interactionPlugin]}
						initialView="dayGridMonth"
						initialDate={new Date()}
						// locale="pl"
						locale={i18n.resolvedLanguage}
						height="auto"
						firstDay={1}
						showNonCurrentDates={false}
						events={selectedDates.map(date => ({
							title: t('leaveplanner.vactiontitle'),
							start: date,
							allDay: true,
							backgroundColor: 'blue',
						}))}
						dateClick={info => toggleDate(info.dateStr)}
						ref={calendarRef}
						datesSet={handleMonthChange}
					/>
				</div>
			</div>
			)}
		</>
	)
}

export default LeavePlanner
