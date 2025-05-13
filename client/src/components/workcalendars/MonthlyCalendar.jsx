import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'
import Modal from 'react-modal'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

Modal.setAppElement('#root')

function MonthlyCalendar() {
	const [workdays, setWorkdays] = useState([])
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState(null)
	const [hoursWorked, setHoursWorked] = useState('')
	const [additionalWorked, setAdditionalWorked] = useState('')
	const [absenceType, setAbsenceType] = useState('')
	const [totalHours, setTotalHours] = useState(0)
	const [additionalHours, setAdditionalHours] = useState(0)
	const [totalLeaveDays, setTotalLeaveDays] = useState(0)
	const [totalLeaveHours, setTotalLeaveHours] = useState(0)
	const [totalWorkDays, setTotalWorkDays] = useState(0)
	const [totalOtherAbsences, setTotalOtherAbsences] = useState(0)
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [isConfirmed, setIsConfirmed] = useState(false)
	const [realTimeDayWorked, setRealTimeDayWorked] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	const fetchWorkdays = async cancelToken => {
		try {
			const response = await axios.get(`${API_URL}/api/users/workdays`, {
				cancelToken,
			})
			setWorkdays(response.data)
		} catch (error) {
			if (axios.isCancel(error)) {
				// console.log('Fetch workdays canceled:', error.message);
			} else {
				console.error('Failed to fetch workdays:', error)
			}
		} finally {
			setLoading(false)
		}
	}

	const checkConfirmationStatus = async cancelToken => {
		try {
			const response = await axios.get(`${API_URL}/api/users/workdays/confirmation-status`, {
				params: {
					month: currentMonth,
					year: currentYear,
				},
				cancelToken,
			})
			setIsConfirmed(response.data.isConfirmed || false)
		} catch (error) {
			if (axios.isCancel(error)) {
				// console.log('Check confirmation status canceled:', error.message);
			} else {
				console.error('Failed to check confirmation status:', error)
			}
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const source = axios.CancelToken.source()
		fetchWorkdays(source.token)
		checkConfirmationStatus(source.token)
		return () => {
			source.cancel('Operation cancelled: component unmounted or dependencies changed.')
		}
	}, [currentMonth, currentYear])

	useEffect(() => {
		calculateTotals(workdays, currentMonth, currentYear)
	}, [workdays, currentMonth, currentYear])

	const toggleConfirmationStatus = async () => {
		try {
			await axios.post(
				`${API_URL}/api/users/workdays/confirm`,
				{
					month: currentMonth,
					year: currentYear,
					isConfirmed: !isConfirmed,
				}
			)
			setIsConfirmed(!isConfirmed)
		} catch (error) {
			console.error('Failed to toggle confirmation status:', error)
		}
	}

	const calculateTotals = (workdays, month, year) => {
		let hours = 0
		let leaveDays = 0
		let workDaysSet = new Set()
		let otherAbsences = 0
		let overtime = 0

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
				if (day.absenceType.toLowerCase().includes('urlop') || 'vacation') {
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

	const handleDateClick = info => {
		const eventsOnDate = workdays.filter(
			day => new Date(day.date).toDateString() === new Date(info.dateStr).toDateString()
		)

		if (eventsOnDate.length >= 1) {
			alert(t('workcalendar.oneactionforday'))
			return
		}

		setSelectedDate(info.dateStr)
		setModalIsOpen(true)
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		calculateTotals(workdays, newMonth, newYear)
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

	const handleSubmit = async e => {
		e.preventDefault()

		if (hoursWorked && absenceType) {
			setErrorMessage(t('workcalendar.formalerttwo'))
			return
		}

		if (!hoursWorked && !absenceType) {
			setErrorMessage(t('workcalendar.formalertone'))
			return
		}

		if (absenceType) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		if (hoursWorked && !additionalWorked && !realTimeDayWorked) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		const data = {
			date: selectedDate,
			hoursWorked: hoursWorked ? parseInt(hoursWorked) : null,
			additionalWorked: hoursWorked ? (additionalWorked ? parseInt(additionalWorked) : null) : null,
			realTimeDayWorked: hoursWorked ? realTimeDayWorked || null : null,
			absenceType: absenceType || null,
		}

		// console.log('Data to be submitted:', data)

		try {
			await axios.post(`${API_URL}/api/users/workdays`, data)
			setModalIsOpen(false)
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setAbsenceType('')
			setErrorMessage('')
			fetchWorkdays()
		} catch (error) {
			console.error('Failed to add workday:', error)
		}
	}

	const handleDelete = async id => {
		try {
			await axios.delete(`${API_URL}/api/users/workdays/${id}`)
			fetchWorkdays()
		} catch (error) {
			console.error('Failed to delete workday:', error)
		}
	}

	const renderEventContent = eventInfo => {
		return (
			<div className={`event-content ${eventInfo.event.extendedProps.isWorkday ? 'event-workday' : 'event-absence'}`}>
				<span>{eventInfo.event.title}</span>
				<span className="event-delete" onClick={() => handleDelete(eventInfo.event.id)}>
					×
				</span>
			</div>
		)
	}

	const resetFormFields = () => {
		setHoursWorked('')
		setAdditionalWorked('')
		setRealTimeDayWorked('')
		setAbsenceType('')
		setErrorMessage('')
	}

	if (loading) return <Loader />

	return (
		<div className="row calendar-my-work">
			<div className="col-xl-9">
				<h3>{t('workcalendar.h3')}</h3>
				<hr />
				

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

				<FullCalendar
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					// locale="pl"
					locale={i18n.resolvedLanguage}
					firstDay={1}
					showNonCurrentDates={false}
					events={[
						...workdays.map(day => ({
							title: day.hoursWorked
								? `${day.hoursWorked} ${t('workcalendar.allfrommonthhours')} ${
										day.additionalWorked
											? ` ${t('workcalendar.include')} ${day.additionalWorked} ${t('workcalendar.overtime')}`
											: ''
								  }`
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
					dateClick={handleDateClick}
					eventContent={renderEventContent}
					displayEventTime={false}
					datesSet={handleMonthChange}
					height="auto"
				/>
			</div>
			<div className="col-xl-3 resume-month-work">
			<h3 className="h3resume" style={{ marginBottom: '0px', textDecoration: "underline" }}>{t('workcalendar.confirmmonth')}</h3>
				<label style={{ marginLeft: '10px', marginTop: '15px', marginBottom: '35px' }}>
					<img src="/img/arrow-right.png" alt="" style={{ width: '40px', marginRight: '10px', marginTop: '-10px' }} />
					<input
						type="checkbox"
						checked={isConfirmed}
						onChange={() => {
							toggleConfirmationStatus()
							alert(isConfirmed ? t('workcalendar.cancelconfirm') : t('workcalendar.successconfirm'))
						}}
						style={{ marginRight: '10px', transform: 'scale(2)', cursor: 'pointer' }}
					/>
					{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
				</label>

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
			

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => {
					setModalIsOpen(false)
					resetFormFields()
				}}
				style={{
					overlay: {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '290px',
						width: '90%',
						borderRadius: '10px',
						padding: '40px',
					},
				}}
				contentLabel="Dodaj godziny pracy lub nieobecność">
				<h2 style={{ marginBottom: '0px', marginLeft: '5px' }}>{t('workcalendar.h2modal')}</h2>
				<form onSubmit={handleSubmit} style={{ marginTop: '10px' }} className="formaaddinghours">
					<label>
						<input
							type="number"
							min="1"
							placeholder={t('workcalendar.placeholder1')}
							max="24"
							value={hoursWorked}
							onChange={e => setHoursWorked(e.target.value)}
							style={{ minWidth: '180px', marginBottom: '20px', marginLeft: '5px' }}
						/>{' '}
						<br></br>
						<input
							type="number"
							min="0"
							placeholder={t('workcalendar.placeholder2')}
							value={additionalWorked}
							onChange={e => setAdditionalWorked(e.target.value)}
							style={{ minWidth: '180px', marginLeft: '5px', marginBottom: '35px' }}
						/>
						<br></br>
						<input
							type="text"
							placeholder={t('workcalendar.placeholder3')}
							value={realTimeDayWorked}
							onChange={e => setRealTimeDayWorked(e.target.value)}
							style={{ minWidth: '180px', marginBottom: '20px', marginLeft: '5px' }}
						/>
					</label>
					<br />
					<label>
						<h2 style={{ marginLeft: '5px' }}>{t('workcalendar.h2modalabsence')}</h2>
						<input
							type="text"
							placeholder={t('workcalendar.placeholder4')}
							value={absenceType}
							onChange={e => setAbsenceType(e.target.value)}
							style={{ maxWidth: '260px', marginBottom: '20px', marginLeft: '5px' }}
						/>
					</label>
					<br />
					{errorMessage && <div style={{ color: 'red', marginBottom: '20px', maxWidth: '350px' }}>{errorMessage}</div>}
					<button type="submit" className="btn btn-success" style={{ marginRight: '10px' }}>
						Zapisz
					</button>
					<button
						type="button"
						onClick={() => {
							setModalIsOpen(false)
							resetFormFields()
						}}
						className="btn btn-danger">
						Anuluj
					</button>
				</form>
			</Modal>
		</div>
	)
}

export default MonthlyCalendar
