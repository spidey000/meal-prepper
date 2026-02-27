import type { ShoppingList } from '../types/app'
import { useAppStore } from '../store/appStore'
import { SectionHeader } from '../components/SectionHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export const ShoppingListPage = () => {
  const { shoppingList, actions } = useAppStore()

  if (!shoppingList) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Shopping list"
          description="Generate a meal plan first, then build a smart grocery list with categorized items."
        />
        <Card>
          <p className="text-sm text-slate-500">
            No list yet. Head to the Meal Plan tab and click “Build shopping list”.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Shopping list"
        description={`Week of ${shoppingList.weekStartDate}`}
        actions={
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(formatList(shoppingList))}>
            Copy to clipboard
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {shoppingList.categories.map((category) => (
          <Card key={category.categoryName} className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{category.categoryName}</p>
              <p className="text-lg font-semibold text-slate-900">{category.items.length} items</p>
            </div>
            <ul className="space-y-3">
              {category.items.map((item) => (
                <li key={item.item} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.checked ?? false}
                      onChange={() => actions.toggleShoppingItem(category.categoryName, item.item)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.quantity} {item.unit} {item.item}
                      </p>
                      {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                      {typeof item.estimatedPrice === 'number' && (
                        <p className="text-xs text-slate-400">~€{item.estimatedPrice.toFixed(2)}</p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      {typeof shoppingList.estimatedTotalCost === 'number' && (
        <p className="text-sm font-medium text-slate-600">
          Estimated total: €{shoppingList.estimatedTotalCost.toFixed(2)}
        </p>
      )}
    </div>
  )
}

function formatList(list: ShoppingList) {
  return list.categories
    .map((category) => `${category.categoryName}:
${category.items.map((item) => `- ${item.item} (${item.quantity} ${item.unit})`).join('\n')}`)
    .join('\n\n')
}
