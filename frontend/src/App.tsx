import { InteractiveMap } from './components/Map/InteractiveMap';
import './App.css';

function App() {
  return (
    <div className="App">
      <InteractiveMap 
        showAttribution={true}
        className="main-map-container"
        initialCenter={{ latitude: 36.1069, longitude: -112.1129 }} // Grand Canyon
        initialZoom={8}
      />
    </div>
  );
}

export default App;