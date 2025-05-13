import React, { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'

function ProductPromotion() {
	const [expandedSections, setExpandedSections] = useState({}) // Obiekt dla stanu każdej sekcji

	const toggleContent = section => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section], // Przełączenie stanu dla konkretnej sekcji
		}))
	}

	const [menuOpen, setMenuOpen] = useState(false)
	const menuRef = useRef(null)
	const linksRef = useRef([])

	const toggleMenu = () => {
		setMenuOpen(prev => !prev)
	}

	useEffect(() => {
		if (menuOpen) {
			gsap.fromTo(
				linksRef.current,
				{ x: 50, opacity: 0 },
				{
					x: 0,
					opacity: 1,
					stagger: 0.1,
					duration: 2,
					ease: 'power3.out',
				}
			)
		}
	}, [menuOpen])

	return (
		<>
			<Helmet>
				<title>Planopia – Aplikacja do ewidencji czasu pracy i zarządzania urlopami</title>
				<meta
					name="description"
					content="Planopia to nowoczesna aplikacja do ewidencji czasu pracy i zarządzania urlopami. Ułatwia planowanie urlopów, zarządzanie pracownikami i kontrolę nad czasem pracy."
				/>
				<meta
					name="keywords"
					content="aplikacja do ewidencji czasu pracy, zarządzanie urlopami, oprogramowanie dla firm"
				/>
				<meta name="author" content="Michał Lipka" />
			</Helmet>
			<div className="product-promotion">
				<div className="pp-top">
					<p className="pp-header">Planopia</p>
					<div className="hamburger" onClick={toggleMenu}>
						<div className="bar" />
						<div className="bar" />
						<div className="bar" />
					</div>

					<div className={`sidebar-menu ${menuOpen ? 'open' : ''}`} ref={menuRef}>
						<button className="close-btn" onClick={toggleMenu}>
							&times;
						</button>
						<nav>
							<ul>
								{['/', '/login', '/cennik', '/kontakt'].map((path, index) => (
									<li key={path} ref={el => (linksRef.current[index] = el)}>
										<Link to={path} onClick={toggleMenu}>
											{path === '/' ? 'Strona główna' : path.replace('/', '').charAt(0).toUpperCase() + path.slice(2)}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</div>

					<div className={`overlay ${menuOpen ? 'show' : ''}`} onClick={toggleMenu}></div>
				</div>

				<div className="pp-text-welcome-img">
					<img src="/img/iStock-1465188429.jpg" alt="biznesmen zaznaczający aplikację" className="pp-img-header" />
					<div className="pp-text-welcome">
						<h1>
							Aplikacja internetowa do ewidencji czasu pracy, zarządzania urlopami i wszystkiego, czego potrzebujesz.
						</h1>
						<Link>Cena</Link>
						<Link>Testuj</Link>
					</div>
				</div>

				<section className="aboutapp">
					<h2 onClick={() => toggleContent('aboutapp')} className={expandedSections['aboutapp'] ? 'expanded' : ''}>
						<img src="/img/right-arrow.png" style={{ width: '15px' }} alt="arrow" />O aplikacji
					</h2>
					<div className={`context ${expandedSections['aboutapp'] ? 'expanded' : ''}`}>
						<p>
							Planopia to nowoczesna aplikacja internetowa do ewidencji czasu pracy i zarządzania urlopami,
							zaprojektowana dla firm, które chcą usprawnić zarządzanie pracownikami. Dzięki naszej aplikacji każda
							firma zyska:
						</p>
						<ul>
							<li>
								<span style={{ fontWeight: 'bold' }}>Pełną kontrolę nad czasem pracy</span> – precyzyjne
								ewidencjonowanie godzin pracy.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Automatyzację wniosków urlopowych</span> – szybkie zgłaszanie i
								akceptowanie wniosków o urlop, dni wolne i nieobecności.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Centralizację procesów firmowych</span> – stworzenie miejsca, gdzie
								wszystko, co związane z Twoją firmą, będzie dostępne w jednym miejscu.
							</li>
						</ul>
						<p>
							Naszym celem jest dostarczenie narzędzia, które nie tylko ułatwi codzienne zarządzanie, ale pozwoli na
							pełną integrację wszystkich procesów związanych z pracą w Twojej firmie. Dodatkowo Planopia została
							stworzona z wykorzystaniem nowoczesnych technologii takich jak React, Node.js oraz MongoDB, co gwarantuje
							wysoką wydajność, skalowalność i niezawodność działania aplikacji. Zaufaj sprawdzonym rozwiązaniom
							technologicznym i ułatw zarządzanie firmą już dziś!
						</p>
					</div>
				</section>

				<section className="aboutapp functionsapp">
					<h2
						onClick={() => toggleContent('functionsapp')}
						className={expandedSections['functionsapp'] ? 'expanded' : ''}>
						<img src="/img/right-arrow.png" style={{ width: '15px' }} alt="arrow" />
						Kluczowe funkcje aplikacji
					</h2>
					<div className={`context ${expandedSections['functionsapp'] ? 'expanded' : ''}`}>
						<p>Nasza aplikacja oferuje szereg funkcji, które usprawnią zarządzanie pracą w Twojej firmie:</p>
						<p className="functhead">Ewidencja czasu pracy</p>
						<ul>
							<li>Proste i intuicyjne dodawanie przepracowanych godzin.</li>
						</ul>

						<p className="functhead">Zarządzanie urlopami i nieobecnościami</p>
						<ul>
							<li>Składanie wniosków urlopowych w kilku kliknięciach.</li>
							<li>Powiadomienia o akceptacji lub odrzuceniu wniosków.</li>
						</ul>

						<p className="functhead">Planowanie urlopów</p>
						<ul>
							<li>Tworzenie planów urlopowych na cały rok.</li>
							<li>Wygodne narzędzia do planowania urlopów przez pracowników i ich przełożonych.</li>
						</ul>

						<p className="functhead">Elastyczność i dostosowanie do potrzeb</p>
						<ul>
							<li>
								Możliwość dodawania nowych funkcji na życzenie klienta, np. funkcjonalność umożliwiająca szybkie
								tworzenie grafików pracy dla pracowników na dany miesiąc.
							</li>
							<li>
								Jesteśmy otwarci na tworzenie dowolnych funkcji, które mogą być przydatne w Twojej firmie, np.
								wewnętrznego czatu firmowego do komunikacji lub innych narzędzi specyficznych dla danej branży.
							</li>
						</ul>
						<p>
							Naszym priorytetem jest zbudowanie narzędzia idealnie dopasowanego do specyficznych potrzeb każdej firmy,
							aby zapewnić wygodę i maksymalną efektywność zarządzania pracą.
						</p>
					</div>
				</section>

				<section className="aboutapp advantage">
					<h2 onClick={() => toggleContent('advantage')} className={expandedSections['advantage'] ? 'expanded' : ''}>
						<img src="/img/right-arrow.png" style={{ width: '15px' }} alt="arrow" />
						Korzyści dla Twojej firmy
					</h2>
					<div className={`context ${expandedSections['advantage'] ? 'expanded' : ''}`}>
						<p>Wdrożenie naszej Aplikacji w Twojej firmie to:</p>
						<ul>
							<li>
								<span style={{ fontWeight: 'bold' }}>Oszczędność czasu</span> – automatyzacja procesów związanych z
								ewidencją i zarządzaniem pracą.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Zwiększenie efektywności</span> – szybki dostęp do kluczowych
								informacji o pracownikach i planach urlopowych.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Transparentność</span> – jasne i przejrzyste zasady zarządzania
								czasem pracy oraz urlopami.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Centralizacja wszystkich procesów</span> – jedno miejsce, w którym
								znajdziesz wszystkie informacje dotyczące Twojej firmy, pracowników i bieżących działań.
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Bezpieczeństwo danych</span> – wszystkie dane przechowywane są z
								najwyższymi standardami bezpieczeństwa.
							</li>
						</ul>
					</div>
				</section>

				<section className="aboutapp demo">
					<h2 onClick={() => toggleContent('demo')} className={expandedSections['demo'] ? 'expanded' : ''}>
						<img src="/img/right-arrow.png" style={{ width: '15px' }} alt="arrow" />
						Sprawdź naszą aplikację <br></br>– demo dla każdego
					</h2>
					<div className={`context ${expandedSections['demo'] ? 'expanded' : ''}`}>
						<p>
							Chcesz zobaczyć, jak działa Planopia? Nic prostszego! Udostępniamy Ci darmowe konto testowe, dzięki
							któremu możesz przetestować pełną funkcjonalność aplikacji.
						</p>
						<ul>
							<li>
								<span style={{ fontWeight: 'bold' }}>Adres aplikacji: </span>
								<Link to="/login"> www.planopia.pl/login</Link>
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Login:</span> michalipka@o2.pl
							</li>
							<li>
								<span style={{ fontWeight: 'bold' }}>Hasło:</span> ADMIN
							</li>
						</ul>
						<p>Zaloguj się i sprawdź, jak Planopia może ułatwić życie Twojej firmy!</p>
					</div>
				</section>

				<section className="aboutapp contact">
					<h2 onClick={() => toggleContent('contact')} className={expandedSections['contact'] ? 'expanded' : ''}>
						<img src="/img/right-arrow.png" style={{ width: '15px' }} alt="arrow" />
						Kontakt
					</h2>
					<div className={`context ${expandedSections['contact'] ? 'expanded' : ''}`}>
						<div className="myfaceeandcontact">
							<p style={{ fontWeight: 'bold' }}>
								<img src="/img/1709827103942.jpg" alt="zdjęcie Michała Lipki" />
								Michał Lipka
								<a href="https://www.linkedin.com/in/michal-lipka-wd/" target="_blank">
									<img src="/img/linkedin.png" alt="logo linkedin" style={{ width: '20px', marginLeft: '5px' }} />
								</a>
							</p>

							<ul>
								<li>
									<span style={{ fontWeight: 'bold' }}>E-mail:</span>{' '}
									<a href="mailto:michalipka1@gmail.com">michalipka1@gmail.com</a>
								</li>
								<li>
									<span style={{ fontWeight: 'bold' }}>Telefon:</span> <a href="tel:+48516698792">516 598 792</a>
								</li>
							</ul>
							<p>
								Masz pytania lub chcesz umówić się na prezentację aplikacji? Skontaktuj się – chętnie odpowiemy na każde
								Twoje pytanie!
							</p>
						</div>
					</div>
				</section>

				<footer
					className="pp-top"
					style={{
						marginTop: '30px',
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
						alignItems: 'center',
						height: 'auto',
					}}>
					<p className="pp-header" style={{ paddingTop: '10px' }}>
						Planopia
					</p>
					<a href="/blog/jak-usprawnic-firme" style={{ textAlign: 'center', padding: '10px' }} className="linkfooter">
						Aplikacja do ewidencji czasu pracy <span> może usprawnić Twoją firmę</span>
					</a>
				</footer>
			</div>
		</>
	)
}

export default ProductPromotion
