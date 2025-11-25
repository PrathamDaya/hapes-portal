// ===== GLOBAL CONFIGURATION =====
const scriptURL = 'https://script.google.com/macros/s/AKfycbxMsH6HVLcv0yGQBKZCdOwdAUi9k_Jv4JeIOotqicQlef0mP_mIADlEVbUuzS8pPsZ27g/exec';

// Application State
let currentUser = '';
const SCRIPT_USER_KEY = 'hetuAppCurrentUser';
let currentEmotion = '';
let calendarCurrentDate = new Date();
let periodCalendarDate = new Date();
let diaryEntries = {};
let periodData = [];
let usedDares = [];

// ===== COOKING GAME STATE =====
let cookingGameRunning = false;
let cookingScene, cookingCamera, cookingRenderer;
let cookingLoopId;
let cookingRaycaster, cookingMouse;
let cookingInteractables = [];
let cookingScore = 0;
let cookingCash = 0;
let unlockedDishes = { 'burger': true, 'pizza': false };
let activeOrders = [];
let cookingStationState = {
    grill: { active: false, progress: 0, item: null },
    assembly: { bun: false, patty: false },
    oven: { active: false, progress: 0, item: null },
    counter: { item: null }
};
let customers = [];
let lastCustomerTime = 0;

// ===== DYNAMIC TIMELINE LOGIC =====
let timelineData = JSON.parse(localStorage.getItem('hetuTimelineData')) || [
    { date: "2023-01-01", title: "Where it began", img: "assets/Timeline/1.jpg", desc: "The start of us." },
    { date: "2023-02-14", title: "Valentine's", img: "assets/Timeline/2.jpg", desc: "Our first V-day." }
];

// ===== GAME ARCADE VARIABLES =====
const usePhotoAssets = true; 
let memMoves = 0;
let memLock = false;
let memHasFlippedCard = false;
let memFirstCard, memSecondCard;
let catchGameRunning = false;
let catchScore = 0;
let catchLoopId;
let slasherGameRunning = false;
let slasherScore = 0;
let slasherLoopId;
let gameHighScores = { memory: 100, catch: 0, slasher: 0 };
let selectedMood = null;

// ===== DARES LIST =====
const coupleDares = [
    "Give your partner a slow, sensual massage on their neck.",
    "Whisper three things you find sexiest about your partner.",
    "Kiss your partner passionately for at least 60 seconds.",
    "Describe your favorite memory of a passionate moment.",
    "Write 'I want you' with lipstick on your partner's arm.",
    "Give your partner a lap dance.",
    "Share a secret fantasy you've had about your partner.",
    "Let your partner choose a spot on your upper body to kiss.",
    "Blindfold your partner and tease them with light touches."
];

// ==========================================
//            CORE AUTH & NAVIGATION
// ==========================================

function login(userName) {
    if (userName === 'Chikoo' || userName === 'Prath') {
        currentUser = userName;
        localStorage.setItem(SCRIPT_USER_KEY, currentUser);
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
        createFloatingEmojis(); 
        
        // Load persisted cooking cash if available
        const savedCash = localStorage.getItem('hetuCookingCash');
        if(savedCash) cookingCash = parseInt(savedCash);
        
        const savedUnlocks = localStorage.getItem('hetuCookingUnlocks');
        if(savedUnlocks) unlockedDishes = JSON.parse(savedUnlocks);
        
    } else {
        showCustomPopup('Error', 'Invalid user selection.');
    }
}

function logout() {
    currentUser = '';
    localStorage.removeItem(SCRIPT_USER_KEY);
    updateUserDisplay();
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.body.style.alignItems = 'center';
    quitGame(false);
}

function updateUserDisplay() {
    const display = document.getElementById('loggedInUserDisplay');
    if (display) display.textContent = currentUser ? `User: ${currentUser}` : 'User: Not logged in';
    document.querySelectorAll('.dynamicUserName').forEach(el => el.textContent = currentUser || 'User');
}

function checkLoginStatus() {
    const storedUser = localStorage.getItem(SCRIPT_USER_KEY);
    if (storedUser) {
        currentUser = storedUser;
        updateUserDisplay();
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        document.body.style.alignItems = 'flex-start';
        navigateToApp('homeScreen');
    }
    const storedScores = localStorage.getItem('hetuApp_highscores');
    if(storedScores) gameHighScores = JSON.parse(storedScores);
    updateHighScoreDisplays();
}

function navigateToApp(screenId) {
    if (!currentUser && screenId !== 'loginScreen') {
        logout(); return;
    }
    
    // Cleanup any running games
    quitGame(false);

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        
        // Screen specific inits
        if (screenId === 'timelineScreen') renderTimeline();
        else if (screenId === 'diaryScreen') {
            fetchDiaryEntries().then(() => {
                renderCalendar(calendarCurrentDate);
                navigateToDiaryPage('diaryCalendarPage');
            });
        }
        else if (screenId === 'periodTrackerScreen') loadPeriodTracker();
        else if (screenId === 'gameHubScreen') updateHighScoreDisplays();
    }
}

function quitGame(navigate = true) {
    // Stop Arcade Games
    catchGameRunning = false;
    slasherGameRunning = false;
    cancelAnimationFrame(catchLoopId);
    cancelAnimationFrame(slasherLoopId);

    // Stop 3D Game
    cookingGameRunning = false;
    cancelAnimationFrame(cookingLoopId);
    
    if(cookingRenderer && cookingRenderer.domElement) {
        const container = document.getElementById('cookingGameContainer');
        if(container && cookingRenderer.domElement.parentNode === container) {
            container.removeChild(cookingRenderer.domElement);
        }
        cookingRenderer.dispose();
        cookingRenderer = null;
    }
    
    if (navigate) navigateToApp('gameHubScreen');
}

// ==========================================
//           3D COOKING GAME LOGIC
// ==========================================

function startCookingGame() {
    navigateToApp('cookingGameScreen');
    // Slight delay to ensure DOM is ready
    setTimeout(initCookingGame, 100);
}

function initCookingGame() {
    cookingGameRunning = true;
    cookingScore = 0;
    activeOrders = [];
    customers = [];
    cookingInteractables = [];
    
    // Reset Station State
    cookingStationState = {
        grill: { active: false, progress: 0, item: null },
        assembly: { bun: false, patty: false },
        oven: { active: false, progress: 0, item: null },
        counter: { item: null }
    };
    
    updateCookingUI();
    updateOrderPanel();

    const container = document.getElementById('cookingGameContainer');
    
    // 1. Scene
    cookingScene = new THREE.Scene();
    cookingScene.background = new THREE.Color(0x87CEEB); // Sky Blue

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    cookingCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    cookingCamera.position.set(0, 8, 10);
    cookingCamera.lookAt(0, 0, 0);

    // 3. Renderer
    cookingRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    cookingRenderer.setSize(container.clientWidth, container.clientHeight);
    cookingRenderer.shadowMap.enabled = true;
    container.appendChild(cookingRenderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    cookingScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    cookingScene.add(dirLight);

    // 5. Environment
    // Floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    cookingScene.add(floor);
    
    // Wall
    const wallGeo = new THREE.PlaneGeometry(20, 10);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 5, -5);
    wall.receiveShadow = true;
    cookingScene.add(wall);

    // 6. Stations
    // Grill (Left)
    createStationMesh(0xff5555, -3, 0.5, -2, "Grill", "🔥 Grill");
    
    // Assembly (Center)
    createStationMesh(0x55ff55, 0, 0.5, -2, "Assembly", "🍔 Assemble");
    
    // Oven (Right)
    createStationMesh(0x555555, 3, 0.5, -2, "Oven", "🍕 Oven");
    
    // Counter (Front)
    const counterGeo = new THREE.BoxGeometry(10, 1, 1.5);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.5, 2);
    counter.receiveShadow = true;
    counter.userData = { name: "Counter", type: "station" }; // Non-interactable for cooking, just serving
    cookingScene.add(counter);

    // 7. Interaction
    cookingRaycaster = new THREE.Raycaster();
    cookingMouse = new THREE.Vector2();
    cookingRenderer.domElement.addEventListener('mousedown', onCookingClick);
    cookingRenderer.domElement.addEventListener('touchstart', onCookingTouch, {passive: false});

    // Start Loop
    animateCooking();
}

function createStationMesh(color, x, y, z, name, label) {
    const geo = new THREE.BoxGeometry(2, 1, 2);
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { name: name, type: 'station' };
    cookingScene.add(mesh);
    cookingInteractables.push(mesh);
    
    // Simple 3D Text Label logic could go here, but omitted for simplicity/performance
}

function onCookingTouch(event) {
    if(event.touches.length > 0) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = cookingRenderer.domElement.getBoundingClientRect();
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        processClick(clientX, clientY, rect);
    }
}

function onCookingClick(event) {
    const rect = cookingRenderer.domElement.getBoundingClientRect();
    processClick(event.clientX, event.clientY, rect);
}

function processClick(clientX, clientY, rect) {
    if (!cookingGameRunning) return;

    cookingMouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    cookingMouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    cookingRaycaster.setFromCamera(cookingMouse, cookingCamera);
    
    // 1. Check Station Clicks
    const stationIntersects = cookingRaycaster.intersectObjects(cookingInteractables);
    if (stationIntersects.length > 0) {
        const obj = stationIntersects[0].object;
        handleStationInteraction(obj.userData.name);
        return;
    }

    // 2. Check Customer Clicks (Serving)
    const customerMeshes = customers.map(c => c.mesh);
    const customerIntersects = cookingRaycaster.intersectObjects(customerMeshes);
    if (customerIntersects.length > 0) {
        const customerMesh = customerIntersects[0].object;
        serveCustomer(customerMesh.userData.id);
    }
}

function handleStationInteraction(stationName) {
    if (stationName === "Grill") {
        if (!cookingStationState.grill.active && !cookingStationState.grill.item) {
            // Start Cooking
            cookingStationState.grill.active = true;
            cookingStationState.grill.progress = 0;
            addFoodMeshToStation('raw_patty', -3, 1.1, -2, 'grill_item');
        } else if (cookingStationState.grill.item === 'cooked_patty') {
            // Move to Assembly
            if (!cookingStationState.assembly.patty) {
                cookingStationState.assembly.patty = true;
                removeObjectByName('grill_item');
                cookingStationState.grill.item = null;
                updateAssemblyVisuals();
            } else {
                showCustomPopup("Info", "Assembly station already has a patty!");
            }
        }
    } else if (stationName === "Assembly") {
        if (!cookingStationState.assembly.bun) {
            // Add Bun
            cookingStationState.assembly.bun = true;
            updateAssemblyVisuals();
        } else if (cookingStationState.assembly.bun && cookingStationState.assembly.patty) {
            // Finish Burger
            if (!cookingStationState.counter.item) {
                cookingStationState.counter.item = 'burger';
                cookingStationState.assembly.bun = false;
                cookingStationState.assembly.patty = false;
                removeObjectByName('assembly_visual');
                addFoodMeshToStation('burger', 0, 1.2, 2, 'counter_item');
            } else {
                showCustomPopup("Info", "Counter is full! Serve the customer first.");
            }
        }
    } else if (stationName === "Oven") {
        if (!unlockedDishes.pizza) {
            showCustomPopup("Locked", "Unlock Pizza for $100!");
            return;
        }
        if (!cookingStationState.oven.active && !cookingStationState.oven.item) {
            // Start Pizza
            cookingStationState.oven.active = true;
            cookingStationState.oven.progress = 0;
            addFoodMeshToStation('raw_pizza', 3, 1.1, -2, 'oven_item');
        } else if (cookingStationState.oven.item === 'cooked_pizza') {
            // Serve Pizza
            if (!cookingStationState.counter.item) {
                cookingStationState.counter.item = 'pizza';
                removeObjectByName('oven_item');
                cookingStationState.oven.item = null;
                addFoodMeshToStation('pizza', 0, 1.2, 2, 'counter_item');
            } else {
                showCustomPopup("Info", "Counter is full!");
            }
        }
    }
}

function addFoodMeshToStation(type, x, y, z, name) {
    let geo, mat, mesh;
    if (type === 'raw_patty') {
        geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
        mat = new THREE.MeshStandardMaterial({ color: 0xffaaaa }); // Pink
        mesh = new THREE.Mesh(geo, mat);
    } else if (type === 'burger') {
        const group = new THREE.Group();
        const bun1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 32), new THREE.MeshStandardMaterial({color: 0xDAA520}));
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32), new THREE.MeshStandardMaterial({color: 0x8B4513}));
        patty.position.y = 0.1;
        const bun2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 32), new THREE.MeshStandardMaterial({color: 0xDAA520}));
        bun2.position.y = 0.2;
        group.add(bun1, patty, bun2);
        mesh = group;
    } else if (type === 'raw_pizza') {
        geo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
        mat = new THREE.MeshStandardMaterial({ color: 0xffffe0 }); // Dough
        mesh = new THREE.Mesh(geo, mat);
    } else if (type === 'pizza') {
        geo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 32);
        mat = new THREE.MeshStandardMaterial({ color: 0xffd700 }); // Cheese
        const pepperoni = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), new THREE.MeshStandardMaterial({color: 0xaa0000}));
        pepperoni.position.set(0.2, 0, 0.2);
        const p2 = pepperoni.clone(); p2.position.set(-0.2, 0, -0.1);
        const group = new THREE.Group();
        group.add(new THREE.Mesh(geo, mat), pepperoni, p2);
        mesh = group;
    }
    
    if (mesh) {
        mesh.position.set(x, y, z);
        mesh.name = name;
        cookingScene.add(mesh);
    }
}

function updateAssemblyVisuals() {
    removeObjectByName('assembly_visual');
    const group = new THREE.Group();
    group.name = 'assembly_visual';
    
    if (cookingStationState.assembly.bun) {
        const bun = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 32), new THREE.MeshStandardMaterial({color: 0xDAA520}));
        group.add(bun);
    }
    if (cookingStationState.assembly.patty) {
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32), new THREE.MeshStandardMaterial({color: 0x8B4513}));
        patty.position.y = 0.1;
        group.add(patty);
    }
    group.position.set(0, 1.1, -2);
    cookingScene.add(group);
}

function removeObjectByName(name) {
    const obj = cookingScene.getObjectByName(name);
    if (obj) cookingScene.remove(obj);
}

function spawnCustomer() {
    const wantsPizza = unlockedDishes.pizza && Math.random() > 0.6;
    const order = wantsPizza ? 'pizza' : 'burger';
    
    // Visuals
    const customerGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const color = Math.random() * 0xffffff;
    const customerMat = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(customerGeo, customerMat);
    
    // Spawn Left
    mesh.position.set(-8, 0.9, 4);
    mesh.castShadow = true;
    mesh.userData = { id: Date.now(), order: order };
    
    cookingScene.add(mesh);
    
    customers.push({
        mesh: mesh,
        id: mesh.userData.id,
        order: order,
        state: 'entering', // entering, waiting, leaving
        targetX: -3 + (customers.length * 2), // Spread them out
    });
    
    activeOrders.push({ id: mesh.userData.id, item: order });
    updateOrderPanel();
}

function serveCustomer(customerId) {
    const idx = customers.findIndex(c => c.id === customerId);
    if (idx === -1) return;
    const customer = customers[idx];
    
    if (customer.state !== 'waiting') return; 

    if (cookingStationState.counter.item === customer.order) {
        // Success
        const reward = customer.order === 'burger' ? 20 : 50;
        cookingCash += reward;
        cookingScore += reward;
        updateCookingUI();
        
        // Persist Cash
        localStorage.setItem('hetuCookingCash', cookingCash);
        
        // Remove Food
        removeObjectByName('counter_item');
        cookingStationState.counter.item = null;
        
        // Leave
        customer.state = 'leaving';
        
        // Remove Order Ticket
        activeOrders = activeOrders.filter(o => o.id !== customerId);
        updateOrderPanel();
        
        // Save Score periodically
        if(cookingScore % 100 === 0) saveGameScore("Bistro Hetu", cookingScore);
    } else {
        if (!cookingStationState.counter.item) {
             showCustomPopup("Empty Counter", "You need to place food on the counter first!");
        } else {
             showCustomPopup("Wrong Order!", `Customer wants a ${customer.order}!`);
        }
    }
}

function updateOrderPanel() {
    const panel = document.getElementById('ordersPanel');
    if(!panel) return;
    panel.innerHTML = '';
    activeOrders.forEach(order => {
        const ticket = document.createElement('div');
        ticket.className = 'order-ticket';
        ticket.innerHTML = `<strong>${order.item === 'burger' ? '🍔 Burger' : '🍕 Pizza'}</strong><br><span>#${order.id.toString().slice(-3)}</span>`;
        panel.appendChild(ticket);
    });
}

function buyUpgrade(item) {
    if (item === 'pizza') {
        if (cookingCash >= 100) {
            cookingCash -= 100;
            unlockedDishes.pizza = true;
            localStorage.setItem('hetuCookingCash', cookingCash);
            localStorage.setItem('hetuCookingUnlocks', JSON.stringify(unlockedDishes));
            
            document.getElementById('unlockPizzaBtn').style.display = 'none';
            updateCookingUI();
            showCustomPopup("Unlocked!", "You can now make Pizzas! Use the Oven.");
        } else {
            showCustomPopup("Too poor!", "You need $100.");
        }
    }
}

function updateCookingUI() {
    const cashEl = document.getElementById('gameCash');
    const scoreEl = document.getElementById('gameScore');
    const hubDisplay = document.getElementById('cookingCashDisplay');
    
    if(cashEl) cashEl.textContent = cookingCash;
    if(scoreEl) scoreEl.textContent = cookingScore;
    if(hubDisplay) hubDisplay.textContent = cookingCash;
    
    const btn = document.getElementById('unlockPizzaBtn');
    if(btn) {
        if(unlockedDishes.pizza) btn.style.display = 'none';
        else btn.style.display = 'block';
    }
}

function animateCooking() {
    if (!cookingGameRunning) return;
    
    cookingLoopId = requestAnimationFrame(animateCooking);
    
    // 1. Station Logic
    // Grill
    if (cookingStationState.grill.active) {
        cookingStationState.grill.progress += 0.5;
        // Wobble effect while cooking
        const patty = cookingScene.getObjectByName('grill_item');
        if(patty) patty.rotation.y += 0.05;
        
        if (cookingStationState.grill.progress > 100) {
            cookingStationState.grill.active = false;
            cookingStationState.grill.item = 'cooked_patty';
            if (patty) patty.material.color.setHex(0x8B4513); // Brown
        }
    }
    // Oven
    if (cookingStationState.oven.active) {
        cookingStationState.oven.progress += 0.5;
        const pizza = cookingScene.getObjectByName('oven_item');
        if(pizza) pizza.rotation.y += 0.02;

        if (cookingStationState.oven.progress > 150) {
            cookingStationState.oven.active = false;
            cookingStationState.oven.item = 'cooked_pizza';
            if (pizza) {
                 // Change color of dough to crust color
                 if(pizza.children && pizza.children[0]) pizza.children[0].material.color.setHex(0xcd853f);
                 // Cheese melts (darkens slightly)
                 pizza.children[1].material.color.setHex(0xffa500); 
            }
        }
    }

    // 2. Customer Spawning
    const now = Date.now();
    if (now - lastCustomerTime > 4000 && customers.length < 3) {
        spawnCustomer();
        lastCustomerTime = now;
    }

    // 3. Customer Movement
    customers.forEach((c, index) => {
        if (c.state === 'entering') {
            const destX = -4 + (index * 2.5);
            if(c.mesh.position.x < destX) {
                c.mesh.position.x += 0.05;
                // Bobbing walk
                c.mesh.position.y = 0.9 + Math.sin(now * 0.01) * 0.1;
            } else {
                c.state = 'waiting';
            }
        } else if (c.state === 'leaving') {
            c.mesh.position.z += 0.1;
            c.mesh.rotation.y = Math.PI; // Face away
             c.mesh.position.y = 0.9 + Math.sin(now * 0.01) * 0.1;
             
            if (c.mesh.position.z > 10) {
                cookingScene.remove(c.mesh);
                customers.splice(index, 1);
            }
        }
    });

    cookingRenderer.render(cookingScene, cookingCamera);
}

function saveGameScore(gameName, score) {
    if (!currentUser) return;
    const formData = new FormData();
    formData.append('formType', 'gameScoreEntry');
    formData.append('game', gameName);
    formData.append('score', score);
    formData.append('player', currentUser);

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' }).catch(console.error);
}

// ==========================================
//          ORIGINAL FEATURES & UTILS
// ==========================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function createFloatingEmojis() {
    const container = document.getElementById('floatingBg');
    if(!container) return;
    container.innerHTML = '';
    const emojis = ['💖', '💕', '💗', '🐰', '🦋', '🌸', '🍔', '🍕'];
    
    for (let i = 0; i < 20; i++) {
        const emoji = document.createElement('div');
        emoji.className = 'floating-emoji';
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.left = Math.random() * 100 + '%';
        emoji.style.top = Math.random() * 100 + '%';
        emoji.style.animationDelay = Math.random() * 6 + 's';
        emoji.style.animationDuration = (8 + Math.random() * 6) + 's';
        container.appendChild(emoji);
    }
}

// --- POPUPS ---
function showCustomPopup(title, message, inputPlaceholder = null, callback = null) {
    document.querySelectorAll('.custom-popup-overlay').forEach(p => p.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'custom-popup-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'custom-popup';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    popup.appendChild(titleEl);
    popup.appendChild(messageEl);
    
    let input = null;
    if (inputPlaceholder) {
        input = document.createElement('textarea');
        input.rows = 3;
        input.placeholder = inputPlaceholder;
        input.style.cssText = 'width: 100%; padding: 10px; margin: 10px 0;';
        popup.appendChild(input);
    }
    
    const btnDiv = document.createElement('div');
    btnDiv.style.marginTop = "15px";
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginRight = "10px";
    cancelBtn.onclick = () => { overlay.remove(); if(callback) callback(null); };
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'OK';
    confirmBtn.onclick = () => { overlay.remove(); if(callback) callback(input ? input.value : true); };
    
    btnDiv.appendChild(cancelBtn);
    btnDiv.appendChild(confirmBtn);
    popup.appendChild(btnDiv);
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
}

function showMissYouPopup() {
    const bunnyFace = document.querySelector('.bunny-button .bunny-face');
    if(bunnyFace) bunnyFace.classList.add('spinning');
    
    setTimeout(() => {
        if(bunnyFace) bunnyFace.classList.remove('spinning');
        const msgs = ["You're my favorite! 💖", "Sending hugs! 🤗", "Thinking of you! ✨"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        
        document.getElementById('missYouMessage').textContent = msg;
        document.getElementById('missYouPopup').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
    }, 1000);
}
function closeMissYouPopup() {
    document.getElementById('missYouPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// --- FEELINGS PORTAL ---
function navigateToFeelingsPage(pageId, emotion = '') {
    document.querySelectorAll('#feelingsPortalScreen .page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        if (emotion) currentEmotion = emotion;
    }
}

function submitFeelingsEntry() {
    const message = document.getElementById('feelingsMessage').value.trim();
    if (!currentEmotion || !message) {
        showCustomPopup('Incomplete', 'Please select emotion and write thoughts.');
        return;
    }
    
    const btn = document.getElementById('submitFeelingsBtn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('formType', 'feelingsEntry');
    formData.append('emotion', currentEmotion);
    formData.append('message', message);
    formData.append('submittedBy', currentUser);

    fetch(scriptURL, { method: 'POST', body: formData, mode: 'cors' })
        .then(r => r.json())
        .then(data => {
            if(data.status === 'success') {
                document.getElementById('feelingsMessage').value = '';
                navigateToFeelingsPage('feelingsPage3');
            } else throw new Error(data.message);
        })
        .catch(e => showCustomPopup('Error', e.message))
        .finally(() => { btn.disabled = false; btn.textContent = 'Submit Entry'; });
}

async function fetchAndDisplayFeelingsEntries() {
    const list = document.getElementById('feelingsEntriesList');
    list.innerHTML = 'Loading...';
    try {
        const res = await fetch(`${scriptURL}?action=getFeelingsEntries`, {mode:'cors'});
        const json = await res.json();
        if(json.status === 'success' && json.data.length) {
            list.innerHTML = '';
            const table = document.createElement('table');
            table.className = 'feelings-table';
            table.innerHTML = `<tr><th>Date</th><th>User</th><th>Emotion</th><th>Message</th></tr>`;
            json.data.forEach(e => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${new Date(e.timestamp).toLocaleDateString()}</td><td>${e.submittedBy}</td><td>${e.emotion}</td><td>${e.message}</td>`;
                table.appendChild(tr);
            });
            list.appendChild(table);
        } else {
            list.innerHTML = 'No entries found.';
        }
        navigateToFeelingsPage('feelingsViewEntriesPage');
    } catch(e) { list.innerHTML = 'Error loading.'; }
}

// --- DIARY ---
function navigateToDiaryPage(pageId) {
    document.querySelectorAll('#diaryScreen .page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

async function fetchDiaryEntries() {
    try {
        const res = await fetch(`${scriptURL}?action=getDiaryEntries`, {mode:'cors'});
        const json = await res.json();
        if(json.status === 'success') {
            diaryEntries = {};
            json.data.forEach(e => diaryEntries[new Date(e.date).toISOString().split('T')[0]] = e);
        }
    } catch(e) { console.error(e); }
}

function renderCalendar(date) {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('currentMonthYear');
    grid.innerHTML = '';
    title.textContent = date.toLocaleString('default', {month:'long', year:'numeric'});
    
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Headers
    ['S','M','T','W','T','F','S'].forEach(d => {
        const h = document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; grid.appendChild(h);
    });
    
    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));
    
    for(let d=1; d<=daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = d;
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        
        if(diaryEntries[dateStr]) cell.classList.add('has-entry');
        
        cell.onclick = () => {
            if(diaryEntries[dateStr]) {
                 document.getElementById('viewDiaryThoughts').textContent = diaryEntries[dateStr].thoughts;
                 document.getElementById('viewDiaryDateDisplay').textContent = dateStr;
                 navigateToDiaryPage('diaryViewPage');
            } else {
                 document.getElementById('selectedDate').value = dateStr;
                 document.getElementById('diaryDateDisplay').textContent = dateStr;
                 navigateToDiaryPage('diaryEntryPage');
            }
        };
        grid.appendChild(cell);
    }
}

function submitDiaryEntry() {
    const thoughts = document.getElementById('diaryThoughts').value;
    const date = document.getElementById('selectedDate').value;
    if(!thoughts) return;
    
    const formData = new FormData();
    formData.append('formType', 'diaryEntry');
    formData.append('date', date);
    formData.append('thoughts', thoughts);
    formData.append('submittedBy', currentUser);
    
    fetch(scriptURL, {method:'POST', body:formData, mode:'cors'})
    .then(() => {
        fetchDiaryEntries().then(() => {
            renderCalendar(calendarCurrentDate);
            navigateToDiaryPage('diaryConfirmationPage');
        });
    });
}

function fetchAndDisplayAllDiaryEntries() {
    // Re-use logic for viewing all entries
    const list = document.getElementById('allDiaryEntriesList');
    list.innerHTML = '';
    Object.values(diaryEntries).forEach(e => {
        const div = document.createElement('div');
        div.style.borderBottom = "1px solid #ccc";
        div.style.padding = "10px";
        div.innerHTML = `<strong>${new Date(e.date).toDateString()}</strong><br>${e.thoughts}`;
        list.appendChild(div);
    });
    navigateToDiaryPage('allDiaryEntriesPage');
}

// --- TIMELINE (Functions included in top section) ---

// --- PERIOD TRACKER ---
function selectMood(m) { selectedMood = m; }
function addPeriodEntry() {
    const start = document.getElementById('periodStartDate').value;
    if(!start) return;
    periodData.push({startDate: start, mood: selectedMood});
    localStorage.setItem('periodData', JSON.stringify(periodData));
    loadPeriodTracker();
    showCustomPopup("Success", "Period logged.");
}
function loadPeriodTracker() {
    periodData = JSON.parse(localStorage.getItem('periodData') || '[]');
    const status = document.getElementById('periodStatus');
    if(periodData.length) {
        const last = periodData[periodData.length-1];
        status.textContent = `Last period: ${last.startDate}`;
    } else status.textContent = "No data.";
    renderPeriodCalendar();
}
function changePeriodMonth(d) {
    periodCalendarDate.setMonth(periodCalendarDate.getMonth()+d);
    renderPeriodCalendar();
}
function renderPeriodCalendar() {
    const grid = document.getElementById('periodCalendarGrid');
    const title = document.getElementById('periodMonthYear');
    grid.innerHTML = '';
    title.textContent = periodCalendarDate.toLocaleString('default',{month:'long', year:'numeric'});
    // Simplified rendering for brevity
    const month = periodCalendarDate.getMonth();
    const days = new Date(periodCalendarDate.getFullYear(), month+1, 0).getDate();
    for(let i=1; i<=days; i++) {
        const d = document.createElement('div');
        d.className='calendar-day';
        d.textContent=i;
        grid.appendChild(d);
    }
}

// --- DARE GAME ---
function generateDare() {
    const dare = coupleDares[Math.floor(Math.random()*coupleDares.length)];
    document.getElementById('dareText').textContent = dare;
}

// --- MEMORY GAME ---
function startMemoryGame() {
    navigateToApp('memoryGameScreen');
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    memMoves = 0;
    document.getElementById('memoryMoves').textContent = 0;
    const icons = ['🍎','🍌','🍒','🍇','🍉','🍓'];
    const cards = [...icons, ...icons].sort(()=>0.5-Math.random());
    
    cards.forEach(icon => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `<div class="front-face">${icon}</div><div class="back-face">?</div>`;
        card.onclick = function() {
            if(memLock || this.classList.contains('flip')) return;
            this.classList.add('flip');
            if(!memHasFlippedCard) {
                memHasFlippedCard = true;
                memFirstCard = this;
            } else {
                memSecondCard = this;
                memMoves++;
                document.getElementById('memoryMoves').textContent = memMoves;
                if(memFirstCard.innerHTML === memSecondCard.innerHTML) {
                    memFirstCard.onclick = null;
                    memSecondCard.onclick = null;
                    resetMemBoard();
                } else {
                    memLock = true;
                    setTimeout(() => {
                        memFirstCard.classList.remove('flip');
                        memSecondCard.classList.remove('flip');
                        resetMemBoard();
                    }, 1000);
                }
            }
        };
        grid.appendChild(card);
    });
}
function resetMemBoard() {
    memHasFlippedCard = false;
    memLock = false;
    memFirstCard = null;
    memSecondCard = null;
}

// --- CATCH GAME ---
function startCatchGame() {
    navigateToApp('catchGameScreen');
    // Simplified logic setup
    const canvas = document.getElementById('catchGameCanvas');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 400;
}
function initCatchGame() {
    document.getElementById('catchStartOverlay').style.display = 'none';
    const canvas = document.getElementById('catchGameCanvas');
    const ctx = canvas.getContext('2d');
    catchGameRunning = true;
    catchScore = 0;
    let basketX = canvas.width/2;
    let items = [];
    
    canvas.onmousemove = e => basketX = e.offsetX;
    
    function loop() {
        if(!catchGameRunning) return;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        ctx.fillStyle = 'pink';
        ctx.fillRect(basketX-25, canvas.height-30, 50, 20);
        
        if(Math.random()<0.05) items.push({x:Math.random()*canvas.width, y:0, type: Math.random()>0.3?'💖':'💔'});
        
        items.forEach((item, i) => {
            item.y += 3;
            ctx.font = '20px serif';
            ctx.fillText(item.type, item.x, item.y);
            
            if(item.y > canvas.height-30 && Math.abs(item.x - basketX) < 30) {
                if(item.type === '💔') {
                    catchGameRunning = false;
                    showCustomPopup("Game Over", `Score: ${catchScore}`);
                    document.getElementById('catchStartOverlay').style.display = 'flex';
                } else {
                    catchScore++;
                    items.splice(i,1);
                }
            }
        });
        document.getElementById('catchScore').textContent = catchScore;
        catchLoopId = requestAnimationFrame(loop);
    }
    loop();
}

// --- SLASHER GAME (Placeholder logic) ---
function startSlasherGame() {
    navigateToApp('slasherGameScreen');
    const canvas = document.getElementById('slasherCanvas');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 400;
}
function initSlasherGame() {
    document.getElementById('slasherStartOverlay').style.display = 'none';
    slasherGameRunning = true;
    slasherScore = 0;
    const ctx = document.getElementById('slasherCanvas').getContext('2d');
    
    function loop() {
        if(!slasherGameRunning) return;
        ctx.clearRect(0,0,3000,3000);
        ctx.fillText("Swipe to slash (Demo)", 50, 200);
        slasherLoopId = requestAnimationFrame(loop);
    }
    loop();
}
function updateHighScoreDisplays() {
    document.getElementById('memHighScore').textContent = gameHighScores.memory;
    document.getElementById('catchHighScore').textContent = gameHighScores.catch;
    document.getElementById('slashHighScore').textContent = gameHighScores.slasher;
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkLoginStatus();
    if(currentUser) createFloatingEmojis();
    document.getElementById('themeToggle').onclick = toggleTheme;
});
