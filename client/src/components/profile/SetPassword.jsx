import React, { useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'

function SetPassword() {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [position, setPosition] = useState('')
	const { token } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const isPasswordValid = password => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(password)
	}

	const handleSubmit = async e => {
		e.preventDefault()
		if (password !== confirmPassword) {
			alert(t('newpass.messone'))
			return
		}
		if (!isPasswordValid(password)) {
			alert(t('newpass.invalidPassword'))
			return
		}
		try {
			const response = await axios.post(
				`${API_URL}/api/users/set-password`,
				{
					password,
					token,
					position,
				}
			)
			alert(t('newpass.messtwo'))
			navigate('/')
		} catch (error) {
			alert(t('newpass.messthree'))
		}
	}

	return (
		<div className="alllogin">
			<div className="language-box">
				{Object.keys(lngs).map(lng => (
					<button
						key={lng}
						type="button"
						style={{
							fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal',
							marginRight: '5px',
						}}
						className="flag-language"
						onClick={() => i18n.changeLanguage(lng)}>
						<img
							src={lngs[lng].flag}
							alt={`${lngs[lng].nativeName} flag`}
							style={{ width: '23px', marginRight: '5px' }}
						/>
						{lngs[lng].nativeName}
					</button>
				))}
			</div>
			<div className="login-box">
				<div className="login-logo">
					<div style={{ backgroundColor: '#213555' }}>
						{/* <p className="company-txt">Planopia</p> */}
						<img src="/img/logo.png" alt="" />
					</div>
				</div>
				<div className="card">
					<div className="set-pass">
						<h2 style={{ marginTop: '20px', marginBottom: '20px' }}>{t('newpass.h2n')}</h2>
						<form onSubmit={handleSubmit} style={{ width: '100%' }}>
							<div className="mb-3">
								<input
									type="password"
									className="form-control"
									id="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									required
									placeholder={t('newpass.newpassone')}
								/>
							</div>
							<div className="mb-3">
								<input
									type="password"
									className="form-control"
									id="confirmPassword"
									value={confirmPassword}
									onChange={e => setConfirmPassword(e.target.value)}
									required
									placeholder={t('newpass.newpassrepeat')}
								/>
							</div>
							<small style={{ color: 'gray' }}>
								{t('newpass.requirements')}{' '}
								{/* np. "Hasło musi mieć min. 8 znaków, dużą, małą literę, cyfrę i znak specjalny" */}
							</small>
							<div className="mb-3" style={{ marginTop: '15px' }}>
								<input
									type="text"
									className="form-control"
									id="position"
									value={position}
									onChange={e => setPosition(e.target.value)}
									required
									placeholder={t('newpass.position')}
								/>
							</div>
							

							<button type="submit" className="btn btn-success" style={{ marginBottom: '30px', width: '100%' }}>
								{t('newpass.btnsuccess')}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default SetPassword
