import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import CreateUser from './components/profile/CreateUser'
import Login from './components/profile/Login'
import Dashboard from './components/dashboard/Dashboard'
import ChangePassword from './components/profile/ChangePassword'
import SetPassword from './components/profile/SetPassword'
import ResetPassword from './components/profile/ResetPassword'
import ProtectedRoute from './components/route/ProtectedRoute'
import Logs from './components/profile/Logs'
import AdminUserList from './components/listusers/AdminUserList'
import UserCalendar from './components/workcalendars/UserCalendar'
import LeaveRequestForm from './components/leavework/LeaveRequestForm'
import AdminLeaveRequests from './components/leavework/AdminLeaveRequests'
import LeaveRequestPDFPreview from './components/leavework/LeaveRequestPDFPreview'
import LeavePlanner from './components/leavework/LeavePlanner'
import EmployeeListPlanner from './components/listusers/EmployeeListPlanner'
import EmployeeLeaveCalendar from './components/leavework/EmployeeLeaveCalendar'
import AdminAllLeaveCalendar from './components/leavework/AdminAllLeaveCalendar'
import VacationListUser from './components/listusers/VacationListUser'
import NewPassword from './components/profile/NewPassword'
import ProductPromotion from './components/ProductPromotion'
import BlogPost from './components/BlogPost'
import { Helmet } from 'react-helmet-async'
import { API_URL } from './config.js'
import '../src/style.css'
import { useAuth } from './context/AuthContext'
import { AuthProvider } from './context/AuthContext'

axios.defaults.withCredentials = true

function AppContent() {
	const location = useLocation()
	const { loggedIn, role, logout } = useAuth()

	useEffect(() => {
		const interceptor = axios.interceptors.response.use(
			res => res,
			async err => {
				const originalRequest = err.config
				if (
					err.response?.status === 401 &&
					originalRequest.url !== `${API_URL}/api/users/refresh-token` &&
					!originalRequest._retry
				) {
					originalRequest._retry = true
					try {
						await axios.post(`${API_URL}/api/users/refresh-token`, {}, { withCredentials: true })
						return axios(originalRequest)
					} catch (refreshError) {
						return Promise.reject(refreshError)
					}
				}
				return Promise.reject(err)
			}
		)
		return () => axios.interceptors.response.eject(interceptor)
	}, [])

	return (
		<>
			<Helmet>
				<title>Planopia | Czas pracy, urlopy i nie tylko</title>
			</Helmet>

			<div>
				<Routes>
					<Route
						path="/login"
						element={loggedIn ? <Navigate to="/" /> : <Login />}
					/>
					<Route path="/aplikacja-dla-firm" element={<ProductPromotion />} />
					<Route path="/blog/jak-usprawnic-firme" element={<BlogPost />} />
					<Route path="/set-password/:token" element={<SetPassword />} />
					<Route path="/reset-password" element={<ResetPassword />} />
					<Route path="/new-password/:token" element={<NewPassword />} />
					<Route element={<ProtectedRoute isLoggedIn={loggedIn} handleLogout={logout} />}>
						<Route path="/" element={<Dashboard />} />
						<Route path="/create-user" element={<CreateUser />} />
						<Route path="/leave-request" element={<LeaveRequestForm />} />
						<Route
							path="/calendars-list"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
								].some(r => role.includes(r)) ? (
									<AdminUserList />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/leave-list"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
								].some(r => role.includes(r)) ? (
									<VacationListUser />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/leave-requests/:userId"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
								].some(r => role.includes(r)) ? (
									<AdminLeaveRequests />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/leave-request-pdf-preview"
							element={<LeaveRequestPDFPreview />}
						/>
						<Route path="/edit-profile" element={<ChangePassword />} />
						<Route
							path="/logs"
							element={
								['Admin'].some(r => role.includes(r)) ? (
									<Logs />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/work-calendars/:userId"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
								].some(r => role.includes(r)) ? (
									<UserCalendar />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route path="/leave-planner" element={<LeavePlanner />} />
						<Route
							path="/leave-planning-list"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
								].some(r => role.includes(r)) ? (
									<EmployeeListPlanner />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/leave-plans/:userId"
							element={
								[
									'Admin',
									'Zarząd',
									'Kierownik IT',
									'Kierownik BOK',
									'Kierownik Bukmacher',
									'Kierownik Marketing',
									'Urlopy czas pracy',
									'IT',
									'Marketing',
									'BOK',
									'Bukmacher',
								].some(r => role.includes(r)) ? (
									<EmployeeLeaveCalendar />
								) : (
									<Navigate to="/" />
								)
							}
						/>
						<Route
							path="/all-leave-plans"
							element={<AdminAllLeaveCalendar />}
						/>
					</Route>
				</Routes>
			</div>
		</>
	)
}

function App() {
	return (
		<Router>
			<AuthProvider>
				<AppContent />
			</AuthProvider>
		</Router>
	)
}

export default App
