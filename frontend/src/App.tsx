import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DrinkDetailPage from './pages/DrinkDetailPage'
import DrinksListPage from './pages/DrinksListPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <h1>Drinks</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/drinks" replace />} />
            <Route path="/drinks" element={<DrinksListPage />} />
            <Route path="/drinks/:id" element={<DrinkDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
