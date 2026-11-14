export default function ChildCode({ onNavigate }) {
  return (
    <>
      <header className="register-header">
        <div className="register-header-left">
          <button type="button" className="register-logo" onClick={() => onNavigate('go_home')}>••</button>
          <span style={{ fontWeight: 'bold', borderBottom: '2px solid #101914', paddingBottom: '8px' }}>Add a child</span>
        </div>
        <nav className="register-nav">
          <button type="button" onClick={() => alert('Settings')}>Settings</button>
          <button type="button" onClick={() => alert('Help')}>Help</button>
        </nav>
      </header>

      <main className="register-main">
        <aside className="left-card">
          <div>
            <h1 style={{ fontSize: 'clamp(32px, 3.5vw, 56px)', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1.15 }}>One little code.<br />A new beginning.</h1>
            <p style={{ marginTop: '16px', fontSize: '15px', color: '#374151' }}>Give Dan this code in your next session, or share it with their parent or guardian.</p>
          </div>

          <div className="figma-right-art-container">
            <img src="/resources/register-characters.png" alt="Child Code Characters" className="figma-right-art-img" />
          </div>

          <p style={{ fontSize: '13px', color: '#555', position: 'relative', zIndex: 2 }}>Dan's account is connected to your practice.</p>
        </aside>

        <section className="register-content">
          <p className="register-step">CHILD REGISTERED</p>
          <h2 className="form-title">Dan is ready to explore.</h2>
          <p className="register-description">Share this login code with Dan and their grown-up.</p>

          <div style={{ background: '#eaf2ff', padding: '24px', borderRadius: '24px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', letterSpacing: '1px' }}>DAN'S LOGIN CODE</span>
            <div style={{ fontSize: '36px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '6px', color: '#111', margin: '10px 0 5px 0' }}>PIP742</div>
            <div style={{ fontSize: '13px', color: '#555' }}>Enter this code on the child login screen.</div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              type="button"
              className="register-submit"
              style={{ flex: 1, fontSize: '15px', minHeight: '52px', marginTop: 0 }}
              onClick={() => { navigator.clipboard?.writeText('PIP742'); alert('Code copied!'); }}
            >
              Copy login code
            </button>
            <button type="button" onClick={() => alert('Downloading card...')} style={{ flex: 1, border: 'none', background: '#eaf2ff', borderRadius: '999px', fontWeight: 'bold', color: '#555', cursor: 'pointer' }}>Download login card</button>
          </div>

          <div style={{ background: '#eaf2ff', padding: '16px', borderRadius: '16px', marginBottom: '24px', fontSize: '13px', color: '#444' }}>
            <strong>Keep this code safe.</strong><br />Need a new one? Reset it from Dan's profile.<br />The previous code will stop working.
          </div>

          <button type="button" className="register-submit" style={{ width: '100%', marginBottom: '16px' }} onClick={() => onNavigate('go_child_profile')}>
            Go to Dan's profile
          </button>

          <button type="button" onClick={() => onNavigate('go_add_child')} style={{ background: 'none', border: 'none', color: '#6e42c1', fontWeight: 'bold', cursor: 'pointer', display: 'block', margin: '0 auto' }}>
            Add another child
          </button>
        </section>
      </main>
    </>
  );
}
