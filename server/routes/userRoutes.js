require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Log = require('../models/log')
const auth = require('../middleware/authMiddleware')
const Workday = require('../models/Workday')
const LeaveRequest = require('../models/LeaveRequest')
const CalendarConfirmation = require('../models/CalendarConfirmation')
const LeavePlan = require('../models/LeavePlan')
const router = express.Router()
const nodemailer = require('nodemailer')
const { appUrl } = require('../config')
const rateLimit = require('express-rate-limit')

async function findSupervisorRole(userRoles) {
	const roleToSupervisor = {
		IT: 'Kierownik IT',
		Bok: 'Kierownik BOK',
		Bukmacher: 'Kierownik Bukmacher',
		Marketing: 'Kierownik Marketing',
		'Kierownik IT': 'Zarząd',
		'Kierownik BOK': 'Zarząd',
		'Kierownik Bukmacher': 'Zarząd',
		'Kierownik Marketing': 'Zarząd',
		Zarząd: 'Zarząd',
	}

	for (let role of userRoles) {
		if (roleToSupervisor[role]) {
			return roleToSupervisor[role]
		}
	}
	return null
}

async function createLog(userId, action, details, createdBy) {
	try {
		const log = new Log({ user: userId, action, details, createdBy })
		await log.save()
		console.log(`Log created: ${action} - ${details}`)
	} catch (error) {
		console.error('Error creating log:', error)
	}
}

async function sendEmail(to, link, subject, html) {
	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})

	let info = await transporter.sendMail({
		from: '"planopia.pl" <your-email@gmail.com>',
		to: to,
		subject: subject,
		html: html,
	})

	console.log('Message sent: %s', info.messageId)
}

router.post('/register', auth, async (req, res) => {
	const { username, firstName, lastName, roles } = req.body
	const t = req.t

	if (!req.user.roles.includes('Admin')) {
		return res.status(403).send('Access denied')
	}

	try {
		const existingUser = await User.findOne({ username })
		if (existingUser) {
			return res.status(409).send('User already exists')
		}

		const newUser = new User({
			username,
			firstName,
			lastName,
			roles,
		})

		const savedUser = await newUser.save()
		const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, {
			expiresIn: '24h',
		})

		const link = `${appUrl}/set-password/${token}`
		// await sendEmail(
		// 	username,
		// 	link,
		// 	'Witaj w planopia.pl',
		// 	`<p>Login: ${username}</p><p>Hasło: Kliknij <a href="${link}">tutaj</a>, aby ustawić swoje hasło i stanowisko.</p><p>Link będzie aktywny 24 godziny.</p>`
		// )

		const subject = req.t('email.welcome.subject') // np. "Witaj w planopia.pl" lub "Welcome to planopia.pl"
		const body = `
    <p>${req.t('email.welcome.login', { username })}</p>
    <p>${req.t('email.welcome.password', { link })}</p>
    <p>${req.t('email.welcome.linkActive')}</p>
  `

		await sendEmail(username, link, subject, body)

		await createLog(savedUser._id, 'REGISTER', `Created new user with roles ${roles.join(', ')}`, req.user.userId)

		res.status(201).send('User registered successfully. Please check your email to set your password.')
	} catch (error) {
		console.error('Error creating user:', error)
		res.status(500).send('Failed to create user.')
	}
})

router.post('/set-password', async (req, res) => {
	const { password, token, position } = req.body
	if (!password || !token) {
		return res.status(400).send('Missing password or token')
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

	if (!passwordRegex.test(password)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.')
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId)

		if (!user) {
			return res.status(404).send('User not found')
		}

		user.password = await bcrypt.hash(password, 12)
		user.position = position
		await user.save()

		await createLog(user._id, 'SET_PASSWORD', 'Password and position updated successfully')

		res.send('Password and position updated successfully')
	} catch (error) {
		console.error('Error setting password and position:', error)
		res.status(500).send('Failed to set password and position')
	}
})

router.post('/new-password', async (req, res) => {
	const { password, token } = req.body
	if (!password || !token) {
		return res.status(400).send('Missing password or token')
	}

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

	if (!passwordRegex.test(password)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.')
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		const user = await User.findById(decoded.userId)

		if (!user) {
			return res.status(404).send('User not found')
		}

		user.password = await bcrypt.hash(password, 12)
		await user.save()

		await createLog(user._id, 'RESET_PASSWORD', 'Password updated successfully')

		res.send('Password updated successfully')
	} catch (error) {
		console.error('Error setting password:', error)
		res.status(500).send('Failed to set password')
	}
})

// 🔐 Rate limiter dla logowania – 5 prób co 15 minut na IP
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minut
	max: 5,
	message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
	standardHeaders: true,
	legacyHeaders: false,
})

router.post('/login', loginLimiter, async (req, res) => {
	const { username, password } = req.body
	try {
		const user = await User.findOne({ username })
		if (!user) return res.status(401).send('Nieprawidłowe dane logowania')

		const passwordIsValid = await bcrypt.compare(password, user.password)
		if (!passwordIsValid) return res.status(401).send('Nieprawidłowe hasło')

		// Generujemy access token (ważny 15 minut)
		const accessToken = jwt.sign(
			{ userId: user._id, roles: user.roles, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: '15m' }
		)

		// Generujemy refresh token (ważny 7 dni)
		const refreshToken = jwt.sign(
			{ userId: user._id, roles: user.roles, username: user.username },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		)

		// const isProduction = process.env.NODE_ENV === 'production'

		// TOKEN
		res.cookie('token', accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			// domain: '.planopia.pl',
			maxAge: 15 * 60 * 1000, // 15 minut
		})

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			// domain: '.planopia.pl',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
		})

		res.status(200).json({
			message: 'Logged in successfully',
			roles: user.roles,
			username: user.username,
		})

		await createLog(user._id, 'LOGIN', 'Login successfully')
	} catch (error) {
		console.error('Login error:', error)
		res.status(500).send('Błąd serwera podczas logowania')
	}
})

router.post('/refresh-token', (req, res) => {
	const refreshToken = req.cookies.refreshToken
	if (!refreshToken) return res.status(401).json({ message: 'Brak refresh tokena' })

	jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
		if (err) return res.status(403).json({ message: 'Nieprawidłowy refresh token' })

		// Generujemy nowy access token (ważny 15 minut)
		const newAccessToken = jwt.sign(
			{ userId: decoded.userId, roles: decoded.roles, username: decoded.username },
			process.env.JWT_SECRET,
			{ expiresIn: '15m' }
		)

		// Generujemy nowy refresh token (ważny 7 dni)
		const newRefreshToken = jwt.sign(
			{ userId: decoded.userId, roles: decoded.roles, username: decoded.username },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		)

		res.cookie('token', newAccessToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			// domain: '.planopia.pl',
			maxAge: 15 * 60 * 1000,
		})

		res.cookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'None',
			// domain: '.planopia.pl',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		})

		res.json({ message: 'Token refreshed' })
	})
})

router.get('/me', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('firstName lastName username roles')
		if (!user) return res.status(404).json({ message: 'Użytkownik nie został znaleziony' })
		return res.status(200).json({ roles: user.roles, username: user.username })
	} catch (error) {
		console.error('Błąd w /me:', error)
		return res.status(500).json({ message: 'Błąd serwera' })
	}
})

router.post('/logout', (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
		// domain: '.planopia.pl',
	})

	res.clearCookie('refreshToken', {
		httpOnly: true,
		secure: true,
		sameSite: 'None',
		// domain: '.planopia.pl',
	})

	res.status(200).json({ message: 'Wylogowano pomyślnie' })
})

router.post('/change-password', auth, async (req, res) => {
	const { currentPassword, newPassword } = req.body

	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

	if (!passwordRegex.test(newPassword)) {
		return res.status(400).send('Hasło nie spełnia wymagań bezpieczeństwa.')
	}

	try {
		const user = await User.findById(req.user.userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		const passwordIsValid = await bcrypt.compare(currentPassword, user.password)
		if (!passwordIsValid) {
			return res.status(400).send('Obecne hasło jest nieprawidłowe')
		}

		user.password = await bcrypt.hash(newPassword, 12)
		await user.save()

		await createLog(user._id, 'CHANGE_PASSWORD', 'Password changed successfully')

		res.send('Hasło zostało zmienione pomyślnie')
	} catch (error) {
		console.error('Error changing password:', error)
		res.status(500).send('Nie udało się zmienić hasła.')
	}
})

router.put('/update-position', auth, async (req, res) => {
	const { position } = req.body
	try {
		const user = await User.findById(req.user.userId)
		if (!user) return res.status(404).send('User not found')

		user.position = position
		await user.save()

		res.status(200).send('Stanowisko zostało zaktualizowane')
	} catch (error) {
		console.error('Błąd podczas aktualizacji stanowiska:', error)
		res.status(500).send('Błąd podczas aktualizacji stanowiska')
	}
})

router.get('/profile', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId)
		if (!user) {
			return res.status(404).send('User not found')
		}
		res.json({
			firstName: user.firstName,
			lastName: user.lastName,
			position: user.position,
			role: user.role,
		})
	} catch (error) {
		console.error('Error retrieving user profile:', error)
		res.status(500).send('Error retrieving user profile')
	}
})

const resetPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minut
	max: 5, // max 5 prób
	message: {
		message: 'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za 15 minut.',
	},
	standardHeaders: true,
	legacyHeaders: false,
})

router.post('/reset-password-request', resetPasswordLimiter, async (req, res) => {
	const { email } = req.body
	const t = req.t

	try {
		const user = await User.findOne({ username: email })
		if (!user) {
			return res.status(404).send('No user with that email exists.')
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: '1h',
		})
		const resetLink = `${appUrl}/new-password/${token}`

		await sendEmail(
			email,
			resetLink,
			t('resetpass.subject'),
			`<p>${t('resetpass.body', { link: resetLink })}</p><p>${t('resetpass.linkActive')}</p>`
		)

		await createLog(user._id, 'RESET_PASSWORD_REQUEST', 'Password reset link sent')

		res.send('If a user with that email is registered, a password reset link has been sent.')
	} catch (error) {
		console.error('Error sending password reset email:', error)
		res.status(500).send('Failed to send password reset link.')
	}
})

router.get('/logs', auth, async (req, res) => {
	try {
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		const logs = await Log.find().populate('user', 'username').sort({ timestamp: -1 })
		res.json(logs)
	} catch (error) {
		console.error('Error retrieving logs:', error)
		res.status(500).send('Failed to retrieve logs.')
	}
})

router.get('/leave-plans', auth, async (req, res) => {
	try {
		const leavePlans = await LeavePlan.find({ userId: req.user.userId })
		res.status(200).json(leavePlans.map(plan => plan.date))
	} catch (error) {
		console.error('Error fetching leave plans:', error)
		res.status(500).send('Failed to fetch leave plans.')
	}
})

router.post('/leave-plans', auth, async (req, res) => {
	const { date } = req.body

	if (!date) {
		return res.status(400).send('Date is required.')
	}

	try {
		const existingPlan = await LeavePlan.findOne({ userId: req.user.userId, date })
		if (existingPlan) {
			return res.status(400).send('This date is already marked as a leave day.')
		}

		const leavePlan = new LeavePlan({ userId: req.user.userId, date })
		await leavePlan.save()

		res.status(201).send('Leave day added successfully.')
	} catch (error) {
		console.error('Error adding leave day:', error)
		res.status(500).send('Failed to add leave day.')
	}
})

router.delete('/leave-plans', auth, async (req, res) => {
	const { date } = req.body

	if (!date) {
		return res.status(400).send('Date is required.')
	}

	try {
		const result = await LeavePlan.deleteOne({ userId: req.user.userId, date })

		if (result.deletedCount === 0) {
			return res.status(404).send('No such leave day found.')
		}

		res.status(200).send('Leave day removed successfully.')
	} catch (error) {
		console.error('Error removing leave day:', error)
		res.status(500).send('Failed to remove leave day.')
	}
})

router.get('/admin/leave-plans/:userId', auth, async (req, res) => {
	const { userId } = req.params

	const allowedRoles = [
		'Admin',
		'Zarząd',
		'Kierownik IT',
		'Kierownik BOK',
		'Kierownik Bukmacher',
		'Kierownik Marketing',
		'Urlopy czas pracy',
		'IT',
		'Marketing',
		'Bukmacher',
		'BOK',
	]
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const leavePlans = await LeavePlan.find({ userId }).select('date -_id')
		const dates = leavePlans.map(plan => plan.date)
		res.status(200).json(dates)
	} catch (error) {
		console.error('Error fetching leave plans:', error)
		res.status(500).send('Failed to fetch leave plans.')
	}
})

router.get('/admin/all-leave-plans', auth, async (req, res) => {
	try {
		const leavePlans = await LeavePlan.find().populate('userId', 'username firstName lastName').select('date userId')

		// Filtrujemy plany, które mają userId na null
		const formattedPlans = leavePlans
			.filter(plan => plan.userId !== null) // Pomijamy wpisy bez userId
			.map(plan => ({
				date: plan.date,
				username: plan.userId.username,
				firstName: plan.userId.firstName,
				lastName: plan.userId.lastName,
				userId: plan.userId._id,
			}))

		res.status(200).json(formattedPlans)
	} catch (error) {
		console.error('Error fetching all leave plans:', error)
		res.status(500).send('Failed to fetch all leave plans.')
	}
})

router.get('/users', auth, async (req, res) => {
	try {
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}
		const users = await User.find().select('username firstName lastName role')
		res.json(users)
	} catch (error) {
		console.error('Error retrieving users:', error)
		res.status(500).send('Failed to retrieve users.')
	}
})

router.patch('/:userId/vacation-days', auth, async (req, res) => {
	const { userId } = req.params
	const { vacationDays } = req.body

	const allowedRoles = [
		'Admin',
		'Zarząd',
		'Kierownik IT',
		'Kierownik BOK',
		'Kierownik Bukmacher',
		'Kierownik Marketing',
		'Urlopy czas pracy',
	]
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		user.vacationDays = vacationDays
		await user.save()

		res.status(200).json({ message: 'Liczba dni urlopu zaktualizowana pomyślnie', user })
	} catch (error) {
		console.error('Błąd podczas aktualizacji liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
})

router.get('/:userId/vacation-days', auth, async (req, res) => {
	const { userId } = req.params
	try {
		const user = await User.findById(userId).select('vacationDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		res.status(200).json({ vacationDays: user.vacationDays })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
})

router.get('/vacation-days', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('vacationDays')
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		res.status(200).json({ vacationDays: user.vacationDays })
	} catch (error) {
		console.error('Błąd podczas pobierania liczby dni urlopu:', error)
		res.status(500).send('Błąd serwera')
	}
})

router.patch('/leave-requests/:id/mark-processed', auth, async (req, res) => {
	try {
		const leaveRequest = await LeaveRequest.findById(req.params.id)
		if (!leaveRequest) {
			return res.status(404).send('Wniosek nie znaleziony')
		}

		leaveRequest.isProcessed = true
		await leaveRequest.save()

		res.status(200).json({ message: 'Wniosek oznaczony jako przetworzony' })
	} catch (error) {
		console.error('Błąd podczas oznaczania wniosku jako przetworzonego:', error)
		res.status(500).send('Błąd serwera')
	}
})

router.get('/logs/:userId', auth, async (req, res) => {
	try {
		const logs = await Log.find({ user: req.params.userId })
			.populate('user', 'username')
			.populate('createdBy', 'username')
			.sort({ timestamp: -1 })

		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		res.json(logs)
	} catch (error) {
		console.error('Error retrieving user logs:', error)
		res.status(500).send('Failed to retrieve user logs.')
	}
})

router.post('/workdays', auth, async (req, res) => {
	const { date, hoursWorked, additionalWorked, realTimeDayWorked, absenceType } = req.body
	try {
		const workday = new Workday({
			userId: req.user.userId,
			date,
			hoursWorked,
			additionalWorked,
			realTimeDayWorked,
			absenceType,
		})
		await workday.save()
		res.status(201).send('Workday added successfully.')
	} catch (error) {
		console.error('Error adding workday:', error)
		res.status(500).send('Failed to add workday.')
	}
})

router.get('/workdays', auth, async (req, res) => {
	try {
		const workdays = await Workday.find({ userId: req.user.userId })
		res.json(workdays)
	} catch (error) {
		console.error('Error retrieving workdays:', error)
		res.status(500).send('Failed to retrieve workdays.')
	}
})

router.delete('/workdays/:id', auth, async (req, res) => {
	try {
		const result = await Workday.deleteOne({ _id: req.params.id, userId: req.user.userId })
		if (result.deletedCount === 0) return res.status(404).send('Workday not found or unauthorized')
		res.send('Workday deleted successfully.')
	} catch (error) {
		console.error('Error deleting workday:', error)
		res.status(500).send('Failed to delete workday.')
	}
})

router.get('/all-users', auth, async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId)
		if (!currentUser) return res.status(404).send('Użytkownik nie znaleziony')

		const rolesVisibleTo = {
			'Kierownik IT': ['IT'],
			'Kierownik BOK': ['Bok'],
			'Kierownik Bukmacher': ['Bukmacher'],
			'Kierownik Marketing': ['Marketing'],
			'Urlopy czas pracy': [],
			Zarząd: [],
			Admin: [],
		}

		let filter = {}
		if (
			currentUser.roles.includes('Admin') ||
			currentUser.roles.includes('Zarząd') ||
			currentUser.roles.includes('Urlopy czas pracy')
		) {
			filter = {}
		} else {
			const visibleRoles = currentUser.roles.flatMap(role => rolesVisibleTo[role] || [])
			filter = { roles: { $in: visibleRoles } }
		}
		const users = await User.find(filter).select('username firstName lastName roles position')
		res.json(users)
	} catch (error) {
		console.error('Error fetching users:', error)
		res.status(500).send('Błąd serwera podczas pobierania listy użytkowników')
	}
})

router.get('/alluserplans', auth, async (req, res) => {
	try {
		const currentUser = await User.findById(req.user.userId)
		if (!currentUser) return res.status(404).send('Użytkownik nie znaleziony')

		const rolesVisibleTo = {
			'Kierownik IT': [''],
			'Kierownik BOK': [''],
			'Kierownik Bukmacher': [''],
			'Kierownik Marketing': [''],
			'Urlopy czas pracy': [],
			Marketing: [],
			Bukmacher: [],
			IT: [],
			BOK: [],
			Zarząd: [],
			Admin: [],
		}

		let filter = {}
		if (
			currentUser.roles.includes('Admin') ||
			currentUser.roles.includes('Zarząd') ||
			currentUser.roles.includes('IT') ||
			currentUser.roles.includes('Marketing') ||
			currentUser.roles.includes('Bukmacher') ||
			currentUser.roles.includes('BOK') ||
			currentUser.roles.includes('Kierownik Marketing') ||
			currentUser.roles.includes('Kierownik Bukmacher') ||
			currentUser.roles.includes('Kierownik BOK') ||
			currentUser.roles.includes('Kierownik IT') ||
			currentUser.roles.includes('Urlopy czas pracy')
		) {
			filter = {}
		} else {
			const visibleRoles = currentUser.roles.flatMap(role => rolesVisibleTo[role] || [])
			filter = { roles: { $in: visibleRoles } }
		}
		const users = await User.find(filter).select('username firstName lastName roles position')
		res.json(users)
	} catch (error) {
		console.error('Error fetching users:', error)
		res.status(500).send('Błąd serwera podczas pobierania listy użytkowników')
	}
})

router.get('/workdays/confirmation-status/:userId?', auth, async (req, res) => {
	const { month, year } = req.query
	const userId = req.params.userId || req.user.userId
	try {
		const confirmation = await CalendarConfirmation.findOne({ userId, month, year })
		res.status(200).json({ isConfirmed: confirmation ? confirmation.isConfirmed : false })
	} catch (error) {
		console.error('Error checking calendar confirmation status:', error)
		res.status(500).send('Failed to check calendar confirmation status.')
	}
})

router.get('/workdays/:userId', auth, async (req, res) => {
	try {
		const { userId } = req.params

		const allowedRoles = [
			'Admin',
			'Zarząd',
			'Kierownik IT',
			'Kierownik BOK',
			'Kierownik Bukmacher',
			'Kierownik Marketing',
			'Urlopy czas pracy',
		]
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		const workdays = await Workday.find({ userId })
		res.json(workdays)
	} catch (error) {
		console.error('Error fetching workdays for user:', error)
		res.status(500).send('Failed to fetch workdays.')
	}
})

router.get('/user-leave-requests', auth, async (req, res) => {
	try {
		const leaveRequests = await LeaveRequest.find({ userId: req.user.userId }).populate(
			'updatedBy',
			'firstName lastName'
		) // Dodaj populate dla updatedBy
		res.status(200).json(leaveRequests)
	} catch (error) {
		console.error('Błąd podczas pobierania zgłoszeń:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania zgłoszeń' })
	}
})

router.get('/:userId', auth, async (req, res) => {
	try {
		const { userId } = req.params

		const allowedRoles = [
			'Admin',
			'Zarząd',
			'Kierownik IT',
			'Kierownik BOK',
			'Kierownik Bukmacher',
			'Kierownik Marketing',
			'Urlopy czas pracy',
			'IT',
			'Marketing',
			'Bukmacher',
			'BOK',
		]
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		const user = await User.findById(userId).select('firstName lastName username roles position')
		if (!user) {
			return res.status(404).send('User not found')
		}

		res.json(user)
	} catch (error) {
		console.error('Error fetching user details:', error)
		res.status(500).send('Failed to fetch user details.')
	}
})

// router.post("/leave-request", auth, async (req, res) => {
//   const { type, startDate, endDate, daysRequested, replacement, additionalInfo } = req.body;
//   const userId = req.user.userId;

//   try {
//     const leaveRequest = new LeaveRequest({
//       userId,
//       type,
//       startDate,
//       endDate,
//       daysRequested,
//       replacement,
//       additionalInfo
//     });
//     await leaveRequest.save();
//     res.status(201).json({ message: "Wniosek został wysłany", leaveRequest });
//   } catch (error) {
//     console.error("Błąd podczas zgłaszania nieobecności:", error);
//     res.status(500).json({ message: "Błąd podczas zgłaszania nieobecności" });
//   }
// });

router.post('/leave-request', auth, async (req, res) => {
	const { type, startDate, endDate, daysRequested, replacement, additionalInfo } = req.body
	const userId = req.user.userId
	const t = req.t

	try {
		// Zapisz wniosek
		const leaveRequest = new LeaveRequest({
			userId,
			type,
			startDate,
			endDate,
			daysRequested,
			replacement,
			additionalInfo,
		})
		await leaveRequest.save()

		// Pobierz dane zgłaszającego
		const user = await User.findById(userId).select('firstName lastName roles')
		if (!user) return res.status(404).send('Użytkownik nie znaleziony.')

		// Znajdź rolę przełożonego
		const supervisorRole = await findSupervisorRole(user.roles)

		// Znajdź użytkowników z rolą przełożonego
		const supervisors = await User.find({ roles: supervisorRole }).select('username firstName lastName')

		const emailPromises = supervisors.map(supervisor =>
			sendEmail(
				supervisor.username,
				`${appUrl}/leave-requests/${userId}`,
				t('email.leaveform.title'),
				`<h3>${t('email.leaveform.title')}</h3>
			   <p><b>${t('email.leaveform.employee')}:</b> ${user.firstName} ${user.lastName}</p>
			   <p><b>${t('email.leaveform.type')}:</b> ${t(type)}</p>
			   <p><b>${t('email.leaveform.dates')}:</b> ${startDate} - ${endDate}</p>
			   <p><b>${t('email.leaveform.days')}:</b> ${daysRequested}</p>
			   <p><a href="${appUrl}/leave-requests/${userId}">${t('email.leaveform.goToRequest')}</a></p>`
			)
		)

		await Promise.all(emailPromises)

		res.status(201).json({ message: 'Wniosek został wysłany i powiadomienie zostało dostarczone.', leaveRequest })
	} catch (error) {
		console.error('Błąd podczas zgłaszania nieobecności:', error)
		res.status(500).json({ message: 'Błąd podczas zgłaszania nieobecności' })
	}
})

router.post('/workdays/confirm', auth, async (req, res) => {
	const { month, year, isConfirmed } = req.body
	const userId = req.user.userId

	try {
		let confirmation = await CalendarConfirmation.findOne({ userId, month, year })

		if (confirmation) {
			confirmation.isConfirmed = isConfirmed
		} else {
			confirmation = new CalendarConfirmation({ userId, month, year, isConfirmed })
		}

		await confirmation.save()
		res.status(200).json({ message: 'Calendar confirmation status updated successfully.' })
	} catch (error) {
		console.error('Error updating calendar confirmation status:', error)
		res.status(500).send('Failed to update calendar confirmation status.')
	}
})

router.get('/leave-requests/:userId', auth, async (req, res) => {
	const { userId } = req.params

	const allowedRoles = [
		'Admin',
		'Zarząd',
		'Kierownik IT',
		'Kierownik BOK',
		'Kierownik Bukmacher',
		'Kierownik Marketing',
		'Urlopy czas pracy',
	]
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const leaveRequests = await LeaveRequest.find({ userId })
			.populate('userId', 'username firstName lastName position')
			.populate('updatedBy', 'firstName lastName') // Dodaj populate dla updatedBy
		res.status(200).json(leaveRequests)
	} catch (error) {
		console.error('Error fetching leave requests:', error)
		res.status(500).send('Failed to fetch leave requests.')
	}
})

// router.patch('/leave-requests/:id', auth, async (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   const allowedRoles = ['Admin', 'Zarząd', 'Kierownik IT', 'Kierownik BOK', 'Kierownik Bukmacher', 'Kierownik Marketing', 'Urlopy czas pracy'];
//   if (!allowedRoles.some(role => req.user.roles.includes(role))) {
//     return res.status(403).send('Access denied');
//   }

//   try {
//     const leaveRequest = await LeaveRequest.findById(id);
//     if (!leaveRequest) {
//       return res.status(404).send("Leave request not found.");
//     }

//     leaveRequest.status = status;
//     await leaveRequest.save();

//     res.status(200).json({ message: "Status updated successfully.", leaveRequest });
//   } catch (error) {
//     console.error("Error updating leave request status:", error);
//     res.status(500).send("Failed to update leave request status.");
//   }
// });

router.patch('/leave-requests/:id', auth, async (req, res) => {
	const { id } = req.params
	const { status } = req.body
	const { t } = req

	const allowedRoles = [
		'Admin',
		'Zarząd',
		'Kierownik IT',
		'Kierownik BOK',
		'Kierownik Bukmacher',
		'Kierownik Marketing',
		'Urlopy czas pracy',
	]
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const leaveRequest = await LeaveRequest.findById(id)
		if (!leaveRequest) {
			return res.status(404).send('Leave request not found.')
		}

		const user = await User.findById(leaveRequest.userId).select('firstName lastName username')
		const updatedByUser = await User.findById(req.user.userId).select('firstName lastName')

		// Zapisanie zmiany statusu i osoby, która go zmieniła
		leaveRequest.status = status
		leaveRequest.updatedBy = req.user.userId
		await leaveRequest.save()

		const updatedByInfo = `<p><b>${t('email.leaveRequest.updatedBy')}:</b> ${updatedByUser.firstName} ${
			updatedByUser.lastName
		}</p>`

		// Przekazujemy t oraz updatedByInfo do funkcji sendEmailToLeaveTeam
		await sendEmailToLeaveTeam(leaveRequest, user, updatedByUser, t, updatedByInfo)

		// Treść maila
		// const appUrl = process.env.NODE_ENV === 'production' ? 'https://planopia.pl' : 'http://localhost:3001'
		const mailContent = `
		  <p><b>${t('email.leaveRequest.employee')}:</b> ${user.firstName} ${user.lastName}</p>
		  <p><b>${t('email.leaveRequest.type')}:</b> ${t(leaveRequest.type)}</p>
		  <p><b>${t('email.leaveRequest.dates')}:</b> ${leaveRequest.startDate.toISOString().split('T')[0]} - ${
			leaveRequest.endDate.toISOString().split('T')[0]
		}</p>
		  <p><b>${t('email.leaveRequest.days')}:</b> ${leaveRequest.daysRequested}</p>
		  ${updatedByInfo}
		  <p><a href="${appUrl}/leave-requests/${user._id}">${t('email.leaveRequest.goToRequest')}</a></p>
		`

		// Wysłanie maila do pracownika
		await sendEmail(
			user.username,
			null,
			`${t('email.leaveRequest.titlemail')} ${t(leaveRequest.type)} ${t(status)}`,
			mailContent
		)

		// Wysłanie maila do zespołu Urlopy Czas Pracy
		if (status === 'status.accepted') {
			await sendEmailToLeaveTeam(leaveRequest, user, updatedByUser, t, updatedByInfo)
		}

		res.status(200).json({ message: 'Status updated successfully.', leaveRequest })
	} catch (error) {
		console.error('Error updating leave request status:', error)
		res.status(500).send('Failed to update leave request status.')
	}
})

const sendEmailToLeaveTeam = async (leaveRequest, user, updatedByUser, t, updatedByInfo) => {
	try {
		const leaveTeamUsers = await User.find({ roles: 'Urlopy czas pracy' })
		// const appUrl = process.env.NODE_ENV === 'production' ? 'https://planopia.pl' : 'http://localhost:3001'
		const mailContent = `
		  <p><b>${t('email.leaveRequest.employee')}:</b> ${user.firstName} ${user.lastName}</p>
		  <p><b>${t('email.leaveRequest.type')}:</b> ${t(leaveRequest.type)}</p>
		  <p><b>${t('email.leaveRequest.dates')}:</b> ${leaveRequest.startDate.toISOString().split('T')[0]} - ${
			leaveRequest.endDate.toISOString().split('T')[0]
		}</p>
		  <p><b>${t('email.leaveRequest.days')}:</b> ${leaveRequest.daysRequested}</p>
		  ${updatedByInfo}
		  <p><a href="${appUrl}/leave-requests/${user._id}">${t('email.leaveRequest.goToRequest')}</a></p>
		`

		for (const teamUser of leaveTeamUsers) {
			await sendEmail(teamUser.username, null, `${t('email.leaveRequest.titlemailsecond')}`, mailContent)
		}

		console.log('Email sent to leave team successfully')
	} catch (error) {
		console.error('Błąd podczas wysyłania maila do zespołu Urlopy Czas Pracy:', error)
	}
}

router.patch('/:userId/roles', auth, async (req, res) => {
	const { userId } = req.params
	const { roles } = req.body

	const allowedRoles = ['Admin'] // Tylko Admin może zmieniać role
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		user.roles = roles
		await user.save()

		await createLog(req.user.userId, 'UPDATE_ROLES', `Updated roles for user ${user.username}`, req.user.userId)

		res.status(200).json({ message: 'Role użytkownika zostały zaktualizowane', user })
	} catch (error) {
		console.error('Błąd podczas aktualizacji ról użytkownika:', error)
		res.status(500).send('Nie udało się zaktualizować ról użytkownika')
	}
})

router.delete('/:userId', auth, async (req, res) => {
	const { userId } = req.params

	const allowedRoles = ['Admin'] // Tylko Admin może usuwać użytkowników
	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
		return res.status(403).send('Access denied')
	}

	try {
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		await User.deleteOne({ _id: userId })

		await createLog(req.user.userId, 'DELETE_USER', `Deleted user ${user.username}`, req.user.userId)

		res.status(200).json({ message: 'Użytkownik został usunięty pomyślnie' })
	} catch (error) {
		console.error('Błąd podczas usuwania użytkownika:', error)
		res.status(500).send('Nie udało się usunąć użytkownika')
	}
})

module.exports = router
