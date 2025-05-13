import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../dashboard/Sidebar'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'

function ChangePassword() {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [position, setPosition] = useState('')
	const { t, i18n } = useTranslation()
	const { role } = useAuth()
	const [loading, setLoading] = useState(true)

	const isPasswordValid = newPassword => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(newPassword)
	}

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await axios.get(`${API_URL}/api/users/profile`)
				setPosition(response.data.position || '')
			} catch (error) {
				console.error('Błąd podczas pobierania danych użytkownika:', error)
			} finally {
				setLoading(false)
			}
		}
		fetchUserData()
	}, [])

	const handleSubmit = async e => {
		e.preventDefault()
		if (newPassword !== confirmPassword) {
			alert(t('editprofile.notsamepass'))
			return
		}
		if (!isPasswordValid(newPassword)) {
			alert(t('newpass.invalidPassword'))
			return
		}
		try {
			await axios.post(`${API_URL}/api/users/change-password`, {
				currentPassword,
				newPassword,
			})
			alert(t('editprofile.successchangepass'))
		} catch (error) {
			alert(t('editprofile.failchangepass'))
			console.error(error)
		}
	}

	const handlePositionUpdate = async () => {
		try {
			await axios.put(`${API_URL}/api/users/update-position`, { position })
			alert(t('editprofile.successchangepos'))
		} catch (error) {
			alert(t('editprofile.failchangepos'))
			console.error(error)
		}
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div className="container my-5">
					<div className="row justify-content-start">
						<div className="col-md-8">
							<div>
								<div className="card-body">
									<h4>{t('editprofile.headertxt')}</h4>
									<hr />
									<form
										onSubmit={e => {
											e.preventDefault()
											handlePositionUpdate()
										}}>
										<div className="mb-3">
											<label htmlFor="position" className="form-label">
												{t('editprofile.positionlabel')}
											</label>
											<input
												type="text"
												className="form-control"
												id="position"
												value={position}
												onChange={e => setPosition(e.target.value)}
												placeholder={t('editprofile.placeholder1')}
											/>
										</div>
										<button type="submit" className="btn btn-success mb-3">
											{t('editprofile.confirmposition')}
										</button>
									</form>

									<div className="mb-3">
										<label className="form-label">{t('editprofile.rolelabel')}</label>
										<input type="text" className="form-control" value={role} readOnly />
									</div>

									<form onSubmit={handleSubmit} style={{ paddingTop: '40px' }}>
										<h4>{t('editprofile.changepassh4')}</h4>
										<hr />
										<div className="mb-3">
											<label htmlFor="currentPassword" className="form-label">
												{t('editprofile.currentpasslabel')}
											</label>
											<input
												type="password"
												className="form-control"
												id="currentPassword"
												value={currentPassword}
												onChange={e => setCurrentPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder2')}
											/>
										</div>
										<div className="mb-3">
											<label htmlFor="newPassword" className="form-label">
												{t('editprofile.newpasslabel')}
											</label>
											<input
												type="password"
												className="form-control"
												id="newPassword"
												value={newPassword}
												onChange={e => setNewPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder3')}
											/>
										</div>
										<div className="mb-3">
											<label htmlFor="confirmPassword" className="form-label">
												{t('editprofile.confirmnewpasslabel')}
											</label>
											<input
												type="password"
												className="form-control"
												id="confirmPassword"
												value={confirmPassword}
												onChange={e => setConfirmPassword(e.target.value)}
												required
												placeholder={t('editprofile.placeholder4')}
											/>
										</div>
										<button type="submit" className="btn btn-success mb-3">
											{t('editprofile.confirmnewpassbtn')}
										</button>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}

export default ChangePassword
