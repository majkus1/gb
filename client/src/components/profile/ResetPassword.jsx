import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'

function ResetPassword() {
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleSubmit = async e => {
		e.preventDefault()
		try {
			const response = await axios.post(`${API_URL}/api/users/reset-password-request`, { email })
			alert(t('resetpass.messok'))
			setTimeout(() => {
				navigate('/login')
			}, 5000)
		} catch (error) {
			alert(t('resetpass.messfail'))
			if (error.response?.status === 429) {
				alert(t('resetpass.toomany'))
			}
		}
	}

	const handleEmailChange = e => {
		setEmail(e.target.value.toLowerCase())
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
					<div className="reset-password-container">
						<h2 style={{ marginBottom: '20px', marginTop: '20px' }}>{t('resetpass.txt1')}</h2>
						<form onSubmit={handleSubmit} style={{ width: '100%' }}>
							<div className="form-group">
								<input
									type="email"
									className="form-control"
									id="email"
									value={email}
									placeholder="Email"
									onChange={handleEmailChange}
									required
								/>
							</div>
							<button type="submit" className="btn btn-success" style={{ marginBottom: '30px', width: '100%' }}>
								{t('resetpass.txt3')}
							</button>
							{message && <p style={{ maxWidth: '300px' }}>{message}</p>}
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ResetPassword
