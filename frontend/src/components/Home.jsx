import SiteHeader from './SiteHeader';

export default function Home({ onNavigate }) {
  return (
    <>
      <SiteHeader onNavigate={onNavigate} />

      <main className="home-main">
        <h1 className="hero-title">HI, EXPLORER!</h1>
        <div className="hero-img-container">
          <img src="/resources/characters.png" className="hero-img" alt="Characters" />
        </div>
      </main>
    </>
  );
}
