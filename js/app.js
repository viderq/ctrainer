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

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetScreenId = this.getAttribute('data-screen');
            if (targetScreenId) showScreen(targetScreenId);
        });
    });

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
            
            if (type === 'descriptions' || type === 'random') {
                const response = await fetch('data/wine_descriptions.json');
                descriptionsQuestions = await response.json();
                descriptionsQuestions.forEach(q => q.type = 'descriptions');
            }

            if (type === 'names') {
                allQuestions = namesQuestions;
            } else if (type === 'descriptions') {
                allQuestions = descriptionsQuestions;
            } else {
                // Random mode: combine and pick 15
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
        
        if (quizType === 'random') {
            currentQuestions = shuffleArray([...allQuestions]).slice(0, 15);
        } else {
            currentQuestions = shuffleArray([...allQuestions]);
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
            
            // Prepare options: correct answer + 3 random others
            let options = [question.answer];
            const otherAnswers = namesQuestions
                .filter(q => q.answer !== question.answer)
                .map(q => q.answer);
            
            const shuffledOthers = shuffleArray(otherAnswers);
            options = options.concat(shuffledOthers.slice(0, 3));
            options = shuffleArray(options);

            optionsContainer.innerHTML = '';
            options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option;
                btn.addEventListener('click', () => handleAnswer(option, btn));
                optionsContainer.appendChild(btn);
            });
        } else {
            // Logic for 'descriptions'
            questionText.textContent = question.name; // Название над картинкой
            questionImage.src = nextImageUrl; // Изображение из lable (так как в описаниях img-lable)
            
            // Prepare 3 options
            let options = [question.description];
            const otherDescriptions = descriptionsQuestions
                .filter(q => q.description !== question.description)
                .map(q => q.description);
            
            const shuffledOthers = shuffleArray(otherDescriptions);
            options = options.concat(shuffledOthers.slice(0, 2));
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

    function handleAnswer(selectedOption, btn) {
        const question = currentQuestions[currentIndex];
        const isNameQuestion = quizType === 'names' || (quizType === 'random' && question.type === 'names');
        const correctAnswer = isNameQuestion ? question.answer : question.description;
        const isCorrect = selectedOption === correctAnswer;
        
        // Disable interaction
        optionsContainer.style.pointerEvents = 'none';

        if (isNameQuestion) {
            // Change image to labeled version
            questionImage.src = `img/lable/${question.image}`;
            
            const allOptionBtns = optionsContainer.querySelectorAll('.option-btn');
            if (isCorrect) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
                allOptionBtns.forEach(b => {
                    if (b.textContent === correctAnswer) {
                        b.classList.add('correct');
                    }
                });
                if (!wrongAnswers.find(q => q.id === question.id && q.type === question.type)) {
                    wrongAnswers.push(question);
                }
            }
        } else {
            // Descriptions logic
            if (isCorrect) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
                // Could show correct one, but we have a switcher. 
                // Let's just highlight it for a bit.
                if (!wrongAnswers.find(q => q.id === question.id && q.type === question.type)) {
                    wrongAnswers.push(question);
                }
            }
        }

        // Wait before next question
        setTimeout(() => {
            optionsContainer.style.pointerEvents = 'all';
            currentIndex++;
            saveSession();
            renderQuestion();
        }, 1500);
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
