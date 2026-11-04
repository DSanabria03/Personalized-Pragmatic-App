import './App.css'

function App() {
  const user = 'DAN'

  return (
    <main className="screen1">
      <header className="header">
        <div className="wordlings">
          <span className="brand" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>WORDLINGS</span>
        </div>

        <div className="buttons">
          <button className="play-button" type="button">
            Play
          </button>
        </div>
      </header>

      <section className="home" aria-label="Home">
        <img
          className="characters"
          src="/resources/characters.png"
          alt=""
        />

        <h1 className="greeting">HI, EXPLORER!</h1>

      </section>
    </main>
  )
}

export default App