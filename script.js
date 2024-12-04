const YOUTUBE_API_KEY = 'AIzaSyC-9nKqm67yA9g4LkuwQ9n9xemWAgreFl8';

// List/Array of Asian cuisines
const asianCuisines = ['Filipino', 'Chinese', 'Japanese', 'Indian', 'Vietnamese', 'Thai', 'Malaysian'];


// Function to generate a random recipe from MealDB API
async function generateRecipe() {
    const recipeContainer = document.getElementById('recipeContainer');
    recipeContainer.innerHTML = '<p>Loading recipe...</p>';
    
    try {
        // Randomly select one of the Asian cuisines
        const randomCuisine = asianCuisines[Math.floor(Math.random() * asianCuisines.length)];
        
        // Fetch the recipe for the selected cuisine
        const searchResponse = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?a=${randomCuisine}`
        );
        const searchData = await searchResponse.json();
        
        if (!searchData.meals || searchData.meals.length === 0) {
            throw new Error(`No ${randomCuisine} recipes found`);
        }

        // Get a random recipe from the result
        const randomRecipe = searchData.meals[Math.floor(Math.random() * searchData.meals.length)];
        
        // Fetch the detailed recipe information
        const detailResponse = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${randomRecipe.idMeal}`
        );
        const detailData = await detailResponse.json();
        const recipeDetail = detailData.meals[0];

        // Fetch YouTube video using the recipe name
        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=how+to+cook+${encodeURIComponent(recipeDetail.strMeal)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`
        );
        const videoData = await videoResponse.json();
        const videoId = videoData.items?.[0]?.id?.videoId;

        // Get ingredients and measurements
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipeDetail[`strIngredient${i}`];
            const measure = recipeDetail[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }

        // Split instructions into steps
        const instructions = recipeDetail.strInstructions
            .split(/\r\n|\r|\n/)
            .filter(step => step.trim() !== '');

        // Create the HTML for the recipe
        const recipeHTML = `
            <h2 class="recipe-title">${recipeDetail.strMeal}</h2>
            <p class="cuisine-type">Cuisine: ${randomCuisine}</p>
            <img src="${recipeDetail.strMealThumb}" 
                alt="${recipeDetail.strMeal}" 
                class="recipe-image">
            ${videoId ? `
                <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                    <iframe 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        src="https://www.youtube.com/embed/${videoId}"
                        title="Recipe Tutorial"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            ` : ''}
            <div class="ingredients">
                <h3>Ingredients:</h3>
                <ul>
                    ${ingredients.map(ingredient => 
                        `<li>${ingredient}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="instructions">
                <h3>Instructions:</h3>
                <ul>
                    ${instructions.map(step => 
                        `<li>${step}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
        recipeContainer.innerHTML = recipeHTML;
    } catch (error) {
        recipeContainer.innerHTML = `
            <p style="color: red;">Error: ${error.message || 'Failed to fetch recipe'}</p>
        `;
    }
}

async function searchByIngredients() {
    const recipeContainer = document.getElementById('recipeContainer');
    const ingredientInput = document.getElementById('ingredientInput').value.trim();
    
    if (!ingredientInput) {
        recipeContainer.innerHTML = '<p style="color: red;">Please enter at least one ingredient</p>';
        return;
    }

    recipeContainer.innerHTML = '<p>Searching for recipes...</p>';
    
    try {
        // Convert input to array and trim whitespace
        const searchedIngredients = ingredientInput.split(',').map(i => i.trim());
        console.log('Searching for ingredients:', searchedIngredients);
        
        // First, get all meals that contain the first ingredient
        const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchedIngredients[0]}`
        );
        const data = await response.json();
        console.log('Initial search results:', data);
        
        if (!data.meals) {
            throw new Error('No recipes found with these ingredients');
        }

        // For each potential meal, get its full details to check other ingredients
        const matchingRecipes = [];
        
        for (const meal of data.meals) {
            const detailResponse = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
            );
            const detailData = await detailResponse.json();
            const recipe = detailData.meals[0];
            
            // Get all ingredients for this recipe
            const recipeIngredients = [];
            for (let i = 1; i <= 20; i++) {
                if (recipe[`strIngredient${i}`]) {
                    recipeIngredients.push(recipe[`strIngredient${i}`].toLowerCase());
                }
            }
            
            // Check if recipe contains all searched ingredients
            const hasAllIngredients = searchedIngredients.every(ingredient =>
                recipeIngredients.some(recipeIng => 
                    recipeIng.includes(ingredient.toLowerCase())
                )
            );
            
            if (hasAllIngredients && (recipe.strArea === 'Chinese' || 
                recipe.strArea === 'Japanese' || 
                recipe.strArea === 'Indian' || 
                recipe.strArea === 'Thai' || 
                recipe.strArea === 'Vietnamese' || 
                recipe.strArea === 'Malaysian' ||
                recipe.strArea === 'Filipino')) {
                matchingRecipes.push(recipe);
                console.log('Found matching recipe:', recipe.strMeal);
            }
        }

        if (matchingRecipes.length === 0) {
            throw new Error('No Asian recipes found with all specified ingredients');
        }

        // Select a random recipe from matches
        const selectedRecipe = matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];
        console.log('Selected recipe:', selectedRecipe.strMeal);
        
        // Fetch YouTube video using the recipe name
        const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=how+to+cook+${encodeURIComponent(selectedRecipe.strMeal)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`
        );
        const videoData = await videoResponse.json();
        const videoId = videoData.items?.[0]?.id?.videoId;

        // Get ingredients and measurements
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = selectedRecipe[`strIngredient${i}`];
            const measure = selectedRecipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }

        // Split instructions into steps
        const instructions = selectedRecipe.strInstructions
            .split(/\r\n|\r|\n/)
            .filter(step => step.trim() !== '');

        // Create the HTML for the recipe
        const recipeHTML = `
            <h2 class="recipe-title">${selectedRecipe.strMeal}</h2>
            <p class="cuisine-type">Cuisine: ${selectedRecipe.strArea}</p>
            <img src="${selectedRecipe.strMealThumb}" 
                alt="${selectedRecipe.strMeal}" 
                class="recipe-image">
            ${videoId ? `
                <div class="video-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                    <iframe 
                        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                        src="https://www.youtube.com/embed/${videoId}"
                        title="Recipe Tutorial"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            ` : ''}
            <div class="ingredients">
                <h3>Ingredients:</h3>
                <ul>
                    ${ingredients.map(ingredient => 
                        `<li>${ingredient}</li>`
                    ).join('')}
                </ul>
            </div>
            <div class="instructions">
                <h3>Instructions:</h3>
                <ul>
                    ${instructions.map(step => 
                        `<li>${step}</li>`
                    ).join('')}
                </ul>
            </div>
        `;
        recipeContainer.innerHTML = recipeHTML;
    } catch (error) {
        console.error('Search error:', error);
        recipeContainer.innerHTML = `
            <p style="color: red;">Error: ${error.message || 'Failed to fetch recipes'}</p>
        `;
    }
}
