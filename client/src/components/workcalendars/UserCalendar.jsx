import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Sidebar from '../dashboard/Sidebar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function UserCalendar() {
	const { userId } = useParams()
	const [user, setUser] = useState(null)
	const [workdays, setWorkdays] = useState([])
	const [totalHours, setTotalHours] = useState(0)
	const [totalLeaveDays, setTotalLeaveDays] = useState(0)
	const [totalLeaveHours, setTotalLeaveHours] = useState(0)
	const [totalWorkDays, setTotalWorkDays] = useState(0)
	const [totalOtherAbsences, setTotalOtherAbsences] = useState(0)
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [isConfirmed, setIsConfirmed] = useState(false)
	const [additionalHours, setAdditionalHours] = useState(0)
	const pdfRef = useRef()
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchUserDetails()
		fetchUserWorkdays()
	}, [userId])

	useEffect(() => {
		calculateTotals(workdays, currentMonth, currentYear)
	}, [workdays, currentMonth, currentYear])

	useEffect(() => {
		checkConfirmationStatus()
	}, [currentMonth, currentYear, userId])

	const fetchUserDetails = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/${userId}`)
			// console.log('Fetched user details:', response.data)
			setUser(response.data)
		} catch (error) {
			console.error('Failed to fetch user details:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchUserWorkdays = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/workdays/${userId}`)
			// console.log('Fetched workdays:', response.data)
			setWorkdays(response.data)
		} catch (error) {
			console.error('Failed to fetch workdays:', error)
		} finally {
			setLoading(false)
		}
	}

	const checkConfirmationStatus = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/workdays/confirmation-status/${userId}`, {
				params: { month: currentMonth, year: currentYear }
			})
			setIsConfirmed(response.data.isConfirmed || false)
		} catch (error) {
			console.error('Failed to check confirmation status:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		checkConfirmationStatus()
	}, [currentMonth, currentYear, userId])

	const calculateTotals = (workdays, month, year) => {
		let hours = 0
		let leaveDays = 0
		let overtime = 0
		let workDaysSet = new Set()
		let otherAbsences = 0

		const filteredWorkdays = workdays.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === month && eventDate.getFullYear() === year
		})

		filteredWorkdays.forEach(day => {
			if (day.hoursWorked) {
				hours += day.hoursWorked
				workDaysSet.add(new Date(day.date).toDateString())
			}
			if (day.additionalWorked) {
				overtime += day.additionalWorked
			}
			if (day.absenceType) {
				if (day.absenceType.toLowerCase().includes('urlop')) {
					leaveDays += 1
				} else {
					otherAbsences += 1
				}
			}
		})

		setTotalHours(hours)
		setAdditionalHours(overtime)
		setTotalWorkDays(workDaysSet.size)
		setTotalLeaveDays(leaveDays)
		setTotalLeaveHours(leaveDays * 8)
		setTotalOtherAbsences(otherAbsences)
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
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

	const generatePDF = () => {
		const input = pdfRef.current
		html2canvas(input, { scale: 2 }).then(canvas => {
			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF('p', 'mm', 'a4')
			const imgProps = pdf.getImageProperties(imgData)
			const pdfWidth = pdf.internal.pageSize.getWidth()
			const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

			pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
			pdf.save(`${t('pdf.filename')}_${user?.firstName}_${user?.lastName}_${currentMonth + 1}_${currentYear}.pdf`)
		})
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id="calendars-works-review">
				<button onClick={generatePDF} className="btn-pdf btn btn-primary">
				{t('workcalendar.genepdf')}
				</button>
				<label style={{ marginLeft: '30px' }}>
				{t('workcalendar.monthlabel')}
					<select value={currentMonth} onChange={handleMonthSelect} style={{ marginRight: '5px', marginLeft: '5px' }}>
						{Array.from({ length: 12 }, (_, i) => (
							<option key={i} value={i}>
								{new Date(0, i).toLocaleString(i18n.resolvedLanguage, { month: 'long' })}
							</option>
						))}
					</select>
				</label>
				<label>
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
				<div ref={pdfRef} style={{ marginTop: '30px', padding: '10px' }}>
					{user && (
						<h3 style={{ marginLeft: '20px' }}>
							{t('workcalendar.h3admin')}{' '}
							<span style={{ fontWeight: 'bold' }}>
								{user.firstName} {user.lastName} ({user.position})
							</span>
						</h3>
					)}

					<div className="calendar-controls" style={{ marginTop: '15px' }}>
						<label style={{ marginLeft: '25px' }}>
							<input type="checkbox" checked={isConfirmed} readOnly style={{ marginRight: '5px' }} />
							{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
						</label>
					</div>

					<div className="row">
						<div className="col-xl-9">
							<FullCalendar
								plugins={[dayGridPlugin, interactionPlugin]}
								initialView="dayGridMonth"
								locale={i18n.resolvedLanguage}
								firstDay={1}
								showNonCurrentDates={false}
								events={[
									...workdays.map(day => ({
										title: day.hoursWorked
								? `${day.hoursWorked} ${t('workcalendar.allfrommonthhours')} ${day.additionalWorked ? ` ${t('workcalendar.include')} ${day.additionalWorked} ${t('workcalendar.overtime')}` : ''}`
								: day.absenceType,
										start: day.date,
										backgroundColor: day.hoursWorked ? 'blue' : 'green',
										textColor: 'white',
										id: day._id,
										classNames: day.hoursWorked ? 'event-workday' : 'event-absence',
										extendedProps: {
											isWorkday: !!day.hoursWorked,
										},
									})),
									...workdays
										.filter(day => day.realTimeDayWorked)
										.map(day => ({
											title: `${t('workcalendar.worktime')} ${day.realTimeDayWorked}`,
											start: day.date,
											backgroundColor: 'yellow',
											textColor: 'black',
											id: `${day._id}-realTime`,
											classNames: 'event-real-time',
										})),
								]}
								ref={calendarRef}
								displayEventTime={false}
								datesSet={handleMonthChange}
								height="auto"
							/>
						</div>
						<div className="col-xl-3 resume-month-work small-mt">
				<h3 className="resumecales h3resume">{t('workcalendar.allfrommonth')}</h3>
				<p>
					{t('workcalendar.allfrommonth1')} {totalWorkDays}
				</p>
				<p>
					{t('workcalendar.allfrommonth2')} {totalHours} {t('workcalendar.allfrommonthhours')}
				</p>
				<p>
					{t('workcalendar.allfrommonth3')} {additionalHours} {t('workcalendar.allfrommonthhours')}
				</p>

				<p>
					{t('workcalendar.allfrommonth4')} {totalLeaveDays} ({totalLeaveHours} {t('workcalendar.allfrommonthhours')})
				</p>
				<p>
					{t('workcalendar.allfrommonth5')} {totalOtherAbsences}
				</p>
			</div>
					</div>
				</div>
			</div>
			)}
		</>
	)
}

export default UserCalendar
