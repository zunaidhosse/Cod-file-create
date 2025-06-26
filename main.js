document.addEventListener('DOMContentLoaded', () => {
    const codeEditor = document.getElementById('codeEditor');
    const filenameSelect = document.getElementById('filenameSelect');
    const downloadButton = document.getElementById('downloadButton');
    const resetButton = document.getElementById('resetButton');
    const searchInput = document.getElementById('searchInput');

    // Custom Message Box Elements
    const customMessageBox = document.getElementById('customMessageBox');
    const messageBoxText = document.getElementById('messageBoxText');
    const messageBoxClose = document.getElementById('messageBoxClose');

    // PWA Install Button Elements
    const installPromptContainer = document.getElementById('installPromptContainer');
    const installButton = document.getElementById('installButton');
    let deferredPrompt; // এই ভেরিয়েবলে beforeinstallprompt ইভেন্টটি স্টোর করা হবে

    // কাস্টম মেসেজ বক্স দেখানোর ফাংশন
    function showMessage(message) {
        messageBoxText.textContent = message;
        customMessageBox.classList.remove('hidden');
    }

    // কাস্টম মেসেজ বক্স লুকানোর ফাংশন
    messageBoxClose.addEventListener('click', () => {
        customMessageBox.classList.add('hidden');
    });

    // লোড হলে ডিফল্ট ফাইলনাম নির্বাচন করুন
    filenameSelect.value = 'index.html';

    // ফাইল ডাউনলোড ফাংশন
    downloadButton.addEventListener('click', () => {
        const codeContent = codeEditor.value;
        const filename = filenameSelect.value;

        if (!filename) {
            showMessage('দয়া করে একটি ফাইল নাম নির্বাচন করুন।');
            return;
        }

        if (!codeContent.trim()) {
            showMessage('ডাউনলোড করার জন্য কোনো কোড নেই।');
            return;
        }

        // UTF-8 BOM (Byte Order Mark) যোগ করুন
        // এটি কিছু অ্যাপ্লিকেশনকে UTF-8 এনকোডিং সঠিকভাবে চিনতে সাহায্য করে।
        const utf8Bom = '\ufeff'; // U+FEFF হল BOM ক্যারেক্টার

        // একটি ব্লব তৈরি করুন, স্পষ্টভাবে UTF-8 এনকোডিং উল্লেখ করে এবং BOM সহ
        const blob = new Blob([utf8Bom + codeContent], { type: 'text/plain;charset=utf-8' });

        // একটি অস্থায়ী লিংক তৈরি করুন
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename; // ডাউনলোড করার সময় ফাইলের নাম

        // প্রোগ্রাম্যাটিকভাবে লিংক ক্লিক করুন
        document.body.appendChild(a);
        a.click();

        // অবজেক্ট URL থেকে মেমরি মুক্ত করুন
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        // সফল মেসেজ দেখান (ঐচ্ছিক)
        // showMessage(`${filename} সফলভাবে ডাউনলোড হয়েছে!`);
    });

    // রিসেট ফাংশন
    resetButton.addEventListener('click', () => {
        codeEditor.value = ''; // টেক্সটএরিয়া খালি করুন
        filenameSelect.value = 'index.html'; // ডিফল্ট ফাইল নির্বাচন করুন
        searchInput.value = ''; // সার্চ ইনপুট খালি করুন
        codeEditor.focus(); // টেক্সটএরিয়াতে ফোকাস করুন
        // রিসেট করার পর লোকাল স্টোরেজ থেকেও ডাটা মুছে দিন
        localStorage.removeItem('codeEditorContent');
        localStorage.removeItem('selectedFilename');
    });

    // সার্চ ফাংশন
    const performSearch = () => {
        const query = searchInput.value;
        const text = codeEditor.value;

        if (!query) {
            // কোয়েরি খালি হলে কোনো হাইলাইট সরাবেন না, শুধু ফোকাস করুন
            codeEditor.focus();
            return;
        }

        const startIndex = text.indexOf(query);

        if (startIndex !== -1) {
            // টেক্সট পাওয়া গেলে হাইলাইট করুন এবং স্ক্রল করুন
            codeEditor.focus();
            codeEditor.setSelectionRange(startIndex, startIndex + query.length);
            // ব্রাউজার স্বয়ংক্রিয়ভাবে নির্বাচিত অংশটি ভিউতে স্ক্রল করবে
        } else {
            showMessage(`"${query}" পাওয়া যায়নি।`);
        }
    };

    // সার্চ ইনপুটে এন্টার চাপলে অনুসন্ধান করুন
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // ফর্ম জমা দেওয়া প্রতিরোধ করুন
            performSearch();
        }
    });

    // ভাষার ধরণ সনাক্তকরণ ফাংশন
    function detectLanguage(code) {
        code = code.trim();
        if (!code) return '';

        // HTML সনাক্ত করুন
        if (/<html|<!DOCTYPE html|<body|<div|<p|<a|<img|<h1|<script/i.test(code)) {
            return 'index.html';
        }

        // CSS সনাক্ত করুন
        if (/{|}|;|color:|font-size:|padding:|margin:|display:|width:|height:|border:|background-color:/i.test(code)) {
            return 'style.css';
        }

        // JavaScript সনাক্ত করুন
        // আরো নির্দিষ্ট কীওয়ার্ড যোগ করা হয়েছে
        if (/\bfunction\b|\bconst\b|\blet\b|\bvar\b|console\.log|return\s*\(|\basync\b|\bawait\b|\bclass\b|\bimport\b|\bexport\b/i.test(code)) {
            return 'script.js';
        }

        return ''; // কোনো নির্দিষ্ট ভাষা সনাক্ত করা যায়নি
    }

    // টেক্সটএরিয়ার আকার পরিবর্তন হলে সেটির বিষয়বস্তু এবং নির্বাচিত ফাইলের নাম লোকাল স্টোরেজে সংরক্ষণ করুন
    // এবং স্বয়ংক্রিয়ভাবে ফাইলের নাম নির্বাচন করুন
    codeEditor.addEventListener('input', () => {
        // যদি ব্যবহারকারী কোনো ফাইল নাম নির্বাচন না করে থাকেন, তবে স্বয়ংক্রিয়ভাবে সনাক্ত করুন
        if (filenameSelect.value === '') {
            const detectedFilename = detectLanguage(codeEditor.value);
            if (detectedFilename) {
                filenameSelect.value = detectedFilename;
            }
        }
        saveState(); // যেকোনো পরিবর্তনের পরে স্টেট সেভ করুন
    });
    
    filenameSelect.addEventListener('change', saveState);

    function saveState() {
        localStorage.setItem('codeEditorContent', codeEditor.value);
        localStorage.setItem('selectedFilename', filenameSelect.value);
    }

    // যখন পৃষ্ঠা লোড হয়, লোকাল স্টোরেজ থেকে বিষয়বস্তু পুনরুদ্ধার করুন
    function loadState() {
        const savedContent = localStorage.getItem('codeEditorContent');
        const savedFilename = localStorage.getItem('selectedFilename');

        if (savedContent) {
            codeEditor.value = savedContent;
        }
        if (savedFilename) {
            filenameSelect.value = savedFilename;
        } else {
            // যদি কোনো সেভ করা ফাইল নাম না থাকে, তবে লোড হওয়ার সময় কোডের উপর ভিত্তি করে সনাক্ত করুন
            const detectedFilename = detectLanguage(codeEditor.value);
            if (detectedFilename) {
                filenameSelect.value = detectedFilename;
            }
        }
    }

    loadState(); // পৃষ্ঠা লোড হওয়ার সময় স্টেট লোড করুন

    // --- PWA ইনস্টলেশন লজিক ---

    // সার্ভিস ওয়ার্কার রেজিস্টার করুন
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // যদি বর্তমান প্রোটোকল 'blob:' হয়, তবে সতর্ক করুন যে PWA বৈশিষ্ট্যগুলি কাজ নাও করতে পারে।
            if (window.location.protocol === 'blob:') {
                console.warn('Warning: Service Worker registration might fail in this preview environment due to "blob:" protocol. PWA features (offline, install) will work when deployed to a proper web server (e.g., GitHub Pages).');
            }

            navigator.serviceWorker.register('/service-worker.js')
                .then((registration) => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch((error) => {
                    // সার্ভিস ওয়ার্কার নিবন্ধন ব্যর্থ হলে আরও নির্দিষ্ট ত্রুটি বার্তা প্রদর্শন করুন
                    console.error('Service Worker registration failed. This might be due to environment limitations or the URL protocol:', error);
                });
        });
    }

    // beforeinstallprompt ইভেন্ট শুনুন
    window.addEventListener('beforeinstallprompt', (e) => {
        // ইনস্টল প্রম্পট ইভেন্টটি সংরক্ষণ করুন
        deferredPrompt = e;
        // ইনস্টল বাটন দেখান
        installPromptContainer.classList.remove('hidden');
        console.log('beforeinstallprompt fired');
    });

    // ইনস্টল বাটনে ক্লিক হ্যান্ডেল করুন
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            // ইনস্টল প্রম্পট দেখান
            deferredPrompt.prompt();
            // ব্যবহারকারীর প্রতিক্রিয়া পাওয়ার জন্য অপেক্ষা করুন
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // ইনস্টল বাটন লুকান কারণ প্রম্পট দেখানো হয়েছে
            installPromptContainer.classList.add('hidden');
            deferredPrompt = null; // প্রম্পট ব্যবহার করার পর এটিকে রিসেট করুন
        }
    });

    // অ্যাপ সফলভাবে ইনস্টল হলে
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        // ইনস্টল বাটন লুকান (যদি এটি তখনও দৃশ্যমান থাকে)
        installPromptContainer.classList.add('hidden');
        showMessage('অ্যাপটি সফলভাবে ইনস্টল হয়েছে!');
    });
});
