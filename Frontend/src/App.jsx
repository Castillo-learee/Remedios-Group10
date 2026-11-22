import { useEffect, useState } from 'react';
import './style.css';

import SideNavbar from './components/SideNavBar';
import ComingSoon from './pages/ComingSoon';
import Inventory  from './pages/admin/Inventory';

const pages = {
  'pos-orders': () => <ComingSoon page="POS and Orders" />,
  'inventory':  Inventory,
  'analytics':  () => <ComingSoon page="Analytics" />,
  'promotions': () => <ComingSoon page="Promotions" />,
};

const getPage = () => {
  const hash = window.location.hash.slice(1);
  return pages[hash] ? hash : 'pos-orders';
};

function App() {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const onHash = () => setPage(getPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Page = pages[page];

  return (
    <div className="layout">
      <SideNavbar current={page} />
      <main className="content">
        <Page />
      </main>
    </div>
  );
}

export default App;
