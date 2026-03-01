# Changelog

All notable changes to the AI Family Meal Planner will be documented in this file.

## [Unreleased]

### Added

- **Recipe Detail Page**: View complete recipe information including full ingredients, instructions, and nutritional data
- **Ingredient Exclusion System**: Select ingredients to exclude and regenerate recipes with AI that respects those constraints
- **Toast Notification System**: Real-time feedback for user actions across the application
- **Enhanced Accessibility**:
  - Keyboard navigation support for ingredient checkboxes
  - ARIA labels and roles for interactive elements
  - Improved touch targets (minimum 44×44px)
- **Loading Skeletons**: Improved perceived performance during async operations
- **Micro-animations**: Smooth transitions, hover effects, and visual feedback

### Improved

- **UI/UX Consistency**: Unified color palette to `surface-*` theme across all pages
- **Card Components**: Added hover effects with border and shadow transitions
- **Navigation**: Recipe names are now clickable links in Meal Plan and Favorites pages
- **Regeneration Logic**: `replaceRecipe` store action preserves entire meal plan while updating specific recipes
- **Error Handling**: Validation for recipe ownership before regeneration, user-friendly toast messages
- **State Management**: Better handling of `excludedIngredients` - auto-clears after regeneration and when switching recipes

### Technical

- Added `ToastProvider` context for global notifications
- Added `replaceRecipe` action to Zustand store
- Extended `regenerateMeal` service to accept `excludedIngredients` parameter
- Updated TypeScript types to support new features
- Improved component composition and reusability

## [0.1.0] - 2026-02-27

### Added

- Initial release of AI Family Meal Planner
- Core meal plan generation with OpenRouter
- Family profile management
- Weekly schedule with availability tracking
- Basic recipe display and editing
- Shopping list generation
- Favorites system
- Settings and preferences
- Dark theme with surface color palette
- AI debug logging system

[^1]: This changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.
