// Settings for the whole app. Opened from "Settings" in the top bar (not available during a story,
// so nothing changes in the middle of a game). Saved in this browser.

const TEXT = {
  en: {
    title: 'Settings',
    intro: 'These settings are used from the next story on.',
    language: 'Language',
    languageHelp: 'The language of the stories, Pip and the customers.',
    voice: "Pip's voice",
    voiceHelp: 'Pip and the customers read their sentences aloud.',
    pause: 'Pause for the grown-up',
    pauseHelp: 'After the first choice that doesn’t fit, the game pauses so a therapist or grown-up can talk it through with the child.',
    on: 'On',
    off: 'Off',
    account: 'Account',
    child: 'Playing as',
    therapist: 'Logged in as therapist',
    guest: 'Not logged in.',
    logout: 'Log out',
    back: '← Back',
  },
  it: {
    title: 'Impostazioni',
    intro: 'Queste impostazioni valgono dalla prossima storia.',
    language: 'Lingua',
    languageHelp: 'La lingua delle storie, di Pip e dei clienti.',
    voice: 'La voce di Pip',
    voiceHelp: 'Pip e i clienti leggono le loro frasi ad alta voce.',
    pause: "Pausa per l'adulto",
    pauseHelp: 'Dopo la prima scelta che non va bene, il gioco si ferma così un terapista o un adulto può parlarne con il bambino.',
    on: 'Sì',
    off: 'No',
    account: 'Account',
    child: 'Giochi come',
    therapist: 'Accesso come terapista',
    guest: 'Non hai effettuato l’accesso.',
    logout: 'Esci',
    back: '← Indietro',
  },
};

function Toggle({ value, onChange, labels }) {
  return (
    <div style={styles.segment} role="group">
      {labels.map(([optionValue, label]) => (
        <button key={String(optionValue)} type="button" onClick={() => onChange(optionValue)} aria-pressed={value === optionValue}
          style={{ ...styles.segmentButton, ...(value === optionValue ? styles.segmentActive : {}) }}>
          {label}
        </button>
      ))}
    </div>
  );
}

export default function Settings({ settings, onChange, onBack, session, onLogout }) {
  const t = TEXT[settings.language === 'it' ? 'it' : 'en'];
  const set = (key, value) => onChange({ ...settings, [key]: value });

  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={onBack}>••</button>
          <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>{t.title}</span>
        </div>
        <nav className="register-nav">
          <button type="button" onClick={onBack}>{t.back}</button>
        </nav>
      </header>

      <main style={styles.page}>
        <h1 style={{ margin: 0 }}>{t.title}</h1>
        <p style={{ color: '#555', marginTop: 0 }}>{t.intro}</p>

        <section style={styles.card}>
          <div>
            <h2 style={styles.h2}>{t.language}</h2>
            <p style={styles.help}>{t.languageHelp}</p>
          </div>
          <Toggle value={settings.language} onChange={(v) => set('language', v)}
            labels={[['en', '🇬🇧 English'], ['it', '🇮🇹 Italiano']]} />
        </section>

        <section style={styles.card}>
          <div>
            <h2 style={styles.h2}>{t.voice}</h2>
            <p style={styles.help}>{t.voiceHelp}</p>
          </div>
          <Toggle value={settings.voice} onChange={(v) => set('voice', v)} labels={[[true, `🔊 ${t.on}`], [false, `🔇 ${t.off}`]]} />
        </section>

        <section style={styles.card}>
          <div>
            <h2 style={styles.h2}>{t.pause}</h2>
            <p style={styles.help}>{t.pauseHelp}</p>
          </div>
          <Toggle value={settings.grownUpPause} onChange={(v) => set('grownUpPause', v)} labels={[[true, t.on], [false, t.off]]} />
        </section>

        <section style={styles.card}>
          <div>
            <h2 style={styles.h2}>{t.account}</h2>
            <p style={styles.help}>
              {!session && t.guest}
              {session && session.role === 'child' && <>{t.child} <strong>{session.name}</strong></>}
              {session && session.role === 'therapist' && <>{t.therapist}: <strong>{session.name}</strong></>}
            </p>
          </div>
          {session && <button type="button" onClick={onLogout} style={styles.logout}>{t.logout}</button>}
        </section>

        <button type="button" className="register-submit" onClick={onBack} style={{ alignSelf: 'flex-start' }}>{t.back}</button>
      </main>
    </>
  );
}

const styles = {
  page: { maxWidth: '760px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#f7f5ef', borderRadius: '20px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
  h2: { fontSize: '18px', margin: '0 0 4px' },
  help: { margin: 0, color: '#555', fontSize: '14px', maxWidth: '420px' },
  segment: { display: 'flex', border: '2px solid #d2d9d0', borderRadius: '999px', overflow: 'hidden', background: '#fff' },
  segmentButton: { border: 'none', background: 'transparent', padding: '10px 18px', fontWeight: 'bold', cursor: 'pointer', color: '#555', fontSize: '15px' },
  segmentActive: { background: '#6e42c1', color: '#fff' },
  logout: { border: '2px solid #d2d9d0', background: '#fff', borderRadius: '999px', padding: '10px 18px', cursor: 'pointer', fontWeight: 'bold' },
};
