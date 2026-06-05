import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import DrinkDetailPage from './pages/DrinkDetailPage'
import DrinksListPage from './pages/DrinksListPage'
import HomePage from './pages/HomePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppHeader />
        <div className="app">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/drinks" element={<DrinksListPage />} />
              <Route path="/drinks/:id" element={<DrinkDetailPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
