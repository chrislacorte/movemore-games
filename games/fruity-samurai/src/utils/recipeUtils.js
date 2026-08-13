export const RECIPE_BOTTLE_CAPACITY = 5

export function createRecipe(fruitTypes, length = RECIPE_BOTTLE_CAPACITY) {
  const pool = [...fruitTypes]
  const recipe = []
  for (let i = 0; i < length; i += 1) {
    recipe.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return recipe
}

export function getCurrentRecipeFruit(state) {
  if (!state.recipe?.length) return null
  return state.recipe[state.recipeIndex] ?? null
}

export function advanceRecipe(state, fruitTypes) {
  state.recipeIndex += 1
  state.bottleFill = state.recipeIndex

  if (state.recipeIndex >= state.recipe.length) {
    state.recipe = createRecipe(fruitTypes, RECIPE_BOTTLE_CAPACITY)
    state.recipeIndex = 0
    state.bottleFill = 0
    return 'complete'
  }
  return 'progress'
}
