import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function Logs() {
	const [users, setUsers] = useState([])
	const [logs, setLogs] = useState({})
	const [expandedLogs, setExpandedLogs] = useState([])
	const [editingUser, setEditingUser] = useState(null)
	const [editedRoles, setEditedRoles] = useState([])
	const [error, setError] = useState('')
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	const availableRoles = [
		'Admin',
		'IT',
		'Marketing',
		'Bukmacher',
		'Bok',
		'Kierownik IT',
		'Kierownik BOK',
		'Kierownik Bukmacher',
		'Kierownik Marketing',
		'Urlopy czas pracy',
		'Zarząd',
	]

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await axios.get(`${API_URL}/api/users/all-users`)
				setUsers(response.data)
			} catch (error) {
				console.error('Error fetching users:', error)
				setError('Nie udało się pobrać listy użytkowników')
			} finally {
				setLoading(false)
			}
		}

		fetchUsers()
	}, [])

	const fetchLogs = async userId => {
		try {
			const response = await axios.get(`${API_URL}/api/users/logs/${userId}`)
			const filteredLogs = response.data.filter(log => log.action !== 'LOGOUT')
			setLogs(prevLogs => ({
				...prevLogs,
				[userId]: filteredLogs,
			}))
		} catch (error) {
			console.error('Error fetching logs:', error)
			setError('Nie udało się pobrać logów')
		} finally {
			setLoading(false)
		}
	}

	const handleExpandLogs = userId => {
		if (expandedLogs.includes(userId)) {
			setExpandedLogs(expandedLogs.filter(id => id !== userId))
		} else {
			setExpandedLogs([...expandedLogs, userId])
			if (!logs[userId]) {
				fetchLogs(userId)
			}
		}
	}

	const handleEditClick = user => {
		setEditingUser(editingUser?._id === user._id ? null : user)
		setEditedRoles(user.roles || [])
	}

	const handleRoleChange = role => {
		setEditedRoles(prevRoles => (prevRoles.includes(role) ? prevRoles.filter(r => r !== role) : [...prevRoles, role]))
	}

	const handleSaveRoles = async userId => {
		try {
			await axios.patch(
				`${API_URL}/api/users/${userId}/roles`,
				{ roles: editedRoles }
			)
			setUsers(prevUsers => prevUsers.map(user => (user._id === userId ? { ...user, roles: editedRoles } : user)))
			setEditingUser(null)
			alert(t('logs.alert'))
		} catch (error) {
			console.error('Error updating roles:', error)
			setError(t('logs.alerttwo'))
		}
	}

	// const handleDeleteUser = async userId => {
	// 	try {
	// 		await axios.delete(`${API_URL}/api/users/${userId}`)
	// 		setUsers(prevUsers => prevUsers.filter(user => user._id !== userId))
	// 		alert('Użytkownik został usunięty!')
	// 	} catch (error) {
	// 		console.error('Error deleting user:', error)
	// 		setError('Nie udało się usunąć użytkownika')
	// 	}
	// }


	return (
		<>
			<Sidebar />

			{error && <p className="text-danger">{error}</p>}

			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<table className="table table-bordered" id="userandlogs">
				<thead>
					<tr>
						<th>{t('logs.user')}</th>
						<th>{t('logs.action')}</th>
					</tr>
				</thead>
				<tbody>
					{users.map(user => (
						<React.Fragment key={user._id}>
							<tr>
								<td>
									{user.username} ({user.roles?.join(', ') || 'Brak ról'})
								</td>
								<td>
									<button
										className="btn btn-primary btn-sm me-2"
										onClick={() => handleEditClick(user)}
										style={{ margin: '3px' }}>
										{t('logs.rolebtn')}
									</button>
									<button
										className="btn btn-info btn-sm me-2"
										onClick={() => handleExpandLogs(user._id)}
										style={{ margin: '3px' }}>
										{t('logs.actionbtn')}
									</button>
									{/* <button
										className='btn btn-danger btn-sm'
										onClick={() => handleDeleteUser(user._id)}
										style={{ margin: '3px' }}>
										Usuń
									</button> */}
								</td>
							</tr>
							{editingUser?._id === user._id && (
								<tr>
									<td colSpan="2">
										<h3>{t('logs.editrole')}</h3>
										{availableRoles.map(role => (
											<label key={role} style={{ marginRight: '10px' }}>
												<input
													type="checkbox"
													checked={editedRoles.includes(role)}
													onChange={() => handleRoleChange(role)}
													style={{ margin: '3px' }}
												/>
												{role}
											</label>
										))}
										<br />
										<button
											className="btn btn-success btn-sm me-2"
											onClick={() => handleSaveRoles(user._id)}
											style={{ margin: '3px' }}>
											{t('logs.save')}
										</button>
										<button
											className="btn btn-secondary btn-sm"
											onClick={() => setEditingUser(null)}
											style={{ margin: '3px' }}>
											{t('logs.notsave')}
										</button>
									</td>
								</tr>
							)}
							{expandedLogs.includes(user._id) && logs[user._id] && (
								<tr id="logstable">
									<td colSpan="2">
										<h3>{t('logs.userl')}</h3>
										<table className="table table-bordered">
											<thead>
												<tr>
													<th>{t('logs.actionth')}</th>
													<th>{t('logs.detailsth')}</th>
													<th>{t('logs.timeth')}</th>
												</tr>
											</thead>
											<tbody>
												{logs[user._id].map(log => (
													<tr key={log._id}>
														<td data-label="Akcja">{log.action}</td>
														<td data-label="Szczegóły">{log.details}</td>
														<td data-label="Czas">{new Date(log.timestamp).toLocaleString()}</td>
													</tr>
												))}
											</tbody>
										</table>
									</td>
								</tr>
							)}
						</React.Fragment>
					))}
				</tbody>
			</table>
			)}
		</>
	)
}

export default Logs
