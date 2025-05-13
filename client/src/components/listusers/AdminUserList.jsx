import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function AdminUserList() {
	const [users, setUsers] = useState([])
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(true)
	const navigate = useNavigate()
	const { t } = useTranslation()

	useEffect(() => {
		fetchUsers()
	}, [])

	const fetchUsers = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/all-users`, {
				withCredentials: true,
			})
			setUsers(response.data)
		} catch (error) {
			console.error('Failed to fetch users:', error)
			setError(t('list.error'))
		} finally {
			setLoading(false)
		}
	}

	const handleUserClick = userId => {
		navigate(`/work-calendars/${userId}`)
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div id="list-employee">
					<h3>{t('evidencework.h3')}</h3>
					<hr />
					{error && <p style={{ color: 'red' }}>{error}</p>}
					<p>{t('planslist.emplo')}</p>
					<ul>
						{users.map(user => (
							<li key={user._id} onClick={() => handleUserClick(user._id)} style={{ cursor: 'pointer' }}>
								{user.firstName} {user.lastName} – {user.roles.join(', ')} – {user.position || 'Brak stanowiska'}
							</li>
						))}
					</ul>
				</div>
			)}
		</>
	)
}

export default AdminUserList
