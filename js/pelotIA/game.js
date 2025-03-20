// 📌 game.js //

import { getTerrainHeight, drawTerrain, relocateTarget } from "./terrain.js";
import { trainModel, adjustLearning } from "./ai.js";

// 📌 Elementos del DOM
const gameContainer = document.querySelector(".game-container");
const ball = document.getElementById("ball");
const target = document.getElementById("target");
const attemptsDisplay = document.getElementById("attempts");
const bestDistanceDisplay = document.getElementById("bestDistance");
const angleDisplay = document.getElementById("angleValue");
const forceDisplay = document.getElementById("forceValue");
const distanceDisplay = document.getElementById("distanceThrown");
const errorDisplay = document.getElementById("errorValue");
const commentBox = document.getElementById("commentBox");

let attempts = 0;
let bestDistance = 0;
let bestAngle = 45;
let bestForce = 20;
let wind = Math.random() * 4 - 2;
let targetPosition = Math.random() * (window.innerWidth - 200) + 100;
let lastError = null;
let ballMoving = false;
let attemptLog = [];
let bestAttempts = [];
let noProgressCounter = 0;
let forceDirection = 1;
let angleDirection = 1;

// 📌 Función para mostrar comentarios en la UI
function updateComment(newComment) {
    console.log(`📢 ${newComment}`);
    let newMessage = document.createElement("p");
    newMessage.textContent = newComment;
    commentBox.appendChild(newMessage);
    while (commentBox.childNodes.length > 5) {
        commentBox.removeChild(commentBox.firstChild);
    }
}

// 📌 Lanzamiento de la pelota con control de instancia única
export function throwBall(angle, force) {
    if (ballMoving) return;
    ballMoving = true;

    let x = 10;
    let y = getTerrainHeight(x);
    let vx = force * Math.cos(angle * Math.PI / 180) + wind;
    let vy = force * Math.sin(angle * Math.PI / 180);
    let gravity = -9.81;
    let elasticity = 0;

    function updateBall() {
        if (document.hidden) {
            setTimeout(updateBall, 50);
            return;
        }

        x += vx;
        y += vy;
        vy += gravity * 0.05;

        let terrainHeight = getTerrainHeight(x);
        if (y <= terrainHeight) {
            y = terrainHeight;
            vx *= 0.8;
            vy *= -elasticity;
            if (Math.abs(vy) < 2) {
                ballMoving = false;
                evaluateThrow(x, angle, force);
                return;
            }
        }

        ball.style.left = `${x}px`;
        ball.style.bottom = `${y}px`;

        let trail = document.createElement("div");
        trail.classList.add("trail");
        trail.style.left = `${x}px`;
        trail.style.bottom = `${y}px`;
        gameContainer.appendChild(trail);

        requestAnimationFrame(updateBall);
    }

    updateBall();
}

// 📌 Evaluar el lanzamiento con mejoras en el aprendizaje
function evaluateThrow(distance, angle, force) {
    let errorX = Math.abs(targetPosition - distance);
    let totalError = errorX;

    angleDisplay.textContent = Math.round(angle);
    forceDisplay.textContent = Math.round(force);
    distanceDisplay.textContent = Math.round(distance);
    errorDisplay.textContent = `${Math.round(errorX)}`;

    commentBox.textContent = "";

    if (errorX < 2000) {
        attemptLog.push({ angle, force, distance, errorX });
        if (attemptLog.length > 50) attemptLog.shift();
    }

    // 📌 Penalizar repeticiones exactas
    if (bestAttempts.length >= 3) {
        let lastAngles = bestAttempts.slice(-3).map(a => a.angle);
        let lastForces = bestAttempts.slice(-3).map(a => a.force);

        if (new Set(lastAngles).size === 1 && new Set(lastForces).size === 1) {
            updateComment("⚠️ Ajustes repetitivos, cambiando estrategia...");
            forceDirection *= -1;
            angleDirection *= -1;
        }
    }

    if (totalError < bestDistance || bestDistance === 0) {
        bestDistance = totalError;
        bestAttempts.push({ angle, force, errorX });

        if (bestAttempts.length > 10) bestAttempts.shift();

        bestDistanceDisplay.textContent = `${Math.floor(bestDistance)}`;
        noProgressCounter = 0;
        updateComment(`🎯 ¡Nuevo mejor intento! Error: ${Math.floor(bestDistance)} px`);
    } else {
        noProgressCounter++;
        updateComment("🤔 No mejoré... probando otra variante.");
    }

    if (totalError < 20) {
        updateComment("🏆 ¡Lo logré! Alcancé el objetivo.");
        showSuccessModal();
        return;
    }

    attempts++;
    attemptsDisplay.textContent = attempts;

    if (attempts % 5 === 0 && attemptLog.length > 20) {
        trainModel();
    }

    let avgAngle = bestAttempts.reduce((sum, a) => sum + a.angle, 0) / bestAttempts.length;
    let avgForce = bestAttempts.reduce((sum, a) => sum + a.force, 0) / bestAttempts.length;

    adjustLearning(errorX, avgAngle, avgForce);
}

// 📌 Iniciar la simulación
export function startSimulation() {
    ball.style.display = "block";
    target.style.display = "block";
    attempts = 0;
    bestDistance = 0;
    lastError = null;
    attemptsDisplay.textContent = attempts;
    bestDistanceDisplay.textContent = bestDistance;
    drawTerrain();
    relocateTarget(target, window.innerWidth, document.getElementById("windSpeed"), [], ball);
}

// 📌 Modal de éxito
function showSuccessModal() {
    document.getElementById("modalAttempts").textContent = attempts;
    document.getElementById("successModal").style.display = "flex";
}

// 📌 Cerrar modal y reubicar el objetivo
export function closeModal() {
    document.getElementById("successModal").style.display = "none";
    relocateTarget(target, window.innerWidth, document.getElementById("windSpeed"), [], ball);
}

window.closeModal = closeModal;
