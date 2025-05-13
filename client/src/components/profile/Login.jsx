import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.min.css'
// import 'admin-lte/dist/css/adminlte.min.css'

// import 'admin-lte/plugins/jquery/jquery.min.js'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import 'admin-lte/dist/js/adminlte.min.js'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

function Login() {
	// const [username, setUsername] = useState('')
	const [usernameInput, setUsernameInput] = useState('') // 👈 lokalny input
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	// const [rememberMe, setRememberMe] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const from = location.state?.from?.pathname || '/'
	const { t, i18n } = useTranslation()
	const { setLoggedIn, setRole, setUsername } = useAuth()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleLogin = async e => {
		e.preventDefault()
		try {
			const response = await axios.post(
				`${API_URL}/api/users/login`,
				{ username: usernameInput, password },
				{
					withCredentials: true,
				}
			)
			// localStorage.setItem('roles', JSON.stringify(response.data.roles))
			// localStorage.setItem('username', response.data.username)
			setRole(response.data.roles)
			setLoggedIn(true)
			setUsername(response.data.username)
			navigate(from)
		} catch (error) {
			console.error('Login error:', error)
			setErrorMessage(t('login.failed'))

			if (error.response?.status === 429) {
				alert('Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.')
			}
		}
	}

	const handleUsernameChange = e => {
		setUsername(e.target.value.toLowerCase())
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
						<form onSubmit={handleLogin}>
							<div className="input-group mb-3">
								<input
									type="email"
									className="form-control"
									placeholder="Email"
									value={usernameInput}
									onChange={e => setUsernameInput(e.target.value.toLowerCase())}
								/>
								<div className="input-group-append">
									<div className="input-group-text">
										<span className="fas fa-envelope"></span>
									</div>
								</div>
							</div>
							<div className="input-group mb-3">
								<input
									type="password"
									className="form-control"
									placeholder={t('login.password')}
									value={password}
									onChange={e => setPassword(e.target.value)}
								/>
								<div className="input-group-append">
									<div className="input-group-text">
										<span className="fas fa-lock"></span>
									</div>
								</div>
							</div>
							<div>
								{/* <input
									type="checkbox"
									id="rememberMe"
									checked={rememberMe}
									onChange={e => setRememberMe(e.target.checked)}
								/> */}
								{/* <label
									htmlFor="rememberMe"
									style={{ marginLeft: '5px', fontWeight: 'normal', cursor: 'pointer', color: 'black' }}>
									Zapamiętaj mnie
								</label> */}
							</div>
							<div className="btnlog">
								<button type="submit" className="btn btn-success btn-block" style={{ marginBottom: '10px' }}>
									{t('login.loginto')}
								</button>
							</div>
							<Link to="/reset-password" style={{ textDecoration: 'none', color: 'black' }}>
								{t('login.forgotpass')}
							</Link>
						</form>
						{errorMessage && (
							<p className="mt-3 text-danger" style={{ textAlign: 'center' }}>
								{errorMessage}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* <Link to="/aplikacja-dla-firm" className="linkaboutapp">
				O Aplikacji
			</Link> */}
		</div>
	)
}

export default Login
