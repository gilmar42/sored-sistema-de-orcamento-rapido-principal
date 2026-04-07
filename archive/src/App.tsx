
import React from 'react';
// import { useAuth } from './context/AuthContext';
// import { DataProvider } from './context/DataContext';
// import { AuthPage } from './components/auth/AuthPage';
// import { MainLayout } from './components/MainLayout';

const App: React.FC = () => {
  // const { currentUser } = useAuth();

  // if (!currentUser) {
  //   return <AuthPage />;
  // }

  // // If user is logged in, wrap the main layout with the data provider
  // // This ensures data is scoped to the logged-in user's tenant
  return (
    <div>Olá do novo App</div>
    // <DataProvider>
    //   <MainLayout />
    // </DataProvider>
  );
};

export default App;
