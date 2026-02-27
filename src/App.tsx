import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/providers/AppProviders'
import { AppLayout } from './components/layout/AppLayout'
import { FamilyPage, MealPlanPage, SchedulePage, ShoppingListPage, SettingsPage } from './pages'

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/meal-plan" replace />} />
            <Route path="/meal-plan" element={<MealPlanPage />} />
            <Route path="/family" element={<FamilyPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  )
}

export default App
