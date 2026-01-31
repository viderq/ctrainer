const CACHE_NAME = 'wine-trainer-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './data/wine_names.json',
  './data/wine_descriptions.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  './img/no_lable/Мартини Фиеро.png',
  './img/no_lable/Пинотаж Симонсиг.png',
  './img/no_lable/Шато Тамань Селект Блан Брют.png',
  './img/no_lable/Бифитер.png',
  './img/no_lable/Хайн.png',
  './img/no_lable/Моэт и Шандон Империал Брют.png',
  './img/no_lable/Жигули Барное.png',
  './img/no_lable/Онегин.png',
  './img/no_lable/Солнечный ветер Усадьба Дивноморское.png',
  './img/no_lable/Джин Гордонс.png',
  './img/no_lable/Мартини Бьянко.png',
  './img/no_lable/Такамака блан.png',
  './img/no_lable/Криница Арена.png',
  './img/no_lable/Чивас Ригал.png',
  './img/no_lable/Доу’з Файн Тони.png',
  './img/no_lable/Казаль ди Серра Вердиккио дей Кастелли ди Йези Умани Ронки .png',
  './img/no_lable/Лансон Ле Блэк Креасьон Брют.png',
  './img/no_lable/Доу’з Файн Руби.png',
  './img/no_lable/Фрапен.png',
  './img/lable/Мартини Фиеро.png',
  './img/lable/Пинотаж Симонсиг.png',
  './img/lable/Шато Тамань Селект Блан Брют.png',
  './img/lable/Бифитер.png',
  './img/lable/Хайн.png',
  './img/lable/Шато Тамань СелектБлан Брют.png',
  './img/lable/Моэт и Шандон Империал Брют.png',
  './img/lable/Жигули Барное.png',
  './img/lable/Онегин.png',
  './img/lable/Криница_Арена.png',
  './img/lable/Солнечный ветер Усадьба Дивноморское.png',
  './img/lable/Джин Гордонс.png',
  './img/lable/Мартини Бьянко.png',
  './img/lable/Такамака блан.png',
  './img/lable/Криница Арена.png',
  './img/lable/Чивас Ригал.png',
  './img/lable/Доу’з Файн Тони.png',
  './img/lable/Казаль ди Серра Вердиккио дей Кастелли ди Йези Умани Ронки .png',
  './img/lable/Лансон Ле Блэк Креасьон Брют.png',
  './img/lable/Доу’з Файн Руби.png',
  './img/lable/Фрапен.png',
  './img/lable/Моэт и Шандон ИмпериальБрют.png',
  './img/ico/icon192x192.png',
  './img/ico/icon512x512.png'
];

// Install event - caching assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleaning up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serving from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the stream
            // as well as the cache consuming the stream, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache images from external sources or if they are too many
                // But for this project, we might want to cache them as they are requested
                if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        );
      })
  );
});
