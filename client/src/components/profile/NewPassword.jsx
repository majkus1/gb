import React, { useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'

function NewPassword() {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const { token } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()

	const isPasswordValid = password => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(password)
	}

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
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
				`${API_URL}/api/users/new-password`,
				{
					password,
					token,
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
				<div className="card boxlog">
					<div className="card-body login-card-body padr">
						<div className="set-pass">
							<h2 style={{ marginBottom: '20px' }}>{t('newpass.h2')}</h2>
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
								<button type="submit" className="btn btn-success" style={{ width: '100%', marginBottom: '15px', marginTop: '15px' }}>
									{t('newpass.btnsuccess')}
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default NewPassword
