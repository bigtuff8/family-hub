import { ConfigProvider } from 'antd';
import Calendar from './features/calendar/Calendar';
import './App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2dd4bf',
          colorError: '#fb7185',
          colorSuccess: '#2dd4bf',
          colorWarning: '#fbbf24',
          borderRadius: 12,
          fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        },
      }}
    >
      <Calendar />
    </ConfigProvider>
  );
}

export default App;