import {Outlet} from 'react-router-dom';
import './Auth.css';

export default function AppLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}
