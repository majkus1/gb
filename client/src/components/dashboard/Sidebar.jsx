import React, { useState, useEffect } from 'react'
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'

function Sidebar() {
	const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 1500)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const location = useLocation()
	const { role, logout, username } = useAuth()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const isListOrCalendarActive =
		location.pathname === '/calendars-list' || location.pathname.startsWith('/work-calendars')

	const isListOrLeavereqActive =
		location.pathname === '/leave-list' ||
		location.pathname.startsWith('/leave-requests') ||
		location.pathname.startsWith('/leave-request-pdf-preview')

	const isLeavePlans = location.pathname === '/all-leave-plans' || location.pathname.startsWith('/leave-plans')

	useEffect(() => {
		function handleResize() {
			setIsMenuOpen(window.innerWidth > 1500)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen)
	}

	const handleLogoutClick = () => {
		logout() // ← z contextu
		navigate('/login')
	}

	const hasRole = (...requiredRoles) => {
		return Array.isArray(role) && requiredRoles.some(requiredRole => role.includes(requiredRole))
	}

	return (
		<div className="container-fluid p-0">
			<nav className="navbar navbar-expand-lg d-md-none" style={{ paddingLeft: '15px', paddingRight: '15px' }}>
				<Link to="/" className="navbar-brand">
					{/* <p className="company-txt">Planopia</p> */}
					<img src="/img/logo.png" alt="" className='gobetlogo' />
				</Link>
				<button className="navbar-toggler" type="button" onClick={toggleMenu}>
					<img src="/img/sort.png" style={{ width: '40px' }} alt="Menu" />
				</button>
			</nav>

			<div className={`sidebar bg-dark text-white ${isMenuOpen ? 'opened' : 'closed'}`} style={{ zIndex: 1050 }}>
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

				<Link to="/" className="logo-sidebar mt-2 mb-2">
					{/* <p className="company-txt">Planopia</p> */}
					<img src="/img/logo.png" alt="" className='gobetlogo' />
				</Link>

				<button onClick={toggleMenu} className="closesidebar">
					X
				</button>
				<div className="sidebar-header p-3 d-flex justify-content-between align-items-center">
					<h5>{username}</h5>
				</div>
				<div className="p-2 btns-pages">
					<NavLink
						to="/edit-profile"
						className={({ isActive }) => 'btn btn-primary btn-sm mb-2 w-100' + (isActive ? ' active' : '')}>
						{t('sidebar.btn1')}
					</NavLink>
					
					<div className="admins-links">
						{hasRole('Admin') && (
							<NavLink
								to="/create-user"
								className={({ isActive }) => 'btn btn-primary btn-sm mb-2 w-100' + (isActive ? ' active' : '')}>
								{t('sidebar.btn8')}
							</NavLink>
						)}
						{hasRole('Admin') && (
							<NavLink
								to="/logs"
								className={({ isActive }) => 'btn btn-primary btn-sm mb-2 w-100' + (isActive ? ' active' : '')}>
								{t('sidebar.btn9')}
							</NavLink>
						)}
					</div>
					<br />
					<br />
					<button
						onClick={handleLogoutClick}
						className="btn btn-danger btn-sm w-100 logout"
						style={{ maxWidth: '230px' }}>
						{t('sidebar.btn10')}
					</button>
				</div>
			</div>
		</div>
	)
}

export default Sidebar
