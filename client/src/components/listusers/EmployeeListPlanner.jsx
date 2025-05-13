import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import Loader from '../Loader'

function AdminUserList() {
	const [users, setUsers] = useState([])
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchUsers()
	}, [])

	const fetchUsers = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/users/all-users`)
			setUsers(response.data)
		} catch (error) {
			console.error('Failed to fetch users:', error)
			setError('Nie udało się pobrać listy użytkowników. Spróbuj zalogować się ponownie.')
		} finally {
			setLoading(false)
		}
	}

	const handleUserClick = userId => {
		navigate(`/leave-plans/${userId}`)
	}

	return (
		<div>
			<h2>Lista Pracowników</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<ul>
				{users.map(user => (
					<li key={user._id} onClick={() => handleUserClick(user._id)}>
						{user.username} - {user.roles.join(', ')} - {user.position || 'Brak stanowiska'}
					</li>
				))}
			</ul>
		</div>
	)
}

export default AdminUserList
