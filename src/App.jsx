import { useRoutes } from 'react-router-dom';
import { appRoutes } from './routes/appRoutes.jsx';

export default function App() {
  return useRoutes(appRoutes);
}
