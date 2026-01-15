import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- ЗВУКОВАЯ СИСТЕМА ---
const audioFiles = {
    shoot: new Audio('sounds/shoot.mp3'),
    sniper: new Audio('sounds/sniper.mp3'),
    zombieDeath: new Audio('sounds/zombie_death.mp3'),
    car: new Audio('sounds/car.mp3'),
    rain: new Audio('sounds/rain.mp3'),
    step: new Audio('sounds/step.mp3'),
    jump: new Audio('sounds/jump.mp3')
};

audioFiles.car.loop = true;
audioFiles.rain.loop = true;
audioFiles.rain.volume = 0.5;
audioFiles.car.volume = 0.4;

function playSound(name, volume = 1.0) {
    if (audioFiles[name]) {
        const sound = audioFiles[name].cloneNode();
        sound.volume = volume;
        sound.play().catch(e => console.log("Audio play error:", e));
    }
}

// --- СТИЛИ И ИНТЕРФЕЙС ---
const style = document.createElement('style');
style.innerHTML = `
#minimap-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 200px;
    height: 200px;
    border: 3px solid rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    overflow: hidden;
    z-index: 100;
    background: rgba(0, 0, 0, 0.3);
}
#hp-container {
    position: fixed;
    top: 20px;
    left: 20px;
    width: 250px;
    height: 25px;
    background: rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
    z-index: 1000;
}
#hp-bar {
    width: 100%;
    height: 100%;
    background: #ff0000;
    transition: width 0.2s;
}
#money-container {
    position: fixed;
    top: 55px;
    left: 20px;
    font-size: 28px;
    color: #85bb65;
    font-weight: bold;
    text-shadow: 2px 2px 2px #000;
    z-index: 1000;
    font-family: sans-serif;
}
#speedometer-container {
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 200px;
    height: 200px;
    border: 3px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    overflow: hidden;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: sans-serif;
    box-shadow: 0 0 15px rgba(0,0,0,0.8);
}
#speed-value { font-size: 70px; font-weight: bold; text-shadow: 2px 2px 4px #000; }
#speed-unit { font-size: 20px; color: #ccc; text-shadow: 1px 1px 2px #000; }
#death-screen {
    display: none;
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.85);
    color: white;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    font-family: sans-serif;
}
#death-screen h1 { color: red; font-size: 50px; }
#restart-btn {
    padding: 15px 30px;
    font-size: 20px;
    cursor: pointer;
    background: #444;
    color: white;
    border: 2px solid white;
    margin-top: 20px;
}
#interaction-hint {
    position: fixed;
    top: 60%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 18px;
    text-shadow: 1px 1px 2px #000;
    display: none;
    z-index: 900;
    font-family: sans-serif;
    text-align: center;
}
#shop-modal {
    display: none;
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #85bb65;
    color: white;
    padding: 20px;
    z-index: 1500;
    font-family: sans-serif;
    text-align: center;
    min-width: 300px;
}
#shop-modal h2 { margin-top: 0; color: #85bb65; }
.shop-btn {
    padding: 10px 20px;
    margin: 10px;
    cursor: pointer;
    font-size: 16px;
    border: none;
    border-radius: 5px;
}
#btn-buy-yes { background: #28a745; color: white; }
#btn-buy-no { background: #dc3545; color: white; }

/* --- CSS ДЛЯ РУЛЕТКИ --- */
#roulette-modal {
    display: none;
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(20, 60, 20, 0.95);
    border: 4px solid #FFD700;
    color: white;
    padding: 20px;
    z-index: 1500;
    font-family: sans-serif;
    text-align: center;
    width: 350px;
    border-radius: 10px;
}
#roulette-modal h2 { color: #FFD700; margin-top: 0; text-shadow: 2px 2px #000; }
.roulette-input {
    width: 80%;
    padding: 10px;
    margin: 10px 0;
    font-size: 18px;
    text-align: center;
    border-radius: 5px;
    border: 1px solid #ccc;
}
#btn-roulette-bet {
    padding: 12px 25px;
    background: #FFD700;
    color: black;
    font-weight: bold;
    font-size: 18px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 10px;
}
#btn-roulette-bet:hover { background: #e6c200; }
#roulette-msg { margin-top: 15px; color: #ccc; font-style: italic; }
#roulette-result {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 40px;
    color: #FFD700;
    font-weight: bold;
    text-shadow: 3px 3px 5px #000;
    z-index: 1400;
    display: none;
    font-family: sans-serif;
    text-align: center;
}
`;
document.head.appendChild(style);

const hpCont = document.createElement('div');
hpCont.id = 'hp-container';
hpCont.innerHTML = `<div id="hp-bar"></div>`;
document.body.appendChild(hpCont);

const moneyCont = document.createElement('div');
moneyCont.id = 'money-container';
moneyCont.innerHTML = `$0`;
document.body.appendChild(moneyCont);

const speedometerDiv = document.createElement('div');
speedometerDiv.id = 'speedometer-container';
speedometerDiv.innerHTML = `
   <div id="speed-value">0</div>
   <div id="speed-unit">KM/H</div>
`;
document.body.appendChild(speedometerDiv);

const interactionHint = document.createElement('div');
interactionHint.id = 'interaction-hint';
interactionHint.innerText = "";
document.body.appendChild(interactionHint);

const shopModal = document.createElement('div');
shopModal.id = 'shop-modal';
shopModal.innerHTML = `
    <h2 id="shop-title">Покупка</h2>
    <p id="shop-text">Вы действительно хотите купить?</p>
    <button id="btn-buy-yes" class="shop-btn">Купить</button>
    <button id="btn-buy-no" class="shop-btn">Отмена</button>
`;
document.body.appendChild(shopModal);

// --- ИНТЕРФЕЙС РУЛЕТКИ ---
const rouletteModal = document.createElement('div');
rouletteModal.id = 'roulette-modal';
rouletteModal.innerHTML = `
    <h2>🎰 Казино Рояль 🎰</h2>
    <p>Сделайте вашу ставку!</p>
    <input id="roulette-input-amount" class="roulette-input" type="number" placeholder="Сумма ставки ($)">
    <input id="roulette-input-number" class="roulette-input" type="number" placeholder="Число (0-36)" min="0" max="36">
    <button id="btn-roulette-bet">ПОСТАВИТЬ</button>
    <p id="roulette-msg">После ставки нажмите P для запуска</p>
    <button id="btn-roulette-close" class="shop-btn" style="background:#444;">Закрыть</button>
`;
document.body.appendChild(rouletteModal);

const rouletteResult = document.createElement('div');
rouletteResult.id = 'roulette-result';
document.body.appendChild(rouletteResult);

const deathScreen = document.createElement('div');
deathScreen.id = 'death-screen';
deathScreen.innerHTML = `
<h1>ТЫ ПОГИБ</h1>
<p id="final-score" style="font-size:24px;"></p>
<button id="restart-btn">НАЧАТЬ ЗАНОВО</button>
`;
document.body.appendChild(deathScreen);

const minimapDiv = document.createElement('div');
minimapDiv.id = 'minimap-container';
document.body.appendChild(minimapDiv);

// --- Переменные состояния ---
let health = 100;
let balance = 0;
let isDead = false;
let lastDamageTime = 0;
let isThirdPerson = false;

// --- МАГАЗИН ---
let shopShelves = [];
let currentShopItem = null;
let isShopModalOpen = false;
let shopDoorGroup = null;
let isShopDoorOpen = false;

// --- КАЗИНО (Новые переменные) ---
let casinoDoorGroup = null;
let isCasinoDoorOpen = false;
let rouletteTable = null; 
let rouletteWheel = null;
let rouletteBall = null;
let isRouletteModalOpen = false;
let currentBet = { active: false, amount: 0, number: -1 };
let isSpinning = false;
let spinVelocity = 0;
let ballVelocity = 0;
let spinTimer = 0;
let ballHeightOffset = 0;

// --- БАСКЕТБОЛ ---
let basketBall = null;
let hasBall = false;
let isBallFlying = false;
let basketHoopTarget = new THREE.Vector3();
let hoopTargets = [];

// --- ПОГОДА ---
let isRaining = false;
let rainSystem = null;
let rainTimer = 0;

const walls = []; 
const trafficLights = [];

// --- Сцена и камера ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);
scene.fog = new THREE.Fog(0xa0d8ef, 1, 400);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.layers.enable(0);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- ИГРОК 3-Е ЛИЦО ---
const playerGroup = new THREE.Group();
const playerBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x3366ff }));
playerBody.position.y = 1.1; playerBody.castShadow = true;
const playerHead = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
playerHead.position.y = 1.95; playerHead.castShadow = true;
const pLegGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
const pLeftLeg = new THREE.Mesh(pLegGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
pLeftLeg.position.set(0.15, 0.3, 0); pLeftLeg.castShadow = true;
const pRightLeg = new THREE.Mesh(pLegGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
pRightLeg.position.set(-0.15, 0.3, 0); pRightLeg.castShadow = true;
const pArmGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
const pLeftArm = new THREE.Mesh(pArmGeo, new THREE.MeshStandardMaterial({ color: 0xffdbac }));
pLeftArm.position.set(0.42, 1.1, 0); pLeftArm.castShadow = true;
const pRightArm = new THREE.Mesh(pArmGeo, new THREE.MeshStandardMaterial({ color: 0xffdbac }));
pRightArm.position.set(-0.42, 1.1, 0); pRightArm.castShadow = true;

playerGroup.add(playerBody, playerHead, pLeftLeg, pRightLeg, pLeftArm, pRightArm);
playerGroup.visible = false;
scene.add(playerGroup);

// --- МИНИ-КАРТА ---
const minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
minimapCamera.position.set(0, 200, 0);
minimapCamera.lookAt(0, 0, 0);
minimapCamera.layers.set(1); 
minimapCamera.layers.enable(0);

const minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
minimapRenderer.setSize(200, 200);
minimapDiv.appendChild(minimapRenderer.domElement);

const playerMarker = new THREE.Mesh(
   new THREE.CircleGeometry(4, 32),
   new THREE.MeshBasicMaterial({ color: 0x0000ff, depthTest: false })
);
playerMarker.rotation.x = -Math.PI / 2;
playerMarker.renderOrder = 999;
playerMarker.layers.set(1);
scene.add(playerMarker);

// --- Загрузчик ---
const loader = new GLTFLoader();

// --- Свет ---
const ambient = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambient);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.position.set(100, 200, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -200;
sunLight.shadow.camera.right = 200;
sunLight.shadow.camera.top = 200;
sunLight.shadow.camera.bottom = -200;
sunLight.shadow.radius = 4;
scene.add(sunLight);

// --- Текстуры ---
function createTextTexture(text, color = 'white', bg = 'red') {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    return new THREE.CanvasTexture(canvas);
}

function createBrickTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#cc8866';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#885544';
    ctx.lineWidth = 4;
    for(let y=0; y<512; y+=32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
        const offset = (y/32)%2 === 0 ? 0 : 32;
        for(let x=offset; x<512; x+=64) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y+32); ctx.stroke();
        }
    }
    return new THREE.CanvasTexture(canvas);
}

// --- ОБЛАКА ---
const clouds = [];
function createCloud(x, z) {
   const group = new THREE.Group();
   const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
   for(let i=0; i<6; i++) {
       const part = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random()*2, 8, 8), cloudMat);
       part.position.set(i*3, Math.random()*2, Math.random()*3);
       group.add(part);
   }
   group.position.set(x, 100 + Math.random()*20, z);
   scene.add(group);
   clouds.push(group);
}
for(let i=0; i<70; i++) createCloud((Math.random()-0.5)*1500, (Math.random()-0.5)*1500);

// --- ДОЖДЬ ---
function initRain() {
    const rainCount = 15000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = [];
    for(let i=0; i<rainCount; i++) {
        positions.push((Math.random()-0.5)*400); 
        positions.push(Math.random()*200);       
        positions.push((Math.random()-0.5)*400); 
    }
    rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
        color: 0xaaaaaa, size: 0.5, transparent: true, opacity: 0.6
    });
    rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false;
    scene.add(rainSystem);
}
initRain();

// --- ИСПРАВЛЕННЫЕ NPC (ЛЮДИ) ---
const people = [];

function createLimb(width, length, colorOrMat, x, y, z) {
    const group = new THREE.Group();
    const geometry = new THREE.CylinderGeometry(width, width * 0.8, length, 8);
    const material = colorOrMat.isMaterial ? colorOrMat : new THREE.MeshStandardMaterial({ color: colorOrMat });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -length / 2;
    mesh.castShadow = true; 
    group.add(mesh);
    group.position.set(x, y, z);
    return { group, mesh, length };
}

function createPerson(x, z) {
   const group = new THREE.Group();
   group.scale.set(1.3, 1.3, 1.3);
   
   const isMale = Math.random() > 0.5;
   const hasGlasses = Math.random() > 0.7;
   const skinColor = 0xffdbac; 
   const shirtColor = Math.random() * 0xffffff;
   const pantsColor = Math.random() * 0x555555;
   const hairColor = Math.random() > 0.5 ? 0x000000 : (Math.random() > 0.5 ? 0x8B4513 : 0xffcc00);
   const shoeColor = 0x111111;

   const skinMat = new THREE.MeshStandardMaterial({ color: skinColor });
   const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor });
   const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor });
   const hairMat = new THREE.MeshStandardMaterial({ color: hairColor });
   const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor });
   const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
   const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

   // --- ТЕЛО ---
   const torsoGeo = new THREE.CylinderGeometry(0.25, 0.23, 0.6, 12);
   const torso = new THREE.Mesh(torsoGeo, shirtMat);
   torso.position.y = 1.4;
   torso.castShadow = true;
   group.add(torso);

   if (!isMale) {
        const skirtGeo = new THREE.ConeGeometry(0.35, 0.45, 16, 1, true);
        const skirt = new THREE.Mesh(skirtGeo, new THREE.MeshStandardMaterial({color: pantsColor}));
        skirt.position.y = 1.05;
        group.add(skirt);
   }

   // --- ГОЛОВА ---
   const headGeo = new THREE.SphereGeometry(0.25, 16, 16);
   const head = new THREE.Mesh(headGeo, skinMat);
   head.position.y = 1.95;
   head.castShadow = true; 
   group.add(head);

   // --- ЛИЦО (Без теней для оптимизации) ---
   const eyeGeo = new THREE.SphereGeometry(0.04);
   const leftEye = new THREE.Mesh(eyeGeo, blackMat);
   leftEye.position.set(0.1, 2.0, 0.2);
   const rightEye = new THREE.Mesh(eyeGeo, blackMat);
   rightEye.position.set(-0.1, 2.0, 0.2);
   
   const whiteEyeGeo = new THREE.SphereGeometry(0.02);
   const leftPupil = new THREE.Mesh(whiteEyeGeo, whiteMat); leftPupil.position.set(0.11, 2.02, 0.23);
   const rightPupil = new THREE.Mesh(whiteEyeGeo, whiteMat); rightPupil.position.set(-0.11, 2.02, 0.23);

   const mouthGeo = new THREE.CapsuleGeometry(0.02, 0.08, 4, 8);
   const mouth = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({color: 0x800000}));
   mouth.rotation.z = Math.PI / 2;
   mouth.position.set(0, 1.85, 0.22);

   group.add(leftEye, rightEye, leftPupil, rightPupil, mouth);

   // --- ВОЛОСЫ ---
   if (isMale) {
       const hairGeo = new THREE.SphereGeometry(0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI/2.2);
       const hair = new THREE.Mesh(hairGeo, hairMat);
       hair.position.y = 1.98;
       hair.rotation.x = Math.PI; 
       group.add(hair);
   } else {
       const hairTopGeo = new THREE.SphereGeometry(0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI/2.2);
       const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
       hairTop.position.y = 1.98;
       hairTop.rotation.x = Math.PI;
       
       const hairBackGeo = new THREE.BoxGeometry(0.56, 0.8, 0.3);
       const hairBack = new THREE.Mesh(hairBackGeo, hairMat);
       hairBack.position.set(0, 1.8, -0.2);
       
       group.add(hairTop, hairBack);
   }

   if (hasGlasses) {
       const glassesGeo = new THREE.TorusGeometry(0.06, 0.01, 8, 16);
       const glassesMat = new THREE.MeshStandardMaterial({color: 0x333333});
       const gLeft = new THREE.Mesh(glassesGeo, glassesMat);
       gLeft.position.set(0.1, 2.0, 0.22);
       const gRight = new THREE.Mesh(glassesGeo, glassesMat);
       gRight.position.set(-0.1, 2.0, 0.22);
       const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), glassesMat);
       bridge.position.set(0, 2.0, 0.22);
       group.add(gLeft, gRight, bridge);
   }

   // --- НОГИ ---
   const legMaterial = isMale ? pantsMat : skinMat; 

   const lThigh = createLimb(0.11, 0.5, legMaterial, 0.12, 1.1, 0); 
   const lShin = createLimb(0.09, 0.5, legMaterial, 0, -0.5, 0);    
   const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.25), shoeMat);
   lFoot.position.set(0, -0.5, 0.05); 
   lShin.group.add(lFoot);
   lThigh.group.add(lShin.group);
   group.add(lThigh.group);

   const rThigh = createLimb(0.11, 0.5, legMaterial, -0.12, 1.1, 0);
   const rShin = createLimb(0.09, 0.5, legMaterial, 0, -0.5, 0);
   const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.25), shoeMat);
   rFoot.position.set(0, -0.5, 0.05);
   rShin.group.add(rFoot);
   rThigh.group.add(rShin.group);
   group.add(rThigh.group);

   // --- РУКИ ---
   const lArm = createLimb(0.08, 0.35, shirtMat, 0.35, 1.6, 0);
   const lForeArm = createLimb(0.07, 0.35, skinMat, 0, -0.35, 0);
   lArm.group.add(lForeArm.group);
   group.add(lArm.group);

   const rArm = createLimb(0.08, 0.35, shirtMat, -0.35, 1.6, 0);
   const rForeArm = createLimb(0.07, 0.35, skinMat, 0, -0.35, 0);
   rArm.group.add(rForeArm.group);
   group.add(rArm.group);

   group.position.set(x, 0, z);
   scene.add(group);

   const pMarker = new THREE.Mesh(new THREE.CircleGeometry(2, 8), new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false }));
   pMarker.rotation.x = -Math.PI/2; pMarker.position.y = 50; pMarker.layers.set(1);
   group.add(pMarker);

   const walkingSpeed = 0.5 + Math.random() * 0.5;

   people.push({ 
       mesh: group, 
       speed: walkingSpeed, 
       dir: Math.random() > 0.5 ? 1 : -1,
       
       lThigh: lThigh.group, lShin: lShin.group,
       rThigh: rThigh.group, rShin: rShin.group,
       lArm: lArm.group, lForeArm: lForeArm.group,
       rArm: rArm.group, rForeArm: rForeArm.group,

       inBus: false,
       dead: false, falling: false, fallProgress: 0,
       marker: pMarker
   });
}

// --- ФУНКЦИЯ УБИЙСТВА ЧЕЛОВЕКА ---
function killPerson(person, hitPoint, weaponType) {
    if (person.dead) return;
    person.dead = true;
    playSound('zombieDeath');
    if(person.marker) person.marker.visible = false;
    createBloodExplosion(hitPoint || person.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
    
    if (weaponType === 'knife') {
        scene.remove(person.mesh);
        const index = people.indexOf(person);
        if (index > -1) people.splice(index, 1);
        createPerson((Math.random()-0.5)*2000, (Math.random()-0.5)*2000);
    } else {
        person.falling = true;
        setTimeout(() => {
            scene.remove(person.mesh);
            const index = people.indexOf(person);
            if (index > -1) people.splice(index, 1);
            createPerson((Math.random()-0.5)*2000, (Math.random()-0.5)*2000);
        }, 5000);
    }
}

// --- ОРУЖИЕ ---
let currentWeapon = 'pistol';
let weaponGroup = new THREE.Group();
camera.add(weaponGroup);

if (!document.getElementById('sniper-scope')) {
   const scope = document.createElement('div');
   scope.id = 'sniper-scope';
   scope.style = "display:none; position:fixed; top:50%; left:50%; width:400px; height:400px; border:3px solid black; border-radius:50%; transform:translate(-50%, -50%); pointer-events:none; box-shadow: 0 0 0 9999px rgba(0,0,0,0.85); z-index:1000;";
   scope.innerHTML = `<div style="position:absolute; top:50%; left:0; width:100%; height:2px; background:black;"></div><div style="position:absolute; left:50%; top:0; width:2px; height:100%; background:black;"></div>`;
   document.body.appendChild(scope);
}

const weapons = {
   knife: { speed: 1.4, fov: 75, model: null, range: 4 },
   pistol: { speed: 1.0, fov: 75, model: null, range: 100 },
   sniper: { speed: 0.6, fov: 25, model: null, range: 500 }
};

function initWeapons() {
   const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
   const steelMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9, roughness: 0.1 });

   const knife = new THREE.Group();
   const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), new THREE.MeshStandardMaterial({color: 0x331100}));
   const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.04), blackMat); guard.position.z = -0.13;
   const blade = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.4), steelMat); blade.position.z = -0.33;
   knife.add(handle, guard, blade);
   knife.position.set(0.6, -0.5, -0.8); knife.rotation.x = -0.2;
   weapons.knife.model = knife;

   const pistol = new THREE.Group();
   const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.75), blackMat);
   const pHandle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.45, 0.18), blackMat); pHandle.position.set(0, -0.28, 0.25);
   pistol.add(pBody, pHandle);
   pistol.position.set(0.5, -0.5, -1.1); pistol.rotation.y = Math.PI;
   weapons.pistol.model = pistol;

   const sniper = new THREE.Group();
   const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 1.8), blackMat);
   const sScope = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6), blackMat);
   sScope.rotation.x = Math.PI/2; sScope.position.y = 0.22;
   sniper.add(sBody, sScope);
   sniper.position.set(0.5, -0.5, -1.8); sniper.rotation.y = Math.PI;
   weapons.sniper.model = sniper;
}

function switchWeapon(type) {
   currentWeapon = type;
   weaponGroup.clear();
   weaponGroup.add(weapons[type].model);
   camera.fov = weapons[type].fov;
   camera.updateProjectionMatrix();
   document.getElementById('sniper-scope').style.display = type === 'sniper' ? 'block' : 'none';
   weapons[type].model.visible = type !== 'sniper';
}

// --- ТРАФИК ---
const traffic = [];
const busStops = [];

function createWheel(x, y, z, scale=1) {
   const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.45 * scale, 0.4 * scale, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
   wheel.rotation.z = Math.PI / 2; wheel.position.set(x, y, z);
   wheel.castShadow = true; wheel.receiveShadow = true;
   return wheel;
}

function createDriver() {
   const driverGroup = new THREE.Group();
   const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
   const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x333333 }));
   torso.position.y = -0.4; driverGroup.add(head, torso);
   return driverGroup;
}

function createCar(x, z, color, direction, axis = 'z') {
   const carGroup = new THREE.Group();
   const bodyMat = new THREE.MeshStandardMaterial({ color: color });
   const glassMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.5 });

   const base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.8, 4.6), bodyMat);
   base.position.y = 0.6; base.castShadow = true; base.receiveShadow = true;
   const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.6), bodyMat);
   top.position.set(0, 1.3, -0.2); top.castShadow = true;
   const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.6), glassMat);
   windshield.position.set(0, 1.3, 1.11);
   
   const driver = createDriver(); driver.position.set(0.4, 1.2, 0.2); driver.scale.set(0.8, 0.8, 0.8);
   const w1 = createWheel(1.15, 0.45, 1.6); const w2 = createWheel(-1.15, 0.45, 1.6);
   const w3 = createWheel(1.15, 0.45, -1.6); const w4 = createWheel(-1.15, 0.45, -1.6);

   carGroup.add(base, top, windshield, driver, w1, w2, w3, w4);
   
   carGroup.position.set(x, 0, z); 
   if (axis === 'z') {
        if (direction < 0) carGroup.rotation.y = Math.PI;
   } else {
        // Поворот для движения по оси X
        carGroup.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
   }

   scene.add(carGroup);
   
   traffic.push({ 
       mesh: carGroup, speed: (15 + Math.random() * 10) * direction, 
       wheels: [w1, w2, w3, w4], isBus: false, dir: direction, axis: axis 
   });
}

function createBus(x, z, direction, axis = 'z') {
   const busGroup = new THREE.Group();
   loader.load('bus.glb', (gltf) => {
       const model = gltf.scene;
       model.scale.set(2, 2, 2);
       model.traverse(n => { if (n.isMesh) n.castShadow = true; });
       busGroup.add(model);
   }, undefined, (error) => {
       const box = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 10), new THREE.MeshStandardMaterial({color: 0xffcc00}));
       box.position.y = 1.5; busGroup.add(box);
   });
   
   const doorGroup = new THREE.Group();
   busGroup.add(doorGroup);
   busGroup.position.set(x, 0, z);
   
   if (axis === 'z') {
        if (direction < 0) busGroup.rotation.y = Math.PI;
   } else {
        busGroup.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
   }
   
   scene.add(busGroup);

   const busMarker = new THREE.Mesh(
       new THREE.BoxGeometry(6, 2, 12),
       new THREE.MeshBasicMaterial({ color: 0xffff00, depthTest: false })
   );
   busMarker.position.y = 50; busMarker.renderOrder = 998; busMarker.layers.set(1);
   busGroup.add(busMarker);

   const maxSpeed = (12 + Math.random() * 5) * direction;
   
   traffic.push({ 
       mesh: busGroup, speed: maxSpeed, maxSpeed: maxSpeed, 
       wheels: [], isBus: true, door: doorGroup, doorOpen: 0, 
       state: 'driving', stopTimer: 0, dir: direction, axis: axis 
   });
}

function createTrafficLight(x, z, axis) {
   const group = new THREE.Group();
   const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x333333 }));
   pole.position.y = 3; group.add(pole);
   const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x222222 }));
   box.position.y = 5.5; group.add(box);

   const lightGeo = new THREE.SphereGeometry(0.15);
   const redMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0x000000 });
   const yellowMat = new THREE.MeshStandardMaterial({ color: 0x333300, emissive: 0x000000 });
   const greenMat = new THREE.MeshStandardMaterial({ color: 0x003300, emissive: 0x000000 });

   const redLight = new THREE.Mesh(lightGeo, redMat); redLight.position.set(0, 5.9, 0.26);
   const yellowLight = new THREE.Mesh(lightGeo, yellowMat); yellowLight.position.set(0, 5.5, 0.26);
   const greenLight = new THREE.Mesh(lightGeo, greenMat); greenLight.position.set(0, 5.1, 0.26);

   group.add(redLight, yellowLight, greenLight);
   group.position.set(x, 0, z);
   
   // Если светофор для оси X, поворачиваем его
   if (axis === 'x') group.rotation.y = Math.PI / 2;

   scene.add(group);

   trafficLights.push({ 
       group, redMat, yellowMat, greenMat, 
       state: 0, 
       position: new THREE.Vector3(x, 0, z),
       axis: axis 
   });
}

function createZebra(x, z, rotationY) {
    const group = new THREE.Group();
    const stripeGeo = new THREE.PlaneGeometry(0.6, 4);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Рисуем полосы
    for (let i = -3; i <= 3; i++) {
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(i * 1.2, 0.04, 0); // Чуть выше дороги
        stripe.receiveShadow = true;
        group.add(stripe);
    }
    
    group.position.set(x, 0, z);
    group.rotation.y = rotationY;
    scene.add(group);
}

function createInvisibleWall(x, y, z, w, h, d) {
   const geo = new THREE.BoxGeometry(w, h, d);
   const mat = new THREE.MeshBasicMaterial({ visible: false }); 
   const wall = new THREE.Mesh(geo, mat);
   wall.position.set(x, y, z);
   scene.add(wall);
   walls.push(wall);
   return wall; 
}

function createSupermarket(x, z) {
   const group = new THREE.Group();
   const brickTexture = createBrickTexture();
   brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping;
   brickTexture.repeat.set(4, 2);
   const wallMat = new THREE.MeshStandardMaterial({ map: brickTexture });
   const glassMat = new THREE.MeshStandardMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.3 });
   const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

   const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 20), new THREE.MeshStandardMaterial({color: 0xeeeeee}));
   floor.position.set(0, 0.25, 0); group.add(floor);
   const roof = new THREE.Mesh(new THREE.BoxGeometry(32, 1, 22), new THREE.MeshStandardMaterial({color: 0x222222}));
   roof.position.set(0, 10.5, 0); group.add(roof);

   const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 1), wallMat); backWall.position.set(0, 5.25, -9.5); group.add(backWall);
   const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 20), wallMat); leftWall.position.set(-14.5, 5.25, 0); group.add(leftWall);
   const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 20), wallMat); rightWall.position.set(14.5, 5.25, 0); group.add(rightWall);
   const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1), wallMat); frontLeft.position.set(-10, 5.25, 9.5); group.add(frontLeft);
   const frontRight = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1), wallMat); frontRight.position.set(10, 5.25, 9.5); group.add(frontRight);
   const frontTop = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 1), wallMat); frontTop.position.set(0, 8.25, 9.5); group.add(frontTop);

   const windowGeo = new THREE.BoxGeometry(8, 5, 0.2);
   const win1 = new THREE.Mesh(windowGeo, glassMat); win1.position.set(-10, 5, 10); group.add(win1);
   const win2 = new THREE.Mesh(windowGeo, glassMat); win2.position.set(10, 5, 10); group.add(win2);
   const cornice = new THREE.Mesh(new THREE.BoxGeometry(32, 0.5, 1), frameMat); cornice.position.set(0, 10, 10.5); group.add(cornice);

   const signTex = createTextTexture('SUPERMARKET', 'white', '#cc0000');
   const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.5, 0.5), new THREE.MeshStandardMaterial({ map: signTex }));
   signMesh.position.set(0, 11.5, 10); group.add(signMesh);

   const dGroup = new THREE.Group();
   dGroup.position.set(-2, 0, 9.5); 
   const dMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.2), glassMat); dMesh.position.set(2, 3, 0);
   const dFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 6.2, 0.1), new THREE.MeshStandardMaterial({color:0x111111, wireframe:true})); dFrame.position.set(2, 3, 0);
   const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.4), new THREE.MeshStandardMaterial({color:0xcccccc})); dHandle.position.set(3.5, 3, 0);
   dGroup.add(dMesh, dFrame, dHandle); group.add(dGroup);
   shopDoorGroup = dGroup;

   function createShopShelf(sx, sz, productType) {
        const sGroup = new THREE.Group();
        const sBody = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 1), new THREE.MeshStandardMaterial({color: 0x5c4033}));
        sBody.position.y = 2; sGroup.add(sBody);
        const itemGeo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        let color = 0xffffff; let price = 0; let name = "";

        if(productType === 'meat') { color = 0x8b0000; price = 15; name = "Мясо"; }
        else if(productType === 'beer') { color = 0xDAA520; price = 5; name = "Пиво"; }
        else if(productType === 'chips') { color = 0xFFFF00; price = 3; name = "Чипсы"; }
        else if(productType === 'juice') { color = 0xFFA500; price = 4; name = "Сок"; }
        else if(productType === 'sweets') { color = 0xFF69B4; price = 2; name = "Сладости"; }

        const itemMat = new THREE.MeshStandardMaterial({color: color});
        for(let row=1; row<=3; row++) {
            for(let col=-1.5; col<=1.5; col+=0.8) {
                const item = new THREE.Mesh(itemGeo, itemMat);
                item.position.set(col, row * 1, 0.6); sGroup.add(item);
            }
        }
        sGroup.position.set(sx, 0, sz); group.add(sGroup);
        createInvisibleWall(x + sx, 2, z + sz, 4, 4, 1);
        shopShelves.push({ pos: new THREE.Vector3(x + sx, 0, z + sz), name: name, price: price });
   }

   createShopShelf(-8, -5, 'meat'); createShopShelf(-8, 0, 'beer'); createShopShelf(-8, 5, 'chips');
   createShopShelf(8, -5, 'juice'); createShopShelf(8, 0, 'sweets'); createShopShelf(8, 5, 'beer');
   const register = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.5), new THREE.MeshStandardMaterial({color:0x333333}));
   register.position.set(0, 0.6, 5); group.add(register);
   createInvisibleWall(x, 0.6, z + 5, 4, 1.2, 1.5);
   group.position.set(x, 0, z); scene.add(group);

   createInvisibleWall(x, 5, z - 9.5, 30, 10, 1);
   createInvisibleWall(x - 14.5, 5, z, 1, 10, 20);
   createInvisibleWall(x + 14.5, 5, z, 1, 10, 20);
   createInvisibleWall(x - 10, 5, z + 9.5, 10, 10, 1);
   createInvisibleWall(x + 10, 5, z + 9.5, 10, 10, 1);
   createInvisibleWall(x, 8.25, z + 9.5, 10, 4, 1);
}

// --- НОВОЕ ЗДАНИЕ КАЗИНО ---
function createCasino(x, z) {
    const group = new THREE.Group();
    
    // Большое здание
    const h = 60;
    const w = 40;
    const d = 40;
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    body.position.y = h/2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    walls.push(body); // Добавляем коллизию

    // Золотая отделка
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 });
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(w+2, 2, d+2), trimMat);
    topTrim.position.y = h;
    group.add(topTrim);

    // Вывеска CASINO
    const signTex = createTextTexture('CASINO', '#FFD700', '#000000');
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(w-4, 8, 1), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x333333 }));
    signMesh.position.set(0, h - 10, d/2 + 0.6);
    group.add(signMesh);

    // Двери
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 1), trimMat);
    doorFrame.position.set(0, 5, d/2 + 0.5);
    group.add(doorFrame);

    const doorPivot = new THREE.Group();
    doorPivot.position.set(-3.5, 0, d/2 + 0.6);
    
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 0.4), new THREE.MeshStandardMaterial({ color: 0x330000 }));
    doorMesh.position.set(3.5, 4.5, 0); // Сдвиг для вращения от края
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.5), trimMat);
    handle.position.set(6, 4.5, 0.3);
    doorMesh.add(handle);
    
    doorPivot.add(doorMesh);
    group.add(doorPivot);
    casinoDoorGroup = doorPivot;

    // --- СТОЛ РУЛЕТКИ ВНУТРИ ---
    const tGroup = new THREE.Group();
    // Ножка стола
    const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(1, 2, 3, 16), new THREE.MeshStandardMaterial({color: 0x3d2b1f}));
    tLeg.position.y = 1.5;
    tGroup.add(tLeg);
    // Столешница (зеленое сукно)
    const tTop = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 10), new THREE.MeshStandardMaterial({color: 0x006400}));
    tTop.position.y = 3;
    tGroup.add(tTop);
    
    // Колесо (корпус)
    const wBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.6, 32), new THREE.MeshStandardMaterial({color: 0x3d2b1f}));
    wBase.position.set(0, 3.5, -2.5);
    tGroup.add(wBase);

    // Вращающаяся часть колеса
    const wheelMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.7, 32), new THREE.MeshStandardMaterial({color: 0x111111}));
    // Добавим сектора "цветом" через текстуру или детали (упрощенно - золотая крестовина)
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.71, 2.8), trimMat);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.71, 0.2), trimMat);
    wheelMesh.add(cross1, cross2);
    
    wheelMesh.position.set(0, 3.5, -2.5);
    tGroup.add(wheelMesh);
    rouletteWheel = wheelMesh;

    // Шарик
    const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
    // Шарик пока спрячем или поставим в центр
    ballMesh.position.set(0, 4.0, -2.5);
    tGroup.add(ballMesh);
    rouletteBall = ballMesh;

    // Коллизия стола
    const invisibleTable = createInvisibleWall(x, 3, z, 6, 3, 10);
    walls.push(invisibleTable);

    tGroup.position.set(0, 0, 0); // В центре казино
    group.add(tGroup);
    rouletteTable = tGroup;

    group.position.set(x, 0, z);
    scene.add(group);
}

function createBusStop(x, z, axis = 'z') {
   const group = new THREE.Group();
   const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
   const pole1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 0.2), frameMat); pole1.position.set(3, 2, 0);
   const pole2 = pole1.clone(); pole2.position.set(-3, 2, 0);
   const roof = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 4), frameMat); roof.position.y = 4;
   const bench = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 1), new THREE.MeshStandardMaterial({color: 0x654321})); bench.position.set(0, 0.5, 0);
   group.add(pole1, pole2, roof, bench); 
   group.position.set(x, 0, z); 
   if(axis === 'x') group.rotation.y = Math.PI / 2;
   scene.add(group);
   busStops.push(new THREE.Vector3(x, 0, z));
}

function createBench(x, z) {
   const bench = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: 0x654321 });
   const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), wood); seat.position.y = 0.5; seat.castShadow = true;
   const back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 0.1), wood); back.position.set(0, 0.9, -0.45); back.castShadow = true;
   bench.add(seat, back); bench.position.set(x, 0, z); scene.add(bench);
}

function createRock(x, z) {
   const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.random()*0.4), new THREE.MeshStandardMaterial({ color: 0x888888 }));
   rock.position.set(x, 0.2, z); rock.rotation.set(Math.random(), Math.random(), Math.random()); rock.castShadow = true;
   scene.add(rock);
}

function createTree(x, z) {
   const treeGroup = new THREE.Group();
   const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3), new THREE.MeshStandardMaterial({ color: 0x4d2902 }));
   trunk.position.y = 1.5; trunk.castShadow = true;
   const leaves = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2d5a27 }));
   leaves.position.y = 4; leaves.castShadow = true;
   treeGroup.add(trunk, leaves); treeGroup.position.set(x, 0, z); scene.add(treeGroup);
}

// --- ЗОМБИ И КРОВЬ ---
const zombies = [];
const particles = [];

function createZombie(x, z) {
   const zombieGroup = new THREE.Group();
   const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a8d4a });
   const clothesMat = new THREE.MeshStandardMaterial({ color: 0x505050 });
   const hairMat = new THREE.MeshStandardMaterial({ color: 0x0a220a });

   const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.5), clothesMat);
   body.position.y = 1.8; body.castShadow = true; body.receiveShadow = true;
   zombieGroup.add(body);
   const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), skinMat);
   head.position.y = 2.8; head.castShadow = true;
   zombieGroup.add(head);

   const eyeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.05);
   const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
   const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(0.18, 2.9, 0.35);
   const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(-0.18, 2.9, 0.35);
   const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0x660000 }));
   mouth.position.set(0, 2.65, 0.35);
   zombieGroup.add(leftEye, rightEye, mouth);
   
   const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.75), hairMat); hair.position.y = 3.1; zombieGroup.add(hair);

   const legGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
   const lL = new THREE.Mesh(legGeo, clothesMat); lL.position.set(0.2, 0.6, 0); lL.castShadow = true;
   const rL = new THREE.Mesh(legGeo, clothesMat); rL.position.set(-0.2, 0.6, 0); rL.castShadow = true;
   zombieGroup.add(lL, rL);

   const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
   const lA = new THREE.Mesh(armGeo, skinMat); lA.position.set(0.5, 1.8, 0.2); lA.castShadow = true;
   const rA = new THREE.Mesh(armGeo, skinMat); rA.position.set(-0.5, 1.8, 0.2); rA.castShadow = true;
   zombieGroup.add(lA, rA);

   zombieGroup.position.set(x, 0, z);
   scene.add(zombieGroup);
   
   const zMarker = new THREE.Mesh(new THREE.CircleGeometry(2, 16), new THREE.MeshBasicMaterial({ color: 0xff0000, depthTest: false }));
   zMarker.position.y = 50; zMarker.rotation.x = -Math.PI/2; zMarker.renderOrder = 998; zMarker.layers.set(1);
   zombieGroup.add(zMarker);

   zombies.push({ 
       mesh: zombieGroup, leftLeg: lL, rightLeg: rL, leftArm: lA, rightArm: rA, 
       falling: false, fallProgress: 0, dead: false, marker: zMarker,
       isAttacking: false, attackTime: 0 
   });
}

function createBloodExplosion(pos) {
   for (let i = 0; i < 40; i++) {
       const p = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0x880000 }));
       p.position.copy(pos); scene.add(p);
       const v = new THREE.Vector3((Math.random()-0.5)*15, Math.random()*15, (Math.random()-0.5)*15);
       particles.push({ mesh: p, velocity: v, life: 1.0 });
   }
}

function addMoney(amount) {
    balance += amount;
    moneyCont.innerText = `$${balance}`;
}

function killZombie(zData, hitPoint, impactVector = null, weaponType = 'pistol') {
   if (zData.dead) return;
   zData.dead = true;
   playSound('zombieDeath');
   addMoney(1);
   score++;
   scoreDisplay.innerText = `Убито зомби: ${score}`;

   if(zData.marker) zData.marker.visible = false;
   
   if (weaponType === 'knife') {
       scene.remove(zData.mesh);
       
       const top = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x5a8d4a }));
       const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), new THREE.MeshStandardMaterial({ color: 0x505050 }));
       top.position.copy(zData.mesh.position).add(new THREE.Vector3(0, 2.5, 0));
       bottom.position.copy(zData.mesh.position).add(new THREE.Vector3(0, 0.5, 0));
       scene.add(top, bottom);
       
       createBloodExplosion(hitPoint || zData.mesh.position);
       
       let v1 = new THREE.Vector3((Math.random()-0.5)*5, 5, (Math.random()-0.5)*5);
       let v2 = new THREE.Vector3((Math.random()-0.5)*5, 2, (Math.random()-0.5)*5);
       
       particles.push({ mesh: top, velocity: v1, life: 2, isPart: true });
       particles.push({ mesh: bottom, velocity: v2, life: 2, isPart: true });
       
       setTimeout(() => {
           scene.remove(top); scene.remove(bottom);
           const index = zombies.indexOf(zData);
           if (index > -1) zombies.splice(index, 1);
           createZombie(Math.random()*400-200, Math.random()*400-200);
       }, 2000);

   } else {
       zData.falling = true;
       createBloodExplosion(hitPoint || zData.mesh.position.clone().add(new THREE.Vector3(0,2,0)));
       setTimeout(() => {
           if (zData.mesh.parent) scene.remove(zData.mesh);
           const index = zombies.indexOf(zData);
           if (index > -1) zombies.splice(index, 1);
           createZombie(Math.random()*400-200, Math.random()*400-200);
       }, 5000);
   }
}

// --- ГЕНЕРАЦИЯ МИРА ---
function initWorld() {
   const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x3d6e35 }));
   ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
   
   const step = 80;
   let supermarketCreated = false;
   let casinoCreated = false;

   // 1. Создаем дороги по оси Z (Вертикальные)
   for (let x = -240; x <= 240; x += step) {
       const road = new THREE.Mesh(new THREE.PlaneGeometry(22, 2000), new THREE.MeshStandardMaterial({ color: 0x222222 }));
       road.rotation.x = -Math.PI / 2; road.position.set(x, 0.01, 0); road.receiveShadow = true; scene.add(road);
       
       // Разметка
       for(let m = -1000; m < 1000; m += 40) {
           const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 15), new THREE.MeshBasicMaterial({ color: 0xffffff }));
           dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.03, m); dash.receiveShadow = true; scene.add(dash);
       }

       // Светофоры (только на перекрестках, логика ниже)
       for(let zT = -240; zT <= 240; zT += step) {
           createTrafficLight(x + 10, zT + 10, 'z'); // Светофор для Z
           createTrafficLight(x - 10, zT - 10, 'z'); // Встречный
           
           // Пешеходные переходы на перекрестках
           createZebra(x, zT + 14, 0);
           createZebra(x, zT - 14, 0);
       }

       // Тротуары - теперь это BoxGeometry (Бордюры), приподнятые
       // Делаем их частями, чтобы прерывались на перекрестках? 
       // Для простоты оставим длинными, а перекрестки просто наложим
       const curbHeight = 0.4;
       const curbY = curbHeight / 2;
       
       const sidewalkL = new THREE.Mesh(new THREE.BoxGeometry(6, curbHeight, 2000), new THREE.MeshStandardMaterial({ color: 0x777777 }));
       sidewalkL.position.set(x - 14, curbY, 0); sidewalkL.receiveShadow = true; scene.add(sidewalkL);
       
       const sidewalkR = sidewalkL.clone(); 
       sidewalkR.position.x = x + 14; scene.add(sidewalkR);
       
       createBusStop(x - 16, -50, 'z'); createBusStop(x + 16, 150, 'z');

       // Машины по Z
       for (let j = 0; j < 5; j++) {
           if(Math.random() > 0.1) createCar(x + 5.5, (Math.random()*2000)-1000, Math.random()*0xffffff, 1, 'z');
           if(Math.random() < 0.1) createBus(x + 5.5, (Math.random()*2000)-1000, 1, 'z');
           if(Math.random() > 0.1) createCar(x - 5.5, (Math.random()*2000)-1000, Math.random()*0xffffff, -1, 'z');
           if(Math.random() < 0.1) createBus(x - 5.5, (Math.random()*2000)-1000, -1, 'z');
       }
       
       // NPC и объекты
       for (let j = 0; j < 5; j++) {
           createRock(x + 25 + Math.random()*5, (Math.random()-0.5)*2000);
           createPerson(x - 14, (Math.random()-0.5)*2000); createPerson(x + 14, (Math.random()-0.5)*2000);
       }

       // Здания (пропускаем места перекрестков)
       for (let z = -240; z <= 240; z += step) {
           const buildingX = x + 40;
           // Проверка, чтобы не ставить здание на перекрестках или дорогах X
           // Дороги X идут на z = -240, -160, -80, 0, 80...
           // Здания ставим посередине квартала
           
           if (Math.abs(buildingX - 40) < 30 && z > -100 && z < 20) continue; 
           
           if (!supermarketCreated && z > 100) {
               createSupermarket(x + 50, z + 40); supermarketCreated = true; continue; 
           }

           // КАЗИНО (вдали от особняка, который примерно на z=-50)
           if (!casinoCreated && z < -180 && x > 50) {
               createCasino(x + 50, z + 40); casinoCreated = true; continue;
           }

           const h = 25 + Math.random() * 45;
           const bGroup = new THREE.Group();
           const bBody = new THREE.Mesh(new THREE.BoxGeometry(35, h, 35), new THREE.MeshStandardMaterial({ color: 0xf5f5dc }));
           bBody.position.y = h/2; bBody.castShadow = true; bBody.receiveShadow = true; bGroup.add(bBody);
           const cornice = new THREE.Mesh(new THREE.BoxGeometry(37, 1, 37), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
           cornice.position.y = h; bGroup.add(cornice);
           walls.push(bBody);

           const winMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
           const balconyMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
           for(let row=1; row<Math.floor(h/5); row++){
               for(let col=0; col<4; col++){
                   const wx = -14 + col*9; const wy = row*5;
                   const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), winMat); 
                   win.position.set(wx, wy, 17.6); bGroup.add(win);
                   const balcony = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 2), balconyMat);
                   balcony.position.set(wx, wy - 2.5, 18.5); balcony.castShadow = true; bGroup.add(balcony);
               }
           }
           bGroup.position.set(x + 40, 0, z + 40); // Смещаем в центр квартала
           scene.add(bGroup);
           createTree(x + 20, z + 55); createBench(x + 15, z + 65);
       }
   }

   // 2. Создаем дороги по оси X (Горизонтальные) - ПЕРЕКРЕСТНОЕ ДВИЖЕНИЕ
   for (let z = -240; z <= 240; z += step) {
       const road = new THREE.Mesh(new THREE.PlaneGeometry(2000, 22), new THREE.MeshStandardMaterial({ color: 0x222222 }));
       road.rotation.x = -Math.PI / 2; road.position.set(0, 0.011, z); // Чуть выше Z дорог чтобы не мелькало
       road.receiveShadow = true; scene.add(road);

       // Разметка
       for(let m = -1000; m < 1000; m += 40) {
           const dash = new THREE.Mesh(new THREE.PlaneGeometry(15, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
           dash.rotation.x = -Math.PI / 2; dash.position.set(m, 0.031, z); dash.receiveShadow = true; scene.add(dash);
       }
       
       // Светофоры для оси X
       for(let xT = -240; xT <= 240; xT += step) {
           createTrafficLight(xT - 10, z + 10, 'x');
           createTrafficLight(xT + 10, z - 10, 'x');
           
           // Пешеходные переходы
           createZebra(xT + 14, z, Math.PI / 2);
           createZebra(xT - 14, z, Math.PI / 2);
       }

        // Машины по X
       for (let j = 0; j < 5; j++) {
           if(Math.random() > 0.1) createCar((Math.random()*2000)-1000, z + 5.5, Math.random()*0xffffff, 1, 'x');
           if(Math.random() > 0.1) createCar((Math.random()*2000)-1000, z - 5.5, Math.random()*0xffffff, -1, 'x');
       }
   }
}

function spawnInitialZombies(count) {
   for(let i=0; i<count; i++) createZombie(Math.random() * 400 - 200, Math.random() * 400 - 200);
}

// --- ДОМ И МАШИНА ---
let myDoor = null; let isDoorOpen = false;
let myGate = null; let isGateOpen = false; let gateBlocker = null;
let myGarageDoor = null; let isGarageOpen = false;
let myCar = null; let isDriving = false;

function createMyCar(x, z) {
   const carGroup = new THREE.Group();
   const bodyGeo = new THREE.BoxGeometry(2.4, 0.8, 4.8);
   const bodyMat = new THREE.MeshStandardMaterial({color: 0xaa0000}); 
   const body = new THREE.Mesh(bodyGeo, bodyMat);
   body.position.y = 0.6; body.castShadow = true; carGroup.add(body);
   const topGeo = new THREE.BoxGeometry(2.2, 0.7, 2.8);
   const top = new THREE.Mesh(topGeo, bodyMat);
   top.position.set(0, 1.35, -0.2); carGroup.add(top);

   const glassMat = new THREE.MeshStandardMaterial({ color: 0xccccff, transparent: true, opacity: 0.5 });
   const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), glassMat);
   windshield.position.set(0, 1.35, 1.21); windshield.rotation.x = -0.2; carGroup.add(windshield);

   const wheelGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
   const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
   const steeringWheel = new THREE.Mesh(wheelGeo, wheelMat);
   steeringWheel.position.set(0.5, 1.1, 0.6); steeringWheel.rotation.x = -0.5; carGroup.add(steeringWheel);
   const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), new THREE.MeshStandardMaterial({color: 0x333333}));
   seat.position.set(0.5, 0.6, 0.2); carGroup.add(seat);

   const wheel1 = createWheel(1.2, 0.45, 1.6); const wheel2 = createWheel(-1.2, 0.45, 1.6);
   const wheel3 = createWheel(1.2, 0.45, -1.6); const wheel4 = createWheel(-1.2, 0.45, -1.6);
   carGroup.add(wheel1, wheel2, wheel3, wheel4);
   carGroup.position.set(x, 0, z); scene.add(carGroup);

   myCar = { mesh: carGroup, speed: 0, steering: 0, steeringWheel: steeringWheel, wheels: [wheel1, wheel2, wheel3, wheel4] };
}

function createFullBasketballCourt(x, z) {
    const courtGeo = new THREE.BoxGeometry(16, 0.2, 28);
    const courtMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const floor = new THREE.Mesh(courtGeo, courtMat); floor.position.set(x, 0.1, z); floor.receiveShadow = true; scene.add(floor);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const midLine = new THREE.Mesh(new THREE.PlaneGeometry(15, 0.2), lineMat); midLine.rotation.x = -Math.PI/2; midLine.position.set(x, 0.21, z); scene.add(midLine);
    const centerCircle = new THREE.Mesh(new THREE.RingGeometry(1.8, 2.0, 32), lineMat); centerCircle.rotation.x = -Math.PI/2; centerCircle.position.set(x, 0.21, z); scene.add(centerCircle);
    const borderL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 28), lineMat); borderL.rotation.x = -Math.PI/2; borderL.position.set(x - 7.5, 0.21, z); scene.add(borderL);
    const borderR = borderL.clone(); borderR.position.set(x + 7.5, 0.21, z); scene.add(borderR);
    const borderT = new THREE.Mesh(new THREE.PlaneGeometry(15, 0.2), lineMat); borderT.rotation.x = -Math.PI/2; borderT.position.set(x, 0.21, z - 13.9); scene.add(borderT);
    const borderB = borderT.clone(); borderB.position.set(x, 0.21, z + 13.9); scene.add(borderB);

    function createHoop(hx, hz, rotY) {
        const hoopGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5), new THREE.MeshStandardMaterial({color:0x222222})); pole.position.set(0, 2.25, 0); hoopGroup.add(pole);
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.1), new THREE.MeshStandardMaterial({color:0xffffff})); board.position.set(0, 3.8, 0.4); hoopGroup.add(board);
        const square = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), new THREE.MeshBasicMaterial({color: 0xff6600})); square.position.set(0, 3.6, 0.46); hoopGroup.add(square);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 8, 24), new THREE.MeshStandardMaterial({color:0xff0000})); rim.rotation.x = Math.PI / 2; rim.position.set(0, 3.6, 1.0); hoopGroup.add(rim);
        const netGeo = new THREE.CylinderGeometry(0.45, 0.25, 0.6, 12, 1, true); const netMat = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true, side: THREE.DoubleSide});
        const net = new THREE.Mesh(netGeo, netMat); net.position.set(0, 3.3, 1.0); hoopGroup.add(net);
        hoopGroup.position.set(hx, 0, hz); hoopGroup.rotation.y = rotY; scene.add(hoopGroup);
        const targetPos = new THREE.Vector3(0, 3.8, 1.0); targetPos.applyMatrix4(hoopGroup.matrixWorld); hoopTargets.push(targetPos);
    }
    createHoop(x, z - 13.5, 0); createHoop(x, z + 13.5, Math.PI);
    basketBall = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshStandardMaterial({color: 0xff6600}));
    basketBall.position.set(x, 0.3, z); basketBall.castShadow = true; scene.add(basketBall);
}

function createMyHome() {
   const hX = 40, hZ = -50; 
   const fenceMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
   const postGeo = new THREE.BoxGeometry(0.5, 2, 0.5);
   const plankGeo = new THREE.BoxGeometry(4, 0.2, 0.1);
   
   const createFenceSide = (x, z, rotY, count, hasGate) => {
       for(let i = 0; i < count; i++) {
           if (hasGate && i > count/2 - 3 && i < count/2 + 2) continue; 
           const post = new THREE.Mesh(postGeo, fenceMat); post.position.set(0, 1, 0);
           const offset = (i - count/2) * 4;
           const group = new THREE.Group(); group.add(post);
           if(i < count - 1 && !(hasGate && i >= Math.floor(count/2) - 3 && i <= Math.floor(count/2) + 1)) {
               const plank1 = new THREE.Mesh(plankGeo, fenceMat); plank1.position.set(2, 1.5, 0);
               const plank2 = new THREE.Mesh(plankGeo, fenceMat); plank2.position.set(2, 0.8, 0); group.add(plank1, plank2);
           }
           group.position.set(x, 0, z); group.rotation.y = rotY; group.translateX(offset); scene.add(group); walls.push(post);
       }
   };
   createFenceSide(hX, hZ - 20, 0, 10, false); createFenceSide(hX, hZ + 20, 0, 10, true);  
   createFenceSide(hX - 20, hZ, Math.PI/2, 10, false); createFenceSide(hX + 20, hZ, Math.PI/2, 10, false);

   const gateGroup = new THREE.Group(); gateGroup.position.set(hX - 4, 0, hZ + 20); scene.add(gateGroup);
   const gateMesh = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 0.2), new THREE.MeshStandardMaterial({color: 0x3d2b1f}));
   gateMesh.position.set(7, 1, 0); gateGroup.add(gateMesh); myGate = gateGroup;
   gateBlocker = createInvisibleWall(hX + 3, 1, hZ + 20, 14, 4, 1);

   const houseGroup = new THREE.Group(); houseGroup.position.set(hX, 0, hZ); scene.add(houseGroup);
   const wallMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
   const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
   const floor = new THREE.Mesh(new THREE.BoxGeometry(15, 0.5, 15), new THREE.MeshStandardMaterial({color: 0x333333})); floor.position.y = 0.25; houseGroup.add(floor);

   const wBack = new THREE.Mesh(new THREE.BoxGeometry(15, 6, 1), wallMat); wBack.position.set(0, 3, -7); houseGroup.add(wBack);
   const wLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 15), wallMat); wLeft.position.set(-7, 3, 0); houseGroup.add(wLeft);
   const wRight = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 15), wallMat); wRight.position.set(7, 3, 0); houseGroup.add(wRight);
   const wFrontL = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1), wallMat); wFrontL.position.set(-4.5, 3, 7); houseGroup.add(wFrontL);
   const wFrontR = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 1), wallMat); wFrontR.position.set(4.5, 3, 7); houseGroup.add(wFrontR);
   const wFrontTop = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 1), wallMat); wFrontTop.position.set(0, 5, 7); houseGroup.add(wFrontTop);

   createInvisibleWall(hX, 3, hZ - 7, 15, 6, 1); createInvisibleWall(hX - 7, 3, hZ, 1, 6, 15);
   createInvisibleWall(hX + 7, 3, hZ, 1, 6, 15); createInvisibleWall(hX - 4.5, 3, hZ + 7, 6, 6, 1); createInvisibleWall(hX + 4.5, 3, hZ + 7, 6, 6, 1);

   const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 5, 4), roofMat); roof.position.set(0, 8.5, 0); roof.rotation.y = Math.PI/4; houseGroup.add(roof);
   const winGeo = new THREE.PlaneGeometry(3, 3); const winMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb });
   const win1 = new THREE.Mesh(winGeo, winMat); win1.position.set(-7.1, 3, 0); win1.rotation.y = -Math.PI/2;
   const win2 = new THREE.Mesh(winGeo, winMat); win2.position.set(7.1, 3, 0); win2.rotation.y = Math.PI/2;
   houseGroup.add(win1, win2);

   const garageMat = new THREE.MeshStandardMaterial({color: 0x999999});
   const gWallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 12), garageMat); gWallL.position.set(12 - 3.75, 2.5, -1); houseGroup.add(gWallL);
   const gWallR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 12), garageMat); gWallR.position.set(12 + 3.75, 2.5, -1); houseGroup.add(gWallR);
   const gWallB = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 0.5), garageMat); gWallB.position.set(12, 2.5, -1 - 5.75); houseGroup.add(gWallB);
   const gRoof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 12), garageMat); gRoof.position.set(12, 5.25, -1); houseGroup.add(gRoof);
   const gDoorGroup = new THREE.Group(); gDoorGroup.position.set(12, 2, 5.1); 
   const gDoorMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({color: 0x444444}));
   gDoorGroup.add(gDoorMesh); houseGroup.add(gDoorGroup); myGarageDoor = gDoorGroup;
   createInvisibleWall(hX + 12 - 3.75, 2.5, hZ - 1, 0.5, 5, 12); createInvisibleWall(hX + 12 + 3.75, 2.5, hZ - 1, 0.5, 5, 12); 
   createInvisibleWall(hX + 12, 2.5, hZ - 1 - 5.75, 8, 5, 0.5); walls.push(gDoorMesh);
   createMyCar(hX + 12, hZ);

   const doorGroup = new THREE.Group(); doorGroup.position.set(-1.5, 0, 7); houseGroup.add(doorGroup);
   const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.2), new THREE.MeshStandardMaterial({color: 0x5c3a21})); doorMesh.position.set(1.5, 2, 0); doorGroup.add(doorMesh);
   const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshStandardMaterial({color: 0xffff00})); knob.position.set(2.6, 2, 0.15); doorGroup.add(knob); myDoor = doorGroup;

   const bed = new THREE.Group(); const mattress = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 5), new THREE.MeshStandardMaterial({color: 0xffffff}));
   const pillow = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1), new THREE.MeshStandardMaterial({color: 0xffcccc})); pillow.position.set(0, 0.5, -2);
   bed.add(mattress, pillow); bed.position.set(-4, 0.5, -4); houseGroup.add(bed); createInvisibleWall(hX - 4, 0.5, hZ - 4, 3, 2, 5);
   const kitchen = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.5), new THREE.MeshStandardMaterial({color: 0x222222})); kitchen.position.set(4, 0.6, -6); houseGroup.add(kitchen);
   const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), new THREE.MeshStandardMaterial({color: 0xeeeeee})); fridge.position.set(6, 1.5, -6); houseGroup.add(fridge);
   createInvisibleWall(hX + 4, 0.6, hZ - 6, 4, 1.2, 1.5); createInvisibleWall(hX + 6, 1.5, hZ - 6, 1.5, 3, 1.5);
   
   // Баскетбольная площадка перенесена отсюда на траву
   createFullBasketballCourt(120, 120);
}

// --- УПРАВЛЕНИЕ ---
const controls = new PointerLockControls(camera, document.body);
const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
let score = 0;

startBtn.onclick = () => controls.lock();
controls.addEventListener('lock', () => {
   if (isDead) return;
   document.getElementById('overlay').style.display = 'none';
   if(isShopModalOpen) closeShopModal();
   if(isRouletteModalOpen) closeRouletteModal();
});
controls.addEventListener('unlock', () => {
   if (!isDead && !isShopModalOpen && !isRouletteModalOpen) document.getElementById('overlay').style.display = 'flex';
});

document.getElementById('restart-btn').onclick = () => {
   health = 100; score = 0; balance = 0; isDead = false;
   scoreDisplay.innerText = `Убито зомби: 0`; moneyCont.innerText = `$0`;
   document.getElementById('hp-bar').style.width = '100%';
   deathScreen.style.display = 'none';
   camera.position.set(0, 2.2, 0); controls.lock();
};

function closeShopModal() {
    shopModal.style.display = 'none'; isShopModalOpen = false; currentShopItem = null; controls.lock();
}
document.getElementById('btn-buy-no').onclick = closeShopModal;
document.getElementById('btn-buy-yes').onclick = () => {
    if (currentShopItem) {
        if (balance >= currentShopItem.price) {
            balance -= currentShopItem.price;
            moneyCont.innerText = `$${balance}`;
            alert(`Вы купили ${currentShopItem.name}!`);
        } else {
            alert("Не хватает денег!");
        }
        closeShopModal();
    }
};

// --- ФУНКЦИИ КАЗИНО ---
function openRouletteModal() {
    isRouletteModalOpen = true;
    controls.unlock();
    rouletteModal.style.display = 'block';
    document.getElementById('roulette-msg').innerText = "После ставки нажмите P для запуска";
    rouletteResult.style.display = 'none';
}

function closeRouletteModal() {
    isRouletteModalOpen = false;
    rouletteModal.style.display = 'none';
    controls.lock();
}

document.getElementById('btn-roulette-close').onclick = closeRouletteModal;

document.getElementById('btn-roulette-bet').onclick = () => {
    const amount = parseInt(document.getElementById('roulette-input-amount').value);
    const number = parseInt(document.getElementById('roulette-input-number').value);

    if (isNaN(amount) || amount <= 0) {
        alert("Введите корректную сумму!"); return;
    }
    if (amount > balance) {
        alert("Недостаточно средств!"); return;
    }
    if (isNaN(number) || number < 0 || number > 36) {
        alert("Выберите число от 0 до 36!"); return;
    }

    // Сохраняем ставку
    balance -= amount;
    moneyCont.innerText = `$${balance}`;
    currentBet = { active: true, amount: amount, number: number };
    document.getElementById('roulette-msg').innerText = `Ставка: $${amount} на число ${number}. Нажмите P!`;
    document.getElementById('roulette-msg').style.color = '#0f0';
};

let moveF = false, moveB = false, moveL = false, moveR = false;
let velocity = new THREE.Vector3();
let seatedBus = null;

window.onkeydown = (e) => {
   if (isDead) return;
   if (e.code === 'KeyW') moveF = true; if (e.code === 'KeyS') moveB = true;
   if (e.code === 'KeyA') moveL = true; if (e.code === 'KeyD') moveR = true;
   if (e.code === 'Digit1') switchWeapon('knife');
   if (e.code === 'Digit2') switchWeapon('pistol');
   if (e.code === 'Digit3') switchWeapon('sniper');
   
   if (e.code === 'Space' && camera.position.y <= 2.3) {
       velocity.y += 15; playSound('jump', 0.5);
   }
   
   if (e.code === 'KeyG') {
       isThirdPerson = !isThirdPerson;
       playerGroup.visible = isThirdPerson && !isDriving;
       weaponGroup.visible = !isThirdPerson && !isDriving;
       if (hasBall && basketBall) {
           if(isThirdPerson) { pRightArm.add(basketBall); basketBall.position.set(0, -0.4, 0); } 
           else { camera.add(basketBall); basketBall.position.set(0.3, -0.3, -0.5); }
       }
   }

   if (e.code === 'KeyE') {
       if (hasBall && !isBallFlying) {
           const distToTarget = camera.position.distanceTo(basketHoopTarget);
           const validTarget = distToTarget < 25 && basketHoopTarget.length() > 0;
           hasBall = false; isBallFlying = true;
           let ballWorldPos = new THREE.Vector3(); basketBall.getWorldPosition(ballWorldPos);
           scene.add(basketBall); basketBall.position.copy(ballWorldPos);
           
           const startPos = basketBall.position.clone();
           let endPos = new THREE.Vector3();
           if (validTarget) {
               const isGoal = Math.random() < 0.5;
               endPos.copy(basketHoopTarget);
               if (!isGoal) {
                   endPos.x += (Math.random() - 0.5) * 1.5; 
                   endPos.y += (Math.random()) * 0.8;
                   endPos.z += (Math.random() - 0.5) * 1.5;
               }
           } else {
               const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
               endPos.copy(startPos).add(dir.multiplyScalar(10)); endPos.y += 2;
           }
           
           let startTime = performance.now();
           const animateBall = () => {
               const t = Math.min((performance.now() - startTime) / 1000, 1);
               const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, t);
               currentPos.y += Math.sin(t * Math.PI) * 4; 
               basketBall.position.copy(currentPos);
               if (t < 1) requestAnimationFrame(animateBall);
               else {
                   isBallFlying = false; basketBall.position.copy(endPos);
                   setTimeout(() => {
                       basketBall.position.y = 0.3; basketBall.position.x += (Math.random()-0.5) * 2; basketBall.position.z += (Math.random()-0.5) * 2;
                   }, 500);
               }
           };
           animateBall();
       }
   }

   if (e.code === 'KeyB') {
       if (!isDriving && !isShopModalOpen) {
           let foundItem = null;
           for(let shelf of shopShelves) {
               if(camera.position.distanceTo(shelf.pos) < 3.0) { foundItem = shelf; break; }
           }
           if (foundItem) {
               currentShopItem = foundItem; isShopModalOpen = true; controls.unlock();
               document.getElementById('shop-title').innerText = `Покупка: ${foundItem.name}`;
               document.getElementById('shop-text').innerText = `Купить за $${foundItem.price}? Ваш баланс: $${balance}`;
               shopModal.style.display = 'block';
           }
       }
   }

   // --- ОТКРЫТИЕ РУЛЕТКИ (КНОПКА O) ---
   if (e.code === 'KeyO') {
       if (rouletteTable) {
           const worldPos = new THREE.Vector3();
           rouletteTable.getWorldPosition(worldPos);
           if (camera.position.distanceTo(worldPos) < 5.0) {
               openRouletteModal();
           }
       }
   }

   // --- ЗАПУСК РУЛЕТКИ (КНОПКА P) ---
   if (e.code === 'KeyP') {
       if (currentBet.active && !isSpinning) {
           if(isRouletteModalOpen) closeRouletteModal();
           isSpinning = true;
           spinVelocity = 0.5; // Начальная скорость вращения колеса
           ballVelocity = 0.8; // Начальная скорость шарика (быстрее колеса)
           spinTimer = 0;
           ballHeightOffset = 0;
           rouletteResult.style.display = 'none';
           // Сброс шарика на край
           rouletteBall.position.set(0, 4.0, -2.5); // Локальные координаты относительно стола (немного криво, но пойдет для анимации)
       }
   }

   if (e.code === 'KeyJ') {
       if (myDoor && camera.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(myDoor.matrixWorld)) < 5) isDoorOpen = !isDoorOpen;
       if (myGate && camera.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(myGate.matrixWorld)) < 15) { 
           isGateOpen = !isGateOpen;
           if (gateBlocker) gateBlocker.position.y = isGateOpen ? -100 : 1;
       }
       if (myGarageDoor && camera.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(myGarageDoor.matrixWorld)) < 8) isGarageOpen = !isGarageOpen;
       if (shopDoorGroup && camera.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(shopDoorGroup.matrixWorld)) < 6) isShopDoorOpen = !isShopDoorOpen;
       if (casinoDoorGroup && camera.position.distanceTo(new THREE.Vector3().setFromMatrixPosition(casinoDoorGroup.matrixWorld)) < 15) isCasinoDoorOpen = !isCasinoDoorOpen;
   }

   if (e.code === 'KeyF') {
       if (seatedBus) { seatedBus = null; camera.position.y = 2.2; } 
       else if (isDriving) {
           isDriving = false;
           const exitPos = myCar.mesh.position.clone(); exitPos.x += 2; 
           camera.position.copy(exitPos); camera.position.y = 2.2; camera.lookAt(exitPos.x + 5, 2.2, exitPos.z); 
           weaponGroup.visible = !isThirdPerson; playerGroup.visible = isThirdPerson;
           document.getElementById('speedometer-container').style.display = 'none';
           if(hasBall) { 
               if(isThirdPerson) pRightArm.add(basketBall); else camera.add(basketBall);
           }
       } else {
           let found = false;
           traffic.forEach(t => {
               if (t.isBus && t.mesh.position.distanceTo(camera.position) < 8) {
                   seatedBus = t; moveF = moveB = moveL = moveR = false; found = true;
               }
           });
           if(!found && myCar) {
               if(myCar.mesh.position.distanceTo(camera.position) < 5) {
                   isDriving = true; weaponGroup.visible = false; playerGroup.visible = false;
                   document.getElementById('speedometer-container').style.display = 'flex';
                   if(hasBall) { scene.add(basketBall); basketBall.visible = false; }
               }
           }
       }
   }
};

window.onkeyup = (e) => {
   if (e.code === 'KeyW') moveF = false; if (e.code === 'KeyS') moveB = false;
   if (e.code === 'KeyA') moveL = false; if (e.code === 'KeyD') moveR = false;
};

window.onmousedown = () => {
   if (!controls.isLocked || isDead || hasBall || isShopModalOpen || isRouletteModalOpen) return;
   const activeModel = weapons[currentWeapon].model;
   if (activeModel) {
       activeModel.position.z += 0.2;
       if (currentWeapon === 'knife') activeModel.rotation.x -= 0.5;
       setTimeout(() => {
           activeModel.position.z -= 0.2;
           if (currentWeapon === 'knife') activeModel.rotation.x += 0.5;
       }, 100);
   }

   if (currentWeapon === 'pistol') playSound('shoot');
   if (currentWeapon === 'sniper') playSound('sniper');

   if (currentWeapon !== 'knife') {
       const flash = new THREE.PointLight(0xffaa00, 2, 5);
       const flashM = new THREE.Mesh(new THREE.SphereGeometry(0.15), new THREE.MeshBasicMaterial({color:0xffff00}));
       flash.add(flashM);
       if (isThirdPerson) {
           flash.position.copy(playerGroup.position).add(new THREE.Vector3(0, 1.5, 0)).add(new THREE.Vector3(0, 0, 1).applyQuaternion(playerGroup.quaternion));
       } else {
           const fPos = new THREE.Vector3(0.2, -0.2, -1.5).applyMatrix4(camera.matrixWorld);
           flash.position.copy(fPos);
       }
       scene.add(flash); setTimeout(() => scene.remove(flash), 50);
   }

   const ray = new THREE.Raycaster();
   ray.setFromCamera(new THREE.Vector2(0,0), camera);
   
   const allTargets = [
       ...zombies.map(z => ({ mesh: z.mesh, data: z, type: 'zombie' })),
       ...people.map(p => ({ mesh: p.mesh, data: p, type: 'person' }))
   ];

   const hits = ray.intersectObjects(allTargets.map(t => t.mesh), true);
   
   if (hits.length > 0) {
       const hit = hits[0];
       const dist = hit.distance;
       let root = hit.object;
       while(root.parent && !allTargets.find(t => t.mesh === root)) root = root.parent;
       
       const targetObj = allTargets.find(t => t.mesh === root);
       
       if (targetObj) {
           const data = targetObj.data;
           if (!data.falling && !data.dead) {
               if (currentWeapon === 'knife' && dist < weapons.knife.range) {
                   if(targetObj.type === 'zombie') killZombie(data, hit.point, null, 'knife');
                   else killPerson(data, hit.point, 'knife');
               } else if (currentWeapon !== 'knife' && dist < weapons[currentWeapon].range) {
                   if(targetObj.type === 'zombie') killZombie(data, hit.point, null, currentWeapon);
                   else killPerson(data, hit.point, currentWeapon);
               }
           }
       }
   }
};

function die() {
   isDead = true; controls.unlock();
   document.getElementById('overlay').style.display = 'none';
   document.getElementById('final-score').innerText = `Зомби убито: ${score} | Заработано: $${balance}`;
   deathScreen.style.display = 'flex';
}

initWorld(); createMyHome(); initWeapons(); switchWeapon('pistol'); spawnInitialZombies(15);
camera.position.set(0, 2.2, 0);

let prevTime = performance.now();
let walkCycle = 0;
let playerWalkCycle = 0;
let stepTimer = 0;
let globalTrafficTimer = 0;

function animate() {
   requestAnimationFrame(animate);
   const time = performance.now();
   const delta = (time - prevTime) / 1000;

   // --- ЛОГИКА АНИМАЦИИ РУЛЕТКИ ---
   if (isSpinning && rouletteWheel && rouletteBall) {
       spinTimer += delta;
       // Замедление
       spinVelocity *= 0.99;
       ballVelocity *= 0.985;
       
       // Вращение колеса
       rouletteWheel.rotation.y += spinVelocity;
       
       // Вращение шарика (вокруг центра колеса)
       // Используем фиктивный угол для шарика
       if (!rouletteBall.userData.angle) rouletteBall.userData.angle = 0;
       rouletteBall.userData.angle -= ballVelocity;
       
       // Прыжки шарика (имитация ячеек)
       const jumpPhase = (time / 50) % (Math.PI * 2);
       ballHeightOffset = Math.abs(Math.sin(jumpPhase * 10)) * 0.1;
       
       // Радиус уменьшается при замедлении
       const radius = 1.2 + (ballVelocity * 2.0); // Чем медленнее, тем ближе к центру (в ячейки)

       rouletteBall.position.set(
           Math.cos(rouletteBall.userData.angle) * radius,
           4.0 + ballHeightOffset, // Относительно стола
           Math.sin(rouletteBall.userData.angle) * radius - 2.5 // -2.5 т.к. центр колеса смещен
       );

       // Остановка
       if (spinVelocity < 0.001 && ballVelocity < 0.001) {
           isSpinning = false;
           // Рандомный результат
           const winningNumber = Math.floor(Math.random() * 37);
           const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
           const colorName = winningNumber === 0 ? "Зеро" : (isRed ? "Красное" : "Черное");
           
           rouletteResult.style.display = 'block';
           rouletteResult.innerHTML = `Выпало: ${winningNumber} <br><span style="font-size:20px; color:${winningNumber===0?'#0f0':(isRed?'#f00':'#fff')}">${colorName}</span>`;
           
           if (currentBet.number === winningNumber) {
               const winAmount = currentBet.amount * 35;
               balance += winAmount;
               moneyCont.innerText = `$${balance}`;
               playSound('jump'); // Звук победы
               setTimeout(() => alert(`ВЫ ВЫИГРАЛИ $${winAmount}!`), 100);
           } else {
               setTimeout(() => alert(`Вы проиграли ставку.`), 100);
           }

           currentBet.active = false;
           setTimeout(() => { rouletteResult.style.display = 'none'; }, 5000);
       }
   }

   // --- СВЕТОФОРЫ ЛОГИКА ---
   globalTrafficTimer += delta;
   // Цикл 20 секунд:
   // 0-8: Z-Зеленый, X-Красный
   // 8-10: Z-Желтый, X-Красный
   // 10-18: Z-Красный, X-Зеленый
   // 18-20: Z-Красный, X-Желтый
   if (globalTrafficTimer > 20) globalTrafficTimer = 0;
   
   trafficLights.forEach(tl => {
       let desiredState = 0; // 0=Green, 1=Yellow, 2=Red
       if (tl.axis === 'z') {
            if (globalTrafficTimer < 8) desiredState = 0;
            else if (globalTrafficTimer < 10) desiredState = 1;
            else desiredState = 2;
       } else { // axis === 'x'
            if (globalTrafficTimer < 10) desiredState = 2;
            else if (globalTrafficTimer < 18) desiredState = 0;
            else desiredState = 1;
       }
       
       tl.state = desiredState;
       tl.greenMat.emissive.setHex(tl.state === 0 ? 0x00ff00 : 0x000000);
       tl.yellowMat.emissive.setHex(tl.state === 1 ? 0xffff00 : 0x000000);
       tl.redMat.emissive.setHex(tl.state === 2 ? 0xff0000 : 0x000000);
   });

   rainTimer += delta;
   if(rainTimer > 15) { 
       rainTimer = 0;
       if(Math.random() > 0.6) {
           isRaining = !isRaining; rainSystem.visible = isRaining;
           scene.fog.density = isRaining ? 0.02 : 0.0025;
           scene.background.setHex(isRaining ? 0x555555 : 0xa0d8ef);
       }
   }
   if(isRaining && rainSystem) {
       const positions = rainSystem.geometry.attributes.position.array;
       for(let i=1; i<positions.length; i+=3) {
           positions[i] -= 200 * delta; 
           if(positions[i] < 0) positions[i] = 200; 
       }
       rainSystem.geometry.attributes.position.needsUpdate = true;
       rainSystem.position.set(camera.position.x, 0, camera.position.z);
   }

   if (isRaining) { if (audioFiles.rain.paused) audioFiles.rain.play(); } else { if (!audioFiles.rain.paused) audioFiles.rain.pause(); }
   if (isDriving && Math.abs(myCar.speed) > 0.1) { if (audioFiles.car.paused) audioFiles.car.play(); } else { if (!audioFiles.car.paused) audioFiles.car.pause(); }

   if (!isDriving && !hasBall && !isBallFlying && basketBall) {
       if (camera.position.distanceTo(basketBall.position) < 2) {
           hasBall = true;
           if(isThirdPerson) { pRightArm.add(basketBall); basketBall.position.set(0, -0.4, 0); } else { camera.add(basketBall); basketBall.position.set(0.3, -0.3, -0.5); }
           interactionHint.innerText = "Нажми E чтобы бросить"; interactionHint.style.display = 'block';
       }
   }
   
   let nearShelf = false;
   if (!isDriving && !isShopModalOpen) {
       for(let shelf of shopShelves) { if(camera.position.distanceTo(shelf.pos) < 3.0) { nearShelf = true; break; } }
   }

   // Проверка расстояния до стола рулетки
   let nearRoulette = false;
   if (rouletteTable && !isDriving && !isRouletteModalOpen) {
       const worldPos = new THREE.Vector3();
       rouletteTable.getWorldPosition(worldPos);
       if(camera.position.distanceTo(worldPos) < 5.0) nearRoulette = true;
   }

   if (hasBall) {
       interactionHint.innerText = "Нажми E чтобы бросить"; interactionHint.style.display = 'block';
       let minD = Infinity; let closest = null;
       hoopTargets.forEach(target => { const d = camera.position.distanceTo(target); if (d < minD) { minD = d; closest = target; } });
       if (closest) basketHoopTarget.copy(closest);
   } else if (nearShelf) {
       interactionHint.innerText = "Нажми B чтобы купить товар"; interactionHint.style.display = 'block';
   } else if (nearRoulette) {
       interactionHint.innerText = "Нажми O чтобы сделать ставку"; interactionHint.style.display = 'block';
   } else {
       interactionHint.style.display = 'none';
   }

   if (myDoor) myDoor.rotation.y += ((isDoorOpen ? -Math.PI / 2 : 0) - myDoor.rotation.y) * 5 * delta;
   if (myGate) myGate.rotation.y += ((isGateOpen ? Math.PI / 2 : 0) - myGate.rotation.y) * 5 * delta;
   if (myGarageDoor) myGarageDoor.position.y += ((isGarageOpen ? 5.5 : 2) - myGarageDoor.position.y) * 2 * delta;
   if (shopDoorGroup) shopDoorGroup.rotation.y += ((isShopDoorOpen ? Math.PI / 2 : 0) - shopDoorGroup.rotation.y) * 5 * delta;
   if (casinoDoorGroup) casinoDoorGroup.rotation.y += ((isCasinoDoorOpen ? -Math.PI / 2 : 0) - casinoDoorGroup.rotation.y) * 5 * delta;

   if (controls.isLocked && !isDead) {
       if (!seatedBus && !isDriving) {
           velocity.x -= velocity.x * 10.0 * delta; velocity.z -= velocity.z * 10.0 * delta; velocity.y -= 9.8 * 4.0 * delta;
           let dir = new THREE.Vector3(); dir.z = Number(moveF) - Number(moveB); dir.x = Number(moveR) - Number(moveL); dir.normalize();
           const speedMultiplier = weapons[currentWeapon].speed;
           
           if (moveF || moveB) velocity.z -= dir.z * 150.0 * delta * speedMultiplier;
           if (moveL || moveR) velocity.x -= dir.x * 150.0 * delta * speedMultiplier;

           if ((moveF || moveB || moveL || moveR) && camera.position.y <= 2.3) {
               stepTimer += delta; if (stepTimer > 0.5) { playSound('step', 0.5); stepTimer = 0; }
           }
           
           let nextPos = camera.position.clone(); nextPos.x += (-velocity.x * delta); nextPos.z += (-velocity.z * delta);
           const playerBox = new THREE.Box3(); playerBox.setFromCenterAndSize(nextPos, new THREE.Vector3(0.5, 1.8, 0.5));
           let hitWall = false;
           for(let w of walls) {
               if (playerBox.intersectsBox(new THREE.Box3().setFromObject(w))) { hitWall = true; break; }
           }
           let canMove = true; if (hitWall) { velocity.x = 0; velocity.z = 0; canMove = false; }

           traffic.forEach(t => {
               if (t.isBus) {
                   const busBox = new THREE.Box3().setFromObject(t.mesh);
                   const isInside = busBox.containsPoint(camera.position);
                   if (isInside) {
                       const localPos = t.mesh.worldToLocal(nextPos.clone());
                       if (Math.abs(localPos.x) > 1.4) canMove = false; 
                       if (localPos.z < -5 || localPos.z > 5) canMove = false; 
                       if (localPos.z < 3.0 && Math.abs(localPos.x) > 0.3) canMove = false;
                       
                       if (t.axis === 'x') camera.position.x += t.speed * delta;
                       else camera.position.z += t.speed * delta;

                   } else {
                       if (busBox.containsPoint(nextPos)) {
                           const localPos = t.mesh.worldToLocal(nextPos.clone());
                           const doorArea = (localPos.z > 3.2 && localPos.z < 4.8 && localPos.x > 1.0);
                           if (!(t.doorOpen > 0.8 && doorArea)) canMove = false;
                       }
                   }
               }
           });

           if (canMove) { controls.moveRight(-velocity.x * delta); controls.moveForward(-velocity.z * delta); }
           camera.position.y += (velocity.y * delta);
           if (camera.position.y < 2.2) { velocity.y = 0; camera.position.y = 2.2; }
       
       } else if (isDriving && myCar) {
           const acceleration = 30 * delta; const maxCarSpeed = 40; const friction = 10 * delta;
           if (moveF) myCar.speed += acceleration; if (moveB) myCar.speed -= acceleration;
           if (!moveF && !moveB) {
               if (myCar.speed > 0) myCar.speed = Math.max(0, myCar.speed - friction);
               if (myCar.speed < 0) myCar.speed = Math.min(0, myCar.speed + friction);
           }
           if (myCar.speed > maxCarSpeed) myCar.speed = maxCarSpeed; if (myCar.speed < -maxCarSpeed/2) myCar.speed = -maxCarSpeed/2;
           if (Math.abs(myCar.speed) > 0.1) {
               const turnSpeed = 2.0 * delta * (myCar.speed > 0 ? 1 : -1);
               if (moveL) myCar.steering += turnSpeed; if (moveR) myCar.steering -= turnSpeed;
           }
           myCar.mesh.rotation.y += (moveL ? 1 : (moveR ? -1 : 0)) * delta * (myCar.speed/10);
           if (moveL) myCar.steeringWheel.rotation.z += 5 * delta; if (moveR) myCar.steeringWheel.rotation.z -= 5 * delta;
           const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0,1,0), myCar.mesh.rotation.y);
           const nextPos = myCar.mesh.position.clone().add(forward.multiplyScalar(myCar.speed * delta));
           const carBox = new THREE.Box3(); carBox.setFromCenterAndSize(nextPos, new THREE.Vector3(2.4, 1, 4.8));
           let hit = false;
           for(let w of walls) { if (carBox.intersectsBox(new THREE.Box3().setFromObject(w))) { hit = true; break; } }
           if (!hit) myCar.mesh.position.copy(nextPos); else myCar.speed = 0;

           if (Math.abs(myCar.speed) > 10) { 
               [...zombies, ...people].forEach(target => {
                   if (!target.dead && !target.falling) {
                       const dist = target.mesh.position.distanceTo(myCar.mesh.position);
                       if (dist < 4) { 
                           if(zombies.includes(target)) killZombie(target, target.mesh.position.clone(), forward, 'car');
                           else killPerson(target, target.mesh.position.clone(), 'car');
                       }
                   }
               });
           }
           document.getElementById('speed-value').innerText = Math.abs(myCar.speed * 3.6).toFixed(0);
           if (!isThirdPerson) {
               const driverPos = new THREE.Vector3(0.5, 1.3, 0.2); driverPos.applyMatrix4(myCar.mesh.matrixWorld);
               camera.position.copy(driverPos);
               const lookTarget = new THREE.Vector3(0, 1.3, 20); lookTarget.applyMatrix4(myCar.mesh.matrixWorld);  
               camera.lookAt(lookTarget);
           } else {
               const offset = new THREE.Vector3(0, 4, -8); offset.applyAxisAngle(new THREE.Vector3(0,1,0), myCar.mesh.rotation.y);
               camera.position.copy(myCar.mesh.position.clone().add(offset)); camera.lookAt(myCar.mesh.position);
           }
           myCar.wheels.forEach(w => w.rotation.x += myCar.speed * delta * 0.3);
       } else if (seatedBus) {
           const seatPos = new THREE.Vector3(1.0, 2.5, -1).applyMatrix4(seatedBus.mesh.matrixWorld);
           camera.position.copy(seatPos);
       }

       if (isThirdPerson && !isDriving) {
           playerGroup.position.set(camera.position.x, camera.position.y - 2.2, camera.position.z);
           playerGroup.rotation.y = camera.rotation.y;
           if (moveF || moveB || moveL || moveR) {
               playerWalkCycle += delta * 10; const pSwing = Math.sin(playerWalkCycle) * 0.6;
               pLeftLeg.rotation.x = pSwing; pRightLeg.rotation.x = -pSwing;
               pLeftArm.rotation.x = -pSwing; pRightArm.rotation.x = pSwing;
           } else {
               pLeftLeg.rotation.x = pRightLeg.rotation.x = 0; pLeftArm.rotation.x = pRightArm.rotation.x = 0;
           }
       }

       traffic.forEach(t => {
           let shouldStop = false;
           
           // Логика остановки на светофорах
           for (let tl of trafficLights) {
               // Проверяем только светофоры нашей оси
               if (tl.axis !== t.axis) continue; 
               
               if (tl.state !== 0 && t.mesh.position.distanceTo(tl.position) < 15) {
                   // Определяем, перед нами ли светофор
                   let isAhead = false;
                   if (t.axis === 'z') {
                       isAhead = (t.speed > 0 && tl.position.z > t.mesh.position.z) || (t.speed < 0 && tl.position.z < t.mesh.position.z);
                   } else { // axis === 'x'
                       isAhead = (t.speed > 0 && tl.position.x > t.mesh.position.x) || (t.speed < 0 && tl.position.x < t.mesh.position.x);
                   }
                   if (isAhead) { shouldStop = true; break; }
               }
           }

           if (!shouldStop) {
               for(let other of traffic) {
                   if (t === other) continue;
                   if (t.axis !== other.axis) continue; // Не проверять машины на других дорогах
                   
                   // Проверка дистанции в зависимости от оси
                   let lateralDist = 0;
                   let forwardDist = 0;
                   
                   if (t.axis === 'z') {
                        lateralDist = Math.abs(t.mesh.position.x - other.mesh.position.x);
                        forwardDist = other.mesh.position.z - t.mesh.position.z;
                   } else {
                        lateralDist = Math.abs(t.mesh.position.z - other.mesh.position.z);
                        forwardDist = other.mesh.position.x - t.mesh.position.x;
                   }

                   if (lateralDist < 2.5) {
                       if (t.dir > 0) { if (forwardDist > 0 && forwardDist < 10) { shouldStop = true; break; } } 
                       else { if (forwardDist < 0 && forwardDist > -10) { shouldStop = true; break; } }
                   }
               }
           }

           if (t.isBus) {
               const distToStop = busStops.map(s => t.mesh.position.distanceTo(s)).sort((a,b) => a-b)[0];
               if (distToStop < 30 && t.state === 'driving' && !shouldStop) t.state = 'braking';
               if (shouldStop && t.state === 'driving') { t.speed *= 0.9; if(Math.abs(t.speed) < 0.1) t.speed = 0; } 
               else if (!shouldStop && t.state === 'driving' && t.speed === 0) t.state = 'accelerating';
               
               if (t.state === 'braking') {
                   t.speed *= 0.95; if (Math.abs(t.speed) < 0.5) { t.speed = 0; t.state = 'stopped'; t.stopTimer = 0; }
               } else if (t.state === 'stopped') {
                   t.doorOpen = Math.min(t.doorOpen + delta * 1.5, 1); t.door.position.x = t.doorOpen * 1.25; 
                   t.stopTimer += delta; if (t.stopTimer > 6) t.state = 'waiting';
               } else if (t.state === 'waiting') {
                   t.doorOpen = Math.max(t.doorOpen - delta * 1.5, 0); t.door.position.x = t.doorOpen * 1.25;
                   if (t.doorOpen === 0) t.state = 'accelerating';
               } else if (t.state === 'accelerating') {
                   t.speed += (t.maxSpeed > 0 ? 1 : -1) * 4 * delta;
                   if (Math.abs(t.speed) >= Math.abs(t.maxSpeed)) { t.speed = t.maxSpeed; t.state = 'driving'; }
               }
           } else {
               if (shouldStop) { t.speed *= 0.9; if(Math.abs(t.speed) < 0.1) t.speed = 0; } 
               else { if (t.speed === 0) t.speed = (t.dir) * 0.1; }
           }
           
           if (!t.isBus && t.maxSpeed === undefined) t.maxSpeed = t.speed;
           if (!t.isBus) {
               if (shouldStop) t.speed *= 0.8; 
               else if (Math.abs(t.speed) < Math.abs(t.maxSpeed)) t.speed += (t.maxSpeed > 0 ? 1 : -1) * 10 * delta;
           }
           
           // Движение в зависимости от оси
           if (t.axis === 'z') {
                t.mesh.position.z += t.speed * delta;
                if (t.mesh.position.z > 1000) t.mesh.position.z = -1000; 
                if (t.mesh.position.z < -1000) t.mesh.position.z = 1000;
           } else {
                t.mesh.position.x += t.speed * delta;
                if (t.mesh.position.x > 1000) t.mesh.position.x = -1000; 
                if (t.mesh.position.x < -1000) t.mesh.position.x = 1000;
           }

           if(t.wheels) t.wheels.forEach(w => w.rotation.x += t.speed * delta * 0.3);
       });

       clouds.forEach(c => { c.position.x += 2 * delta; if(c.position.x > 750) c.position.x = -750; });

       walkCycle += delta * 5;
       
       people.forEach(p => {
           if (p.falling) {
                p.fallProgress += delta * 3;
                p.mesh.rotation.x = Math.max(-Math.PI / 2, -p.fallProgress * (Math.PI / 2));
                p.mesh.position.y = Math.max(0.5, -p.fallProgress * 1.3);
           } else if (!p.inBus && !p.dead) {
               p.mesh.position.z += p.speed * p.dir * delta;
               
               const cycle = (time / 1000) * p.speed * 10; 
               p.lThigh.rotation.x = Math.sin(cycle) * 0.6;
               p.rThigh.rotation.x = Math.sin(cycle + Math.PI) * 0.6;
               p.lShin.rotation.x = Math.max(0, Math.sin(cycle - 1) * 0.8);
               p.rShin.rotation.x = Math.max(0, Math.sin(cycle + Math.PI - 1) * 0.8);
               p.lArm.rotation.x = Math.sin(cycle + Math.PI) * 0.5;
               p.rArm.rotation.x = Math.sin(cycle) * 0.5;

               if (Math.abs(p.mesh.position.z) > 1000) { p.dir *= -1; p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI; }
               else { p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI; }
           }
       });

       zombies.forEach(z => {
           if (z.falling) {
               z.fallProgress += delta * 3; z.mesh.rotation.x = Math.max(-Math.PI / 2, -z.fallProgress * (Math.PI / 2));
               z.mesh.position.y = Math.max(0.5, 1.8 - z.fallProgress * 1.3);
           } else if (!z.dead) {
               const dist = z.mesh.position.distanceTo(camera.position);
               if (dist < 2.5 && !isDriving) { 
                   z.isAttacking = true; z.attackTime += delta * 15; 
                   z.leftArm.rotation.x = -Math.PI/2 + Math.sin(z.attackTime) * 0.5; z.rightArm.rotation.x = -Math.PI/2 + Math.sin(z.attackTime) * 0.5;
                   if (time - lastDamageTime > 1000) {
                       health -= 5; lastDamageTime = time; document.getElementById('hp-bar').style.width = health + '%';
                       if (health <= 0) die();
                   }
               } else if (dist < 150) {
                   z.isAttacking = false; const target = isDriving ? myCar.mesh.position : camera.position;
                   const moveDir = new THREE.Vector3().subVectors(target, z.mesh.position).normalize();
                   const nextZX = z.mesh.position.x + moveDir.x * 4 * delta; const nextZZ = z.mesh.position.z + moveDir.z * 4 * delta;
                   const zBox = new THREE.Box3(); zBox.setFromCenterAndSize(new THREE.Vector3(nextZX, 1.8, nextZZ), new THREE.Vector3(0.8, 1.5, 0.8));
                   let zHitWall = false; for(let w of walls) { if(zBox.intersectsBox(new THREE.Box3().setFromObject(w))) { zHitWall = true; break; } }
                   if(!zHitWall) { z.mesh.position.x = nextZX; z.mesh.position.z = nextZZ; }
                   z.mesh.lookAt(target.x, 0, target.z);
                   z.leftLeg.rotation.x = Math.sin(time/200)*0.5; z.rightLeg.rotation.x = -Math.sin(time/200)*0.5;
                   z.leftArm.rotation.x = -Math.sin(time/200)*0.5; z.rightArm.rotation.x = Math.sin(time/200)*0.5;
               }
           }
       });

       for (let i = particles.length - 1; i >= 0; i--) {
           const p = particles[i]; p.life -= delta; p.velocity.y -= 25 * delta;
           p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
           if (p.mesh.position.y < 0) { p.mesh.position.y = 0; p.velocity.set(0,0,0); }
           if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
       }
       playerMarker.position.set(camera.position.x, 50, camera.position.z);
   }
   prevTime = time;

   if (isDriving) renderer.render(scene, camera);
   else if (isThirdPerson && controls.isLocked) {
       const realPos = camera.position.clone();
       const offset = new THREE.Vector3(0, 1.5, 6); offset.applyQuaternion(camera.quaternion);
       camera.position.add(offset); renderer.render(scene, camera); camera.position.copy(realPos);
   } else renderer.render(scene, camera);
   minimapRenderer.render(scene, minimapCamera);
}
animate();