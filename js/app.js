document.addEventListener('DOMContentLoaded', function() {
    // === Core Navigation & UI ===
    const screens = document.querySelectorAll('.screen');
    const menuItems = document.querySelectorAll('.menu-item, .submenu-item, .back-btn');
    const quizMenuOverlay = document.getElementById('quiz-menu-overlay');
    const menuTriggerBtn = document.getElementById('menu-trigger');
    
    // Theme Logic
    function updateThemeColorMeta(isDark) {
        const themeColor = isDark ? '#1e1e1e' : '#ffffff';
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = themeColor;
    }

    function initTheme() {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (systemPrefersDark) {
            document.body.classList.add('dark-theme');
            updateThemeColorMeta(true);
        } else {
            document.body.classList.remove('dark-theme');
            updateThemeColorMeta(false);
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (e.matches) {
                document.body.classList.add('dark-theme');
                updateThemeColorMeta(true);
            } else {
                document.body.classList.remove('dark-theme');
                updateThemeColorMeta(false);
            }
        });
    }

    initTheme();
    
    // UI Elements for Quiz
    const quizContainer = document.getElementById('quiz-content');
    const resultsContainer = document.getElementById('results-content');
    const questionText = document.getElementById('question-text');
    const questionImage = document.getElementById('question-image');
    const optionsContainer = document.getElementById('options-container');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    
    // Navigation Logic
    function showScreen(screenId) {
        screens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            
            // If returning to main, we might want to check for saved progress
            if (screenId === 'main-screen') {
                updateMainScreenStatus();
            }
        }
    }

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetScreenId = this.getAttribute('data-screen');
            
            // Special handling for wine quiz buttons
            if (this.id === 'wine-names-btn') {
                loadQuiz('names');
                return;
            }
            if (this.id === 'wine-descriptions-btn') {
                loadQuiz('descriptions');
                return;
            }
            if (this.id === 'random-quiz-btn') {
                loadQuiz('random');
                return;
            }
            if (this.id === 'cocktails-btn') {
                loadQuiz('cocktails');
                return;
            }

            if (this.classList.contains('quiz') && targetScreenId === 'quiz-screen') {
                const sessions = ['wine_names_session', 'wine_descriptions_session', 'wine_random_session'];
                let latestSession = null;
                let latestType = '';
                
                sessions.forEach(key => {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const parsed = JSON.parse(data);
                        if (!latestSession || parsed.lastUpdated > latestSession.lastUpdated) {
                            latestSession = parsed;
                            latestType = key === 'wine_names_session' ? 'names' : 
                                         key === 'wine_descriptions_session' ? 'descriptions' : 'random';
                        }
                    }
                });
                
                if (latestSession) {
                    loadQuiz(latestType);
                } else {
                    showToast('Никакого теста еще не начато');
                }
                return;
            }

            if (targetScreenId) showScreen(targetScreenId);
        });
    });

    // === Cocktail Game Logic ===
    const COCKTAILS = [
        {
            name: "Апельсиновый мартини",
            ingredients: ["Мартини Бьянко", "Апельсиновый сок"],
            decorations: ["лимон", "палочка"],
            toppings: ["лед"],
            recipe: "1. Налить Мартини Бианко до верхней части надписи логотипа 'Аэрофлот'.\n2. Добавить 2-3 кубика льда.\n3. Налить апельсиновый сок до уровня толщины пальца от края стакана.\n4. Перемешать палочкой и украсить долькой лимона.",
            volumes: { "Мартини Бьянко": 3, "Апельсиновый сок": 4 } // seconds
        },
        {
            name: "Джин-Тоник",
            ingredients: ["Джин", "Тоник"],
            decorations: ["лимон", "палочка"],
            toppings: ["лед"],
            recipe: "1. Налить Джин до верхней части надписи логотипа 'Аэрофлот'.\n2. Добавить 2-3 кубика льда.\n3. Налить тоник до уровня толщины пальца от края стакана.\n4. Перемешать палочкой и украсить долькой лимона.",
            volumes: { "Джин": 3, "Тоник": 4 }
        },
        {
            name: "Краски неба",
            ingredients: ["Джин", "Яблочный сок"],
            decorations: ["лимон", "палочка"],
            toppings: ["лед"],
            recipe: "1. Положить 1 кубик льда.\n2. Налить джин до всплытия льда.\n3. Заполнить бокал льдом (3-4 кубика).\n4. Долить яблочный сок до уровня толщины пальца от края.\n5. Перемешать палочкой и украсить долькой лимона.",
            volumes: { "Джин": 2, "Яблочный сок": 5 }
        },
        {
            name: "Мартини Фиеро и Тоник",
            ingredients: ["Мартини Фиеро", "Тоник"],
            decorations: ["лимон", "палочка"],
            toppings: ["лед"],
            recipe: "1. Налить Мартини Фиеро до верхней части надписи логотипа 'Аэрофлот'.\n2. Добавить 2-3 кубика льда.\n3. Налить тоник до уровня толщины пальца от края.\n4. Перемешать палочкой и украсить долькой лимона.",
            volumes: { "Мартини Фиеро": 3, "Тоник": 4 }
        },
        {
            name: "Мохито",
            ingredients: ["Такамака блан", "Фрустайл Лайм"],
            decorations: ["лимон", "палочка", "мята"],
            toppings: ["лед", "лимон (размять)"],
            recipe: "1. Разместить 2 дольки лимона и размять палочкой.\n2. Добавить 3 листа мяты.\n3. Налить 30 мл рома.\n4. Добавить 2-3 кубика льда.\n5. Налить Фрустайл-Лайм до уровня толщины пальца от края.\n6. Перемешать палочкой и украсить лимоном и мятой.",
            volumes: { "Такамака блан": 2, "Фрустайл Лайм": 5 }
        },
        {
            name: "На встречу солнцу",
            ingredients: ["Шампанское", "Апельсиновый сок"],
            decorations: [],
            toppings: [],
            recipe: "1. Наполовину наполните охлажденным апельсиновым соком.\n2. Долейте охлажденным шампанским.",
            volumes: { "Апельсиновый сок": 4, "Шампанское": 4 }
        },
        {
            name: "На высоте",
            ingredients: ["Водка", "Томатный сок"],
            decorations: ["лимон"],
            toppings: ["соль", "перец", "лед", "лимон (размять)"],
            recipe: "1. Раздавить 2 дольки лимона.\n2. Высыпать 1 пакет соли и 0.5 пакета перца.\n3. Налить водку до уровня толщины пальца.\n4. Добавить 3 кубика льда.\n5. Долить томатный сок до уровня пальца от края.\n6. Перемешать и украсить лимоном.",
            volumes: { "Водка": 2, "Томатный сок": 5 }
        },
        {
            name: "Попутный ветер",
            ingredients: ["Виски", "Морс клюквенный", "Фрустайл Лайм"],
            decorations: ["лимон"],
            toppings: ["лед"],
            recipe: "1. Положить 1 кубик льда.\n2. Налить виски до всплытия льда.\n3. Заполнить бокал льдом (2-3 кубика).\n4. Долить морс до средней части стакана.\n5. Долить Фрустайл-Лайм до уровня пальца от края.\n6. Перемешать и украсить лимоном.",
            volumes: { "Виски": 2, "Морс клюквенный": 3, "Фрустайл Лайм": 3 }
        },
        {
            name: "Скай Флай",
            ingredients: ["Коньяк", "Вино красное", "Морс клюквенный", "Фрустайл Лайм"],
            decorations: ["лимон"],
            toppings: ["лед"],
            recipe: "1. Положить 1 кубик льда.\n2. Налить коньяк до всплытия льда.\n3. Заполнить льдом.\n4. Налить красное вино до средней части.\n5. Налить морс (1 палец).\n6. Налить Фрустайл-Лайм до уровня пальца от края.\n7. Перемешать и украсить.",
            volumes: { "Коньяк": 2, "Вино красное": 3, "Морс клюквенный": 1.5, "Фрустайл Лайм": 1.5 }
        }
    ];

    let currentGame = {
        cocktail: null,
        pouredIngredients: [],
        addedDecorations: [],
        addedToppings: [],
        isPouring: false,
        pourStartTime: 0,
        selectedIngredient: null
    };

    function initCocktailGame() {
        const cocktailsBtn = document.getElementById('cocktails-btn');
        cocktailsBtn.addEventListener('click', () => {
            showCocktailMenu();
        });

        // Toggle ingredients menu
        const toggleBtn = document.getElementById('toggle-ingredients');
        const sideMenu = document.getElementById('ingredients-menu');
        const closeMenuBtn = document.getElementById('close-ingredients');
        
        toggleBtn.addEventListener('click', () => {
            sideMenu.classList.toggle('open');
        });
        
        closeMenuBtn.addEventListener('click', () => {
            sideMenu.classList.remove('open');
        });

        // Ingredient categories accordions
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('active');
            });
        });

        // Pour logic
        const pourArea = document.getElementById('pour-area');
        pourArea.addEventListener('mousedown', startPouring);
        pourArea.addEventListener('touchstart', (e) => { e.preventDefault(); startPouring(); });
        window.addEventListener('mouseup', stopPouring);
        window.addEventListener('touchend', stopPouring);

        // Decor buttons
        document.getElementById('add-lemon-btn').addEventListener('click', toggleLemon);
        document.getElementById('add-stick-btn').addEventListener('click', toggleStick);
        
        // Recipe hint
        document.getElementById('recipe-hint-btn').addEventListener('click', () => {
            showRecipeModal(currentGame.cocktail);
        });
        
        document.querySelector('.close-modal').onclick = () => {
            document.getElementById('recipe-modal').style.display = 'none';
        };
    }

    async function showCocktailMenu() {
        // Prepare list of ingredients
        const alcList = document.getElementById('list-alcohol');
        const softList = document.getElementById('list-soft');
        const toppingList = document.getElementById('list-toppings');

        alcList.innerHTML = '';
        softList.innerHTML = '';
        toppingList.innerHTML = '';

        // Alcohol from descriptions
        if (descriptionsQuestions.length === 0) {
            const resp = await fetch('data/wine_descriptions.json');
            descriptionsQuestions = await resp.json();
        }

        descriptionsQuestions.forEach(wine => {
            const item = createIngredientItem(wine.name, wine.image, wine.liquidColor);
            item.onclick = () => selectIngredient(wine.name, wine.liquidColor);
            alcList.appendChild(item);
        });

        // Soft drinks (SVG)
        const softs = [
            { name: "Апельсиновый сок", color: "#FFA500" },
            { name: "Яблочный сок", color: "#F0E68C" },
            { name: "Томатный сок", color: "#FF6347" },
            { name: "Морс клюквенный", color: "#8B0000" },
            { name: "Тоник", color: "#F0F8FF" },
            { name: "Фрустайл Лайм", color: "#90EE90" }
        ];

        softs.forEach(s => {
            const item = createIngredientItem(s.name, null, s.color, true);
            item.onclick = () => selectIngredient(s.name, s.color);
            softList.appendChild(item);
        });

        // Toppings
        const toppings = [
            { name: "Долька лимона", type: "lemon" },
            { name: "Листик мяты", type: "mint" },
            { name: "Пакетик соли", type: "salt" },
            { name: "Пакетик перца", type: "pepper" },
            { name: "Кубик льда", type: "ice" }
        ];

        toppings.forEach(t => {
            const item = createIngredientItem(t.name, null, null, false, t.type);
            item.onclick = () => addTopping(t.type);
            toppingList.appendChild(item);
        });

        // Randomly pick a cocktail to prepare
        const randomCocktail = COCKTAILS[Math.floor(Math.random() * COCKTAILS.length)];
        startNewGame(randomCocktail);
        showRecipeModal(randomCocktail);
    }

    function createIngredientItem(name, img, color, isSoft = false, toppingType = null) {
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        
        if (img) {
            const i = document.createElement('img');
            i.src = img;
            div.appendChild(i);
        } else if (isSoft) {
            div.innerHTML += `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2" fill="${color}"/></svg>`;
        } else if (toppingType === 'lemon') {
            div.innerHTML += `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="yellow" stroke="gold"/></svg>`;
        } else if (toppingType === 'mint') {
            div.innerHTML += `<svg viewBox="0 0 24 24"><path d="M12,2 Q15,10 22,12 Q15,14 12,22 Q9,14 2,12 Q9,10 12,2" fill="green"/></svg>`;
        } else {
            div.innerHTML += `<i class="fas fa-plus"></i>`;
        }

        const span = document.createElement('span');
        span.textContent = name;
        div.appendChild(span);
        return div;
    }

    function startNewGame(cocktail) {
        currentGame = {
            cocktail: cocktail,
            pouredIngredients: [],
            addedDecorations: [],
            addedToppings: [],
            isPouring: false,
            pourStartTime: 0,
            selectedIngredient: null
        };
        // Reset UI
        document.getElementById('liquid-layer').style.height = '0%';
        document.getElementById('decorations-container').innerHTML = '';
        document.getElementById('add-lemon-btn').classList.remove('active');
        document.getElementById('add-stick-btn').classList.remove('active');
        document.getElementById('pour-area').classList.remove('active');
        document.getElementById('pour-area').querySelector('span').textContent = 'Удерживайте, чтобы налить';

        // Add Finish button
        let finishBtn = document.getElementById('finish-cocktail-btn');
        if (!finishBtn) {
            finishBtn = document.createElement('button');
            finishBtn.id = 'finish-cocktail-btn';
            finishBtn.className = 'btn-main';
            finishBtn.style.marginTop = '10px';
            finishBtn.textContent = 'Готово';
            finishBtn.onclick = checkCocktailResult;
            document.querySelector('.controls-area').appendChild(finishBtn);
        }
    }

    function checkCocktailResult() {
        const cocktail = currentGame.cocktail;
        let errors = [];

        // Check ingredients
        const pouredNames = currentGame.pouredIngredients.map(i => i.name);
        cocktail.ingredients.forEach(ing => {
            if (!pouredNames.includes(ing)) errors.push(`Отсутствует ингредиент: ${ing}`);
        });

        // Check volumes (time)
        currentGame.pouredIngredients.forEach(p => {
            const targetTime = cocktail.volumes[p.name];
            if (targetTime) {
                if (Math.abs(p.duration - targetTime) > 1.5) {
                    errors.push(`Неверный объем для ${p.name}`);
                }
            }
        });

        // Check decorations
        if (cocktail.decorations.includes('lemon') && !currentGame.addedDecorations.includes('lemon')) {
            errors.push("Забыли лимон на край бокала");
        }
        if (cocktail.decorations.includes('stick') && !currentGame.addedDecorations.includes('stick')) {
            errors.push("Забыли палочку");
        }

        if (errors.length === 0) {
            showToast("Коктейль приготовлен идеально! ✨");
            setTimeout(() => showScreen('wine-screen'), 2000);
        } else {
            showToast(`Ошибки: ${errors[0]}`);
        }
    }

    function showRecipeModal(cocktail) {
        document.getElementById('modal-cocktail-name').textContent = cocktail.name;
        document.getElementById('modal-cocktail-recipe').innerHTML = `
            <div style="text-align: left; margin: 15px 0;">
                <p><strong>Состав:</strong> ${cocktail.ingredients.join(', ')}</p>
                <div style="white-space: pre-line; margin-top: 10px;">${cocktail.recipe}</div>
            </div>
        `;
        document.getElementById('recipe-modal').style.display = 'block';
    }

    function selectIngredient(name, color) {
        currentGame.selectedIngredient = { name, color };
        document.getElementById('pour-area').classList.add('active');
        document.getElementById('pour-area').querySelector('span').textContent = `Налить ${name}`;
        // Close menu on mobile
        if (window.innerWidth < 768) {
            document.getElementById('ingredients-menu').classList.remove('open');
        }
    }

    function startPouring() {
        if (!currentGame.selectedIngredient) return;
        currentGame.isPouring = true;
        currentGame.pourStartTime = Date.now();
        
        // Animation
        const liquid = document.getElementById('liquid-layer');
        liquid.style.backgroundColor = currentGame.selectedIngredient.color;
        
        // Bottle animation
        const animContainer = document.getElementById('pour-animation-container');
        animContainer.innerHTML = `<div class="pouring-bottle" style="background: ${currentGame.selectedIngredient.color}; height: 10px; width: 40px; border-radius: 5px; transform-origin: left; animation: pour 0.5s forwards;"></div>`;
    }

    function stopPouring() {
        if (!currentGame.isPouring) return;
        currentGame.isPouring = false;
        const duration = (Date.now() - currentGame.pourStartTime) / 1000;
        
        currentGame.pouredIngredients.push({
            name: currentGame.selectedIngredient.name,
            duration: duration
        });

        // Update visual height
        const liquid = document.getElementById('liquid-layer');
        let currentHeight = parseFloat(liquid.style.height) || 0;
        currentHeight += duration * 10; // 1 second = 10% height
        if (currentHeight > 95) currentHeight = 95;
        liquid.style.height = `${currentHeight}%`;
        
        document.getElementById('pour-animation-container').innerHTML = '';
    }

    function toggleLemon() {
        const btn = document.getElementById('add-lemon-btn');
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
            addDecoration('lemon');
        } else {
            removeDecoration('lemon');
        }
    }

    function toggleStick() {
        const btn = document.getElementById('add-stick-btn');
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
            addDecoration('stick');
        } else {
            removeDecoration('stick');
        }
    }

    function addDecoration(type) {
        const container = document.getElementById('decorations-container');
        if (type === 'lemon') {
            const lemon = document.createElement('div');
            lemon.id = 'decor-lemon';
            lemon.className = 'decor-item';
            lemon.style.position = 'absolute';
            lemon.style.right = '-10px';
            lemon.style.top = '10px';
            lemon.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40"><path d="M0,20 A20,20 0 1,1 40,20 L20,20 Z" fill="yellow" stroke="gold"/></svg>`;
            container.appendChild(lemon);
            currentGame.addedDecorations.push('lemon');
        } else if (type === 'stick') {
            const stick = document.createElement('div');
            stick.id = 'decor-stick';
            stick.className = 'decor-item';
            stick.style.position = 'absolute';
            stick.style.left = '50%';
            stick.style.bottom = '0';
            stick.style.height = '240px';
            stick.style.width = '4px';
            stick.style.background = 'blue';
            stick.style.transform = 'rotate(10deg)';
            stick.innerHTML = `
                <div style="position:absolute; top:0; left:-3px; width:10px; height:10px; border-radius:50%; background:blue;"></div>
                <div style="position:absolute; bottom:0; left:-8px; width:20px; height:20px; border-radius:50%; background:blue; opacity:0.5;"></div>
            `;
            container.appendChild(stick);
            currentGame.addedDecorations.push('stick');
        }
    }

    function removeDecoration(type) {
        const el = document.getElementById(`decor-${type}`);
        if (el) el.remove();
        currentGame.addedDecorations = currentGame.addedDecorations.filter(d => d !== type);
    }

    function addTopping(type) {
        // Just visual for now
        const container = document.getElementById('decorations-container');
        const item = document.createElement('div');
        item.className = `topping-${type}`;
        item.style.position = 'absolute';
        item.style.left = `${Math.random() * 60 + 20}%`;
        item.style.top = `${Math.random() * 40 + 20}%`;
        
        if (type === 'ice') {
            item.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30"><rect width="25" height="25" fill="rgba(200,240,255,0.6)" stroke="white"/></svg>`;
        } else if (type === 'mint') {
            item.innerHTML = `<svg width="25" height="25" viewBox="0 0 24 24"><path d="M12,2 Q15,10 22,12 Q15,14 12,22 Q9,14 2,12 Q9,10 12,2" fill="green"/></svg>`;
        }
        
        container.appendChild(item);
        currentGame.addedToppings.push(type);
    }

    initCocktailGame();

    // === Levenshtein Distance for Answer Verification ===
    function getLevenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function checkSimilarity(input, target) {
        const cleanInput = input.toLowerCase().trim();
        const cleanTarget = target.toLowerCase().trim();
        if (cleanInput === cleanTarget) return true;
        const distance = getLevenshteinDistance(cleanInput, cleanTarget);
        const maxLength = Math.max(cleanInput.length, cleanTarget.length);
        const similarity = 1 - distance / maxLength;
        return similarity >= 0.7;
    }

    // === Quiz Logic ===
    let allQuestions = [];
    let currentQuestions = []; // Questions for the current round
    let currentIndex = 0;
    let wrongAnswers = [];
    let isReviewMode = false;
    let currentSessionData = null;
    let quizType = 'names'; // 'names', 'descriptions', or 'random'
    let currentOptions = [];
    let currentOptionIndex = 0;
    let namesQuestions = [];
    let descriptionsQuestions = [];
    
    const DESCRIPTION_CATEGORIES = [
        { key: 'color', label: 'Цвет' },
        { key: 'aroma', label: 'Аромат' },
        { key: 'taste', label: 'Вкус' },
        { key: 'country', label: 'Страна производства' },
        { key: 'base', label: 'Основа производства' },
        { key: 'suggestion', label: 'Предложение напитка' },
        { key: 'temperature', label: 'Температура подачи' }
    ];

    // Load quiz data
    async function loadQuiz(type) {
        quizType = type;
        const sessionKey = type === 'names' ? 'wine_names_session' : 
                          (type === 'descriptions' ? 'wine_descriptions_session' : 'wine_random_session');
        
        try {
            if (type === 'names' || type === 'random') {
                const response = await fetch('data/wine_names.json');
                namesQuestions = await response.json();
                namesQuestions.forEach(q => q.type = 'names');
            }
            
            if (type === 'descriptions' || type === 'random' || type === 'cocktails') {
                const response = await fetch('data/wine_descriptions.json');
                descriptionsQuestions = await response.json();
                descriptionsQuestions.forEach(q => {
                    q.type = 'descriptions';
                    
                    // Parse categories from description if they are missing
                    if (q.description) {
                        const colorMatch = q.description.match(/Цвет:\s*(.*?)(?=\n|$)/i);
                        const aromaMatch = q.description.match(/Аромат:\s*(.*?)(?=\n|$)/i);
                        const tasteMatch = q.description.match(/Вкус:\s*(.*?)(?=\n|$)/i);
                        const countryMatch = q.description.match(/Страна производства:\s*(.*?)(?=\n|$)/i);
                        const baseMatch = q.description.match(/Основа производства:\s*(.*?)(?=\n|$)/i);
                        const suggestionMatch = q.description.match(/Предложение напитка:\s*(.*?)(?=\n|$)/i);
                        const tempMatch = q.description.match(/Температура подачи:\s*(.*?)(?=\n|$)/i);
                        
                        if (colorMatch && !q.color) q.color = colorMatch[1].trim();
                        if (aromaMatch && !q.aroma) q.aroma = aromaMatch[1].trim();
                        if (tasteMatch && !q.taste) q.taste = tasteMatch[1].trim();
                        if (countryMatch && !q.country) q.country = countryMatch[1].trim();
                        if (baseMatch && !q.base) q.base = baseMatch[1].trim();
                        if (suggestionMatch && !q.suggestion) q.suggestion = suggestionMatch[1].trim();
                        if (tempMatch && !q.temperature) q.temperature = tempMatch[1].trim();
                    }
                });
            }
            
            if (type === 'cocktails') {
                showCocktailMenu();
                showScreen('cocktails-screen');
                return;
            }

            if (type === 'names') {
                allQuestions = namesQuestions;
            } else if (type === 'descriptions') {
                allQuestions = descriptionsQuestions;
            } else {
                // Random mode: combine
                allQuestions = [...namesQuestions, ...descriptionsQuestions];
            }
            
            // Try to resume session
            const savedSession = localStorage.getItem(sessionKey);
            if (savedSession) {
                currentSessionData = JSON.parse(savedSession);
                // Verify session: for random mode we check if it's 15 questions, otherwise full list
                const expectedLength = type === 'random' ? 15 : allQuestions.length;
                if (currentSessionData.currentQuestions && 
                   (type === 'random' ? currentSessionData.currentQuestions.length <= 15 : currentSessionData.currentQuestions.length === allQuestions.length)) {
                    resumeSession(sessionKey);
                } else {
                    startNewQuiz(sessionKey);
                }
            } else {
                startNewQuiz(sessionKey);
            }
            
            // Update title
            let title = 'Тестирование';
            if (type === 'names') title = 'Наименования';
            if (type === 'descriptions') title = 'Описания';
            if (type === 'random') title = 'Все подряд';
            document.getElementById('quiz-title').textContent = title;
            
            showScreen('quiz-screen');
        } catch (error) {
            console.error("Failed to load questions", error);
        }
    }

    function startNewQuiz(sessionKey) {
        isReviewMode = false;
        wrongAnswers = [];
        currentIndex = 0;
        
        let questionsToUse = [...allQuestions];
        
        // Randomize question mode for names
        questionsToUse.forEach(q => {
            if (q.type === 'names') {
                q.questionMode = Math.random() > 0.5 ? 'choice' : 'input';
            }
        });
        
        if (quizType === 'random') {
            currentQuestions = shuffleArray(questionsToUse).slice(0, 15);
        } else {
            currentQuestions = shuffleArray(questionsToUse);
        }
        
        saveSession(sessionKey);
        renderQuestion();
    }

    function resumeSession(sessionKey) {
        isReviewMode = currentSessionData.isReviewMode || false;
        wrongAnswers = currentSessionData.wrongAnswers || [];
        currentIndex = currentSessionData.currentIndex || 0;
        currentQuestions = currentSessionData.currentQuestions;
        renderQuestion();
    }

    function saveSession(sessionKey) {
        let key = sessionKey;
        if (!key) {
            if (quizType === 'names') key = 'wine_names_session';
            else if (quizType === 'descriptions') key = 'wine_descriptions_session';
            else key = 'wine_random_session';
        }

        const sessionData = {
            currentIndex,
            currentQuestions,
            wrongAnswers,
            isReviewMode,
            lastUpdated: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(sessionData));
    }

    function clearSession() {
        let key = '';
        if (quizType === 'names') key = 'wine_names_session';
        else if (quizType === 'descriptions') key = 'wine_descriptions_session';
        else key = 'wine_random_session';
        localStorage.removeItem(key);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    async function renderQuestion() {
        const questionContainer = document.querySelector('.quiz-question-container');
        
        if (currentIndex >= currentQuestions.length) {
            showResults();
            return;
        }

        // Apply fade-out
        questionContainer.classList.add('fade-out');
        questionContainer.classList.remove('fade-in');

        const question = currentQuestions[currentIndex];
        const isNameQuestion = quizType === 'names' || (quizType === 'random' && question.type === 'names');
        const nextImageUrl = isNameQuestion ? `img/no_lable/${question.image}` : question.image;

        // Preload image
        const imgPreload = new Image();
        const imageLoaded = new Promise((resolve) => {
            imgPreload.onload = resolve;
            imgPreload.onerror = resolve; // Continue even if image fails
        });
        imgPreload.src = nextImageUrl;

        // Wait for both animation (fade-out) and image preloading
        await Promise.all([
            new Promise(resolve => setTimeout(resolve, 300)),
            imageLoaded
        ]);

        if (isNameQuestion) {
            questionText.textContent = question.question;
            questionImage.src = nextImageUrl;
            
            optionsContainer.innerHTML = '';
            
            if (question.questionMode === 'choice') {
                // Prepare options: correct answer + 3 random others
                let options = [question.answer];
                const otherAnswers = namesQuestions
                    .filter(q => q.answer !== question.answer)
                    .map(q => q.answer);
                
                const shuffledOthers = shuffleArray(otherAnswers);
                options = options.concat(shuffledOthers.slice(0, 3));
                options = shuffleArray(options);

                options.forEach(option => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn';
                    btn.textContent = option;
                    btn.addEventListener('click', () => handleAnswer(option, btn));
                    optionsContainer.appendChild(btn);
                });
            } else {
                // Input mode
                const inputContainer = document.createElement('div');
                inputContainer.className = 'answer-input-container';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'answer-input';
                input.placeholder = 'Введите наименование...';
                
                const submitBtn = document.createElement('button');
                submitBtn.className = 'submit-answer-btn';
                submitBtn.textContent = 'Отправить';
                
                const handleSubmit = () => {
                    const val = input.value;
                    if (val.trim()) {
                        handleAnswer(val, submitBtn, input);
                    }
                };
                
                submitBtn.addEventListener('click', handleSubmit);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleSubmit();
                });
                
                inputContainer.appendChild(input);
                inputContainer.appendChild(submitBtn);
                optionsContainer.appendChild(inputContainer);
                input.focus();
            }
        } else {
            // Logic for 'descriptions'
            // Pick random category
            const category = DESCRIPTION_CATEGORIES[Math.floor(Math.random() * DESCRIPTION_CATEGORIES.length)];
            question.currentCategory = category;
            
            questionText.textContent = `${question.name} (${category.label})`;
            questionImage.src = nextImageUrl;
            
            // Prepare 3 options of the SAME category
            const correctAnswer = question[category.key];
            
            // If correctAnswer is missing, we should probably pick another category or skip
            // For now, let's ensure we have a fallback
            const actualCorrectAnswer = correctAnswer || "Информация отсутствует";
            let options = [actualCorrectAnswer];
            
            const otherAnswers = descriptionsQuestions
                .filter(q => q.id !== question.id)
                .map(q => q[category.key])
                .filter(val => {
                    if (!val) return false;
                    const cleanVal = val.trim();
                    return cleanVal !== "" && cleanVal.toLowerCase() !== actualCorrectAnswer.trim().toLowerCase();
                });
            
            const uniqueOthers = [...new Set(otherAnswers)];
            const shuffledOthers = shuffleArray(uniqueOthers);
            options = options.concat(shuffledOthers.slice(0, 3)); 
            currentOptions = shuffleArray(options);
            currentOptionIndex = 0;

            renderDescriptionSwitcher();
        }

        // Update progress bar
        const progress = (currentIndex / currentQuestions.length) * 100;
        quizProgressFill.style.width = `${progress}%`;
        
        quizContainer.style.display = 'flex';
        resultsContainer.style.display = 'none';

        // Apply fade-in
        questionContainer.classList.remove('fade-out');
        questionContainer.classList.add('fade-in');
    }

    function renderDescriptionSwitcher() {
        optionsContainer.innerHTML = '';
        
        const switcher = document.createElement('div');
        switcher.className = 'description-switcher';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'switch-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = () => {
            currentOptionIndex = (currentOptionIndex - 1 + currentOptions.length) % currentOptions.length;
            renderDescriptionSwitcher();
        };
        
        const optionDisplay = document.createElement('div');
        optionDisplay.className = 'description-option';
        optionDisplay.innerText = currentOptions[currentOptionIndex];
        optionDisplay.onclick = () => handleAnswer(currentOptions[currentOptionIndex], optionDisplay);
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'switch-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => {
            currentOptionIndex = (currentOptionIndex + 1) % currentOptions.length;
            renderDescriptionSwitcher();
        };
        
        switcher.appendChild(prevBtn);
        switcher.appendChild(optionDisplay);
        switcher.appendChild(nextBtn);
        
        optionsContainer.appendChild(switcher);

        const confirmHint = document.createElement('p');
        confirmHint.style.textAlign = 'center';
        confirmHint.style.fontSize = '12px';
        confirmHint.style.marginTop = '10px';
        confirmHint.style.color = '#7f8c8d';
        confirmHint.textContent = 'Нажмите на описание, чтобы выбрать его';
        optionsContainer.appendChild(confirmHint);
    }

    function handleAnswer(selectedOption, btn, inputField = null) {
        const question = currentQuestions[currentIndex];
        const isNameQuestion = quizType === 'names' || (quizType === 'random' && question.type === 'names');
        
        let isCorrect = false;
        let correctAnswer = "";

        if (isNameQuestion) {
            correctAnswer = question.answer;
            if (question.questionMode === 'choice') {
                isCorrect = selectedOption === correctAnswer;
            } else {
                isCorrect = checkSimilarity(selectedOption, correctAnswer);
                // In input mode, show the correct name anyway
                if (inputField) {
                    inputField.value = correctAnswer;
                    inputField.disabled = true;
                }
            }
            // Change image to labeled version
            questionImage.src = `img/lable/${question.image}`;
        } else {
            correctAnswer = question[question.currentCategory.key];
            isCorrect = selectedOption === correctAnswer;
        }
        
        // Disable interaction
        optionsContainer.style.pointerEvents = 'none';

        if (isCorrect) {
            btn.classList.add('correct');
        } else {
            btn.classList.add('wrong');
            if (isNameQuestion && question.questionMode === 'choice') {
                const allOptionBtns = optionsContainer.querySelectorAll('.option-btn');
                allOptionBtns.forEach(b => {
                    if (b.textContent === correctAnswer) {
                        b.classList.add('correct');
                    }
                });
            } else if (!isNameQuestion) {
                // For descriptions, find the correct answer in currentOptions and show it if possible
                // Since it's a switcher, it's better to just show a toast or highlight after a delay
                showToast(`Неверно. Правильный ответ: ${correctAnswer || actualCorrectAnswer}`);
            }
            if (!wrongAnswers.find(q => q.id === question.id && q.type === question.type)) {
                wrongAnswers.push(question);
            }
        }

        // Wait before next question
        setTimeout(() => {
            optionsContainer.style.pointerEvents = 'all';
            currentIndex++;
            saveSession();
            renderQuestion();
        }, 2000);
    }

    function showResults() {
        quizContainer.style.display = 'none';
        resultsContainer.style.display = 'flex';
        quizProgressFill.style.width = '100%';

        const resultsIcon = resultsContainer.querySelector('.results-icon');
        const resultsScore = resultsContainer.querySelector('.results-score');
        const resultsText = resultsContainer.querySelector('.results-text');
        const retryBtn = document.getElementById('retry-btn');

        if (wrongAnswers.length === 0) {
            resultsIcon.innerHTML = '<i class="fas fa-trophy" style="font-size: 48px; color: #f1c40f;"></i>';
            resultsScore.textContent = 'Отлично!';
            resultsText.textContent = isReviewMode 
                ? 'Вы исправили все ошибки!' 
                : 'Вы ответили на все вопросы правильно!';
            retryBtn.textContent = 'Начать заново';
            isReviewMode = false;
            clearSession();
        } else {
            resultsIcon.innerHTML = '<i class="fas fa-chart-line" style="font-size: 48px; color: #3498db;"></i>';
            resultsScore.textContent = `Ошибок: ${wrongAnswers.length}`;
            resultsText.textContent = 'Нужно повторить вопросы, в которых вы допустили ошибки.';
            retryBtn.textContent = 'Работа над ошибками';
        }
    }

    // === Menu & Buttons Events ===
    
    // Submenu item "Наименования"
    const wineNamesBtn = document.getElementById('wine-names-btn');
    if (wineNamesBtn) {
        wineNamesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadQuiz('names');
        });
    }

    // Submenu item "Описания"
    const wineDescriptionsBtn = document.getElementById('wine-descriptions-btn');
    if (wineDescriptionsBtn) {
        wineDescriptionsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadQuiz('descriptions');
        });
    }

    // Submenu item "Все подряд"
    const randomQuizBtn = document.getElementById('random-quiz-btn');
    if (randomQuizBtn) {
        randomQuizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadQuiz('random');
        });
    }

    // Quiz Menu Trigger
    if (menuTriggerBtn) {
        menuTriggerBtn.addEventListener('click', () => {
            quizMenuOverlay.classList.add('active');
        });
    }

    // Quiz Menu Actions
    document.getElementById('resume-quiz').addEventListener('click', () => {
        quizMenuOverlay.classList.remove('active');
    });

    document.getElementById('restart-quiz').addEventListener('click', () => {
        quizMenuOverlay.classList.remove('active');
        startNewQuiz();
    });

    document.getElementById('exit-quiz').addEventListener('click', () => {
        quizMenuOverlay.classList.remove('active');
        showScreen('main-screen');
    });

    // Results Retry Button
    document.getElementById('retry-btn').addEventListener('click', () => {
        if (wrongAnswers.length > 0) {
            // Error correction mode
            isReviewMode = true;
            currentQuestions = shuffleArray([...wrongAnswers]);
            wrongAnswers = [];
            currentIndex = 0;
            saveSession();
            renderQuestion();
        } else {
            startNewQuiz();
        }
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.closest('#quiz-screen')) {
                saveSession();
            }
        });
    });

    function updateMainScreenStatus() {
        // Optional: show "Continue" badge or similar if session exists
    }

    // Handle touch events to prevent zoom
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
});
