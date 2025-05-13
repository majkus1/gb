import React from 'react'
import { useLocation } from 'react-router-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'

function LeaveRequestPDFPreview() {
	const location = useLocation()
	const leaveRequest = location.state?.leaveRequest
	const { t, i18n } = useTranslation()

	const generatePDF = async () => {
		const element = document.getElementById('pdf-content')
		const canvas = await html2canvas(element)
		const imgData = canvas.toDataURL('image/png')
		const pdf = new jsPDF('p', 'mm', 'a4')
		pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
		pdf.save(`${t('pdf.filename2')}_${leaveRequest.userId.lastName}.pdf`)
	}

	const formatDate = date => {
		const options = { day: '2-digit', month: 'long', year: 'numeric' }
		return new Date(date).toLocaleDateString(i18n.resolvedLanguage, options)
	}

	return (
		<>
			<Sidebar />

			<div id='pdf-leave-request'>
				<div id='pdf-content' style={{ padding: '20px', paddingTop: '70px' }}>
					<h2 style={{ marginBottom: '20px' }}>{t('leavepdf.title')}</h2>
					<div className='allrequests'>
						<div className='firsttworow'>
							<div className='detailsleave'>
								<p>
									<strong>{t('leavepdf.date')}</strong> {formatDate(leaveRequest.createdAt)}
								</p>
								<p>
									<strong>{t('leavepdf.name')}</strong> {leaveRequest.userId.firstName} {leaveRequest.userId.lastName}
								</p>
								<p>
									<strong>{t('leavepdf.stano')}</strong> {leaveRequest.userId.position}
								</p>
								<p>
									<strong>{t('leavepdf.type')}</strong> {t(leaveRequest.type)}
								</p>
								<p>
									<strong>{t('leavepdf.data1')}</strong> {formatDate(leaveRequest.startDate)}
								</p>
								<p>
									<strong>{t('leavepdf.data2')}</strong> {formatDate(leaveRequest.endDate)}
								</p>
								<p>
									<strong>{t('leavepdf.days')}</strong> {leaveRequest.daysRequested}
								</p>
								<p>
									<strong>{t('leavepdf.personsub')}</strong> {leaveRequest.replacement || t('adminleavereq.none')}
								</p>
								<p>
									<strong>{t('leavepdf.comm')}</strong> {leaveRequest.additionalInfo || t('adminleavereq.none')}
								</p>
							</div>
							<div className='othertwo'>
								<div className='resumedaysleave'>
									<p>{t('leavepdf.info1')}....................</p>
									<p>{t('leavepdf.info2')}....................</p>
									<p>{t('leavepdf.info3')}....................</p>
									<p>{t('leavepdf.info4')}....................</p>
								</div>
								<div className='signature-leave' style={{ margin: '35px 0px' }}>
									<p>
										<strong>{t('leavepdf.info5')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info6')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info7')}</strong>....................
									</p>
									<p>
										<strong>{t('leavepdf.info8')}</strong>....................
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<button onClick={generatePDF} className='btn btn-primary btn-print-leavereq' style={{ marginLeft: '17px' }}>
				{t('leavepdf.info9')}
				</button>
			</div>
		</>
	)
}

export default LeaveRequestPDFPreview
