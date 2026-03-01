import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProviders } from './app/providers/AppProviders'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import {
  FamilyPage,
  MealPlanPage,
  SchedulePage,
  ShoppingListPage,
  SettingsPage,
  FavoritesPage,
  RecipePage,
} from './pages'

function App() {
  return (
    <AppProviders>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/meal-plan" replace />} />
              <Route path="/meal-plan" element={<MealPlanPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/recipe/:recipeId" element={<RecipePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProviders>
  )
}

export default App
