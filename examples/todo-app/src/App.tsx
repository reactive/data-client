import Home from 'pages/Home';
import { memo } from 'react';
import 'style/main.scss';

// Typically place global navigation and routing layer in here
function App() {
  return <Home />;
}
export default memo(App);
