const crimeBtn = document.getElementById("crimeBtn");
const crimeList = document.getElementById("crimeList");

crimeBtn.addEventListener("click", () => {
    crimeList.classList.toggle("hidden");
});

const eastereggBtn = document.getElementById("eeBtn");
const eeList = document.getElementById("eastereggs");

eastereggBtn.addEventListener("click", () => {
    eeList.classList.toggle("hidden");
});

let vero2 = "";
const vero = "veronica";

document.addEventListener("keydown", (e) => {
    vero2 += e.key.toLowerCase();

    if (vero2.length > vero.length) {
        vero2 = vero2.slice(-vero.length);
    }

    if (vero2 === vero) {
        activateVeronicaMode();
    }
});

function activateVeronicaMode() {
    alert("Veronica is always watching...");
    document.body.classList.add("Veronica-mode");
    const veronicaDuration = spawnVeronica(1200);
    
    setTimeout(() => {
        document.body.classList.remove("Veronica-mode");
    }, veronicaDuration);
}


let sequence = "";
const target = "cabini";

document.addEventListener("keydown", (e) => {
    sequence += e.key.toLowerCase();

    if (sequence.length > target.length) {
        sequence = sequence.slice(-target.length);
    }

    if (sequence === target) {
        activateCabiniMode();
    }
});

function activateCabiniMode() {
    alert("Cabini Mode Activated!");
    document.body.classList.add("secret-mode");

    const confettiDuration = launchConfetti(300);
    spawnGiantCabini(confettiDuration);

    const msg = document.createElement("div");
    msg.innerHTML =
        "<h1 style='position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);z-index:9999;'>SLAVA CABINI</h1>";

    document.body.appendChild(msg);

    setTimeout(() => msg.remove(), 4000);

   
    setTimeout(() => {
        document.body.classList.remove("secret-mode");
    }, confettiDuration);
}


let general = "";
const genreal = "general";

document.addEventListener("keydown", (e) => {
    general += e.key.toLowerCase();

    if (general.length > genreal.length) {
        general = general.slice(-genreal.length);
    }

    if (general === genreal) {
        activategeneralMode();
    }
});

function activategeneralMode() {
    alert("Long Live Veronica");
    

    const confettiDuration = launchConfetti(300);
    spawngeneral(confettiDuration);

   

    setTimeout(() => msg.remove(), 4000);

   
    setTimeout(() => {
        
    }, confettiDuration);
}

let clicks = 0;

document.querySelector(".cabini")
.addEventListener("click", () => {

    clicks++;

    if (clicks === 10) {
        alert("Achievement Unlocked: Professional Cabini Enthusiast");
    }

    if (clicks % 20 === 0) {
        alert("Cabini has multiplied.");

        for (let i = 0; i < 15; i++) {
            spawnMiniCabini();
        }
    }


    if (clicks === 99) {
        alert("Stop fucking clicking theres nothing else to find");
    }

    if (clicks === 100) {
        alert("Achievement Unlocked: The end?");
    }

    if (clicks === 105) {
        alert("STOP FUCKING CLICKING, THERE IS NOTHING ELSE TO FIND, I SWEAR TO GOD, IF YOU CLICK 5  MORE TIMES, I WILL END THIS ENTIRE WEBSITE, DO YOU HEAR ME? ONE MORE CLICK AND THIS SITE IS GONE FOREVER.");
    }

    if (clicks === 110) {
        alert("welcome to the farlands, theres nothing here after this point, just Fern talking about recruitment like its a curse.");
    }

    if (clicks === 111) {
        alert("recruitment is a curse, you will never escape it, you will be trapped in the farlands forever, just like me.");
    }

    if (clicks === 111) {
        alert("Achievement Unlocked: Recruitment?");
    }

    if (clicks === 112) {
        alert("Recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment recruitment");
    }

    if (clicks === 113) {
        alert("Goodbye, dear traveller, it was nice to speak to you.");
    }

    if (clicks === 115) {
        alert("Achievement Unlocked: The void");
    }
});


const cabiniEffectsStyle = document.createElement("style");
cabiniEffectsStyle.textContent = `
@keyframes confetti-fall {
    to { transform: translateY(140vh) rotate(720deg); opacity: 0; }
}
`;
document.head.appendChild(cabiniEffectsStyle);


function spawnGiantCabini(durationMs = 10000) {
    const size = 420;
    const giant = document.createElement("img");
    giant.src = "Cabini.png";
    giant.alt = "Giant Cabini";
    giant.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: auto;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(giant);

    let x = window.innerWidth  / 2 - size / 2;
    let y = window.innerHeight / 2 - size / 2;
    let vx = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 2 + 2.5);
    let vy = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 2 + 2.5);
    let angle = 0;
    let startTime = null;

    function animate(ts) {
        if (!startTime) startTime = ts;
        if (ts - startTime >= durationMs) {
            giant.remove();
            return;
        }

        x += vx;
        y += vy;
        angle += 2.5;

        if (x <= 0 || x >= window.innerWidth  - size) { vx *= -1; x = Math.max(0, Math.min(window.innerWidth  - size, x)); }
        if (y <= 0 || y >= window.innerHeight - size) { vy *= -1; y = Math.max(0, Math.min(window.innerHeight - size, y)); }

        giant.style.left      = x + "px";
        giant.style.top       = y + "px";
        giant.style.transform = `rotate(${angle}deg)`;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function spawngeneral(durationMs = 10000) {
    const size = 420;
    const giant = document.createElement("img");
    giant.src = "/media/veronica.png";
    giant.alt = "veronica";
    giant.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: auto;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(giant);

    let x = window.innerWidth  / 2 - size / 2;
    let y = window.innerHeight / 2 - size / 2;
    let vx = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 2 + 2.5);
    let vy = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 2 + 2.5);
    let angle = 0;
    let startTime = null;

    function animate(ts) {
        if (!startTime) startTime = ts;
        if (ts - startTime >= durationMs) {
            giant.remove();
            return;
        }

        x += vx;
        y += vy;
        angle += 2.5;

        if (x <= 0 || x >= window.innerWidth  - size) { vx *= -1; x = Math.max(0, Math.min(window.innerWidth  - size, x)); }
        if (y <= 0 || y >= window.innerHeight - size) { vy *= -1; y = Math.max(0, Math.min(window.innerHeight - size, y)); }

        giant.style.left      = x + "px";
        giant.style.top       = y + "px";
        giant.style.transform = `rotate(${angle}deg)`;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function spawnVeronica(durationMs = 1200) {
    const veronica = document.createElement("img");
    veronica.src = "veronica.png";
    veronica.alt = "Veronica";
    veronica.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        filter: brightness(1.3) contrast(1.2);
    `;
    document.body.appendChild(veronica);

    requestAnimationFrame(() => {
        veronica.style.opacity = "1";
    });

    let shakeFrames = 0;
    const shakeInterval = setInterval(() => {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        document.body.style.transform = `translate(${x}px, ${y}px)`;
        shakeFrames++;
        if (shakeFrames > 10) {
            clearInterval(shakeInterval);
            document.body.style.transform = "translate(0, 0)";
        }
    }, 40);

    try {
        const sfx = new Audio("/media/jumpscare.mp3");
        sfx.volume = 0.8;
        sfx.play().catch(() => {});
    } catch (e) {}

    setTimeout(() => {
        veronica.remove();
        document.body.style.transform = "translate(0, 0)";
    }, durationMs);

    return durationMs;
}


function spawnMiniCabini() {
    const size = 80;
    const mini = document.createElement("img");
    mini.src = "Cabini.png";
    mini.alt = "Mini Cabini";
    mini.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: auto;
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(mini);

    let x = Math.random() * (window.innerWidth  - size);
    let y = Math.random() * (window.innerHeight - size);
    let vx = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 3 + 2);
    let vy = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 3 + 2);
    let angle = Math.random() * 360;
    const spinSpeed = Math.random() * 4 + 3;

    function animate() {
        x += vx;
        y += vy;
        angle += spinSpeed;

        if (x <= 0 || x >= window.innerWidth  - size) { vx *= -1; x = Math.max(0, Math.min(window.innerWidth  - size, x)); }
        if (y <= 0 || y >= window.innerHeight - size) { vy *= -1; y = Math.max(0, Math.min(window.innerHeight - size, y)); }

        mini.style.left      = x + "px";
        mini.style.top       = y + "px";
        mini.style.transform = `rotate(${angle}deg)`;

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}


function createConfettiPiece() {
    const confetti = document.createElement("div");
    const size = Math.floor(Math.random() * 10) + 8;
    const colors = ["#ff3d4f", "#ffd700", "#4bf2ff", "#8aff6a", "#ff8aeb"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    confetti.style.position = "fixed";
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.top = Math.random() * -20 + "vh";
    confetti.style.width = size + "px";
    confetti.style.height = size + "px";
    confetti.style.backgroundColor = color;
    confetti.style.opacity = "0.95";
    confetti.style.borderRadius = "30%";
    confetti.style.zIndex = "9998";
    confetti.style.pointerEvents = "none";
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    confetti.style.animation = `confetti-fall ${Math.random() * 1.4 + 1.2}s ease-out forwards`;

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2200);
}

function launchConfetti(count) {
    const delayPerPiece = 25;
    const lifetime = 2200;

    for (let i = 0; i < count; i++) {
        setTimeout(createConfettiPiece, i * delayPerPiece);
    }

    return (count - 1) * delayPerPiece + lifetime;
}



console.log(
    "%cSLAVA CABINI",
    "font-size:40px;color:gold;"
);

console.log("Veronica was here.");