const CACHE_NAME = 'pwa-code-editor-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/main.js', // main.js ফাইলটি ক্যাশে করার জন্য এখানে অন্তর্ভুক্ত করা হয়েছে
    '/manifest.json',
    // আপনার আইকনগুলির পাথ আপডেট করা হয়েছে
    '/icon-192.png',
    '/icon-512.png'
];

// 'install' ইভেন্ট: যখন সার্ভিস ওয়ার্কার ইনস্টল হয়
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 'fetch' ইভেন্ট: যখন অ্যাপ কোনো ফাইল অনুরোধ করে
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // ক্যাশে পাওয়া গেলে, ক্যাশে থেকে সাড়া দিন
                if (response) {
                    return response;
                }
                // ক্যাশে না পাওয়া গেলে, নেটওয়ার্ক থেকে আনার চেষ্টা করুন
                return fetch(event.request)
                    .then((networkResponse) => {
                        // সফলভাবে নেটওয়ার্ক থেকে আনলে ক্যাশে যোগ করুন (ঐচ্ছিক, তবে নতুন রিসোর্সের জন্য ভালো)
                        return caches.open(CACHE_NAME).then((cache) => {
                            // শুধুমাত্র GET অনুরোধ এবং সফল প্রতিক্রিয়া ক্যাশে করুন
                            if (networkResponse.ok && event.request.method === 'GET') {
                                // প্রতিক্রিয়াটি ক্লোন করুন কারণ একটি প্রতিক্রিয়া শুধুমাত্র একবার ব্যবহার করা যায়
                                cache.put(event.request, networkResponse.clone());
                            }
                            return networkResponse;
                        });
                    })
                    .catch(() => {
                        // নেটওয়ার্ক বা ক্যাশে কোনোটিই পাওয়া না গেলে একটি ফলব্যাক প্রদান করুন
                        // উদাহরণস্বরূপ, একটি অফলাইন পৃষ্ঠা বা একটি খালি প্রতিক্রিয়া
                        // বর্তমানে, এটি শুধুমাত্র একটি ত্রুটি ফেরত দেবে
                        return new Response('Offline content is not available.', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// 'activate' ইভেন্ট: যখন সার্ভিস ওয়ার্কার সক্রিয় হয়
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith('pwa-code-editor-') && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
