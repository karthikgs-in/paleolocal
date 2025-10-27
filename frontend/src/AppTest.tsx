import './App.css';

function AppTest() {
  console.log('🧪 AppTest component rendering');

  return (
    <div className="App">
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontSize: '24px',
        color: '#333'
      }}>
        <h1>🧪 Test Page</h1>
        <p>If you can see this, React is working!</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default AppTest;