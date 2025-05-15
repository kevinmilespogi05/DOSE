import { BarChart2 } from 'lucide-react';

const AdminNavigation = () => {
  const navigation = [
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart2,
      current: location.pathname === '/admin/analytics'
    },
  ];

  // ... rest of the component code ...
} 