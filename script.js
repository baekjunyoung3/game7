// 게임 초기화
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 화면 크기 설정
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 배경 이미지 로드
const backgroundImage = new Image();
backgroundImage.src = "background.avif"; // 배경 이미지 경로

// 장애물 이미지 로드
const obstacleImage = new Image();
obstacleImage.src = "object-Photoroom.png"; // 장애물 이미지 경로

// 캐릭터 이미지 로드
const playerImage = new Image();
playerImage.src = "Player.png"; // 겨울 캐릭터 이미지 경로

// 배경 음악 설정
const bgMusic = new Audio("bgm.mp3"); // 배경음악 파일 경로
bgMusic.loop = true; // 음악을 반복해서 재생
bgMusic.volume = 0.5; // 음악 볼륨 설정 (0.0 ~ 1.0)
bgMusic.play(); // 음악 재생

//사용자 상호작용 이벤트로 배경음악 재생
window.addEventListener('keydown', () => {
    if (bgMusic.paused) {
     bgMusic.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
    }
});
// 플레이어 설정
const player = {
    x: canvas.width / 3,
    y: canvas.height - 100,
    width: 70,
    height: 60,
    speed: Math.random() * (12 - 5) + 5,  // 플레이어 속도를 5 ~ 12 사이로 랜덤하게 설정
    dx: 0
};

// 장애물 설정
const obstacles = [];
let obstacleWidth = 50;
let obstacleHeight = 50;
let obstacleSpeed = 4;
let obstacleFrequency = 0.03; // 장애물 생성 빈도

// 키 입력 상태
let leftKey = false;
let rightKey = false;
let aKey = false; // A 키 상태 추가

// 점수 및 최고 기록 설정
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0; // 최고 기록을 불러오고, 숫자로 변환

// 게임 상태
let gameOver = false;
let lastTime = Date.now(); // 시간을 추적하기 위한 변수

// 방어막 상태
let defenseActive = false; // 방어막 활성화 여부
let defenseDuration = 0; // 방어막 지속 시간
let defenseCooldown = 0; // 방어막 쿨타임

// 배경 이미지가 로드되었을 때 실행될 함수
backgroundImage.onload = function() {
    // 배경이 로드된 후 게임을 시작
    update();
};

// 키보드 이벤트 리스너
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") leftKey = true;
    if (event.key === "ArrowRight") rightKey = true;
    if (event.key === "Enter" && gameOver) { // 게임 오버 후 Enter로 다시 시작
        resetGame();
    }
    if (event.key === "a") aKey = true; // A 키를 눌렀을 때 방어막 활성화
});
document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") leftKey = false;
    if (event.key === "ArrowRight") rightKey = false;
    if (event.key === "a") aKey = false; // A 키를 떼면 방어막 비활성화
});

// 배경 그리기
function drawBackground() {
    // 배경 이미지를 화면 크기에 맞게 그리기
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

// 플레이어 이동
function movePlayer() {
    if (leftKey && player.x > 0) {
        player.x -= player.speed;
    }
    if (rightKey && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
}

// 장애물이 겹치는지 체크하는 함수
function checkCollisionWithExistingObstacles(newObstacle) {
    for (let i = 0; i < obstacles.length; i++) {
        if (
            newObstacle.x < obstacles[i].x + obstacles[i].width &&
            newObstacle.x + newObstacle.width > obstacles[i].x &&
            newObstacle.y < obstacles[i].y + obstacles[i].height &&
            newObstacle.y + newObstacle.height > obstacles[i].y
        ) {
            return true; // 겹치면 true 반환
        }
    }
    return false; // 겹치지 않으면 false 반환
}

// 장애물 생성
function createObstacle() {
    let newObstacle;
    let isColliding = true;

    while (isColliding) {
        const x = Math.random() * (canvas.width - obstacleWidth);
        newObstacle = { x, y: -obstacleHeight, width: obstacleWidth, height: obstacleHeight };
        
        // 장애물이 다른 장애물과 겹치지 않으면 isColliding을 false로 설정
        isColliding = checkCollisionWithExistingObstacles(newObstacle);
    }

    obstacles.push(newObstacle);
}

// 장애물 이동
function moveObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].y += obstacleSpeed;

        // 장애물이 화면 아래로 떨어졌을 때
        if (obstacles[i].y > canvas.height) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// 충돌 감지
function detectCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            // 방어막이 활성화된 경우 충돌 무시
            if (defenseActive) {
                continue;
            }

            // 충돌이 발생하면 게임 종료
            if (score > highScore) {
                highScore = score; // 최고 기록을 갱신
                localStorage.setItem("highScore", highScore); // 로컬 스토리지에 최고 기록 저장
            }
            gameOver = true; // 게임 오버 상태로 변경
            alert(`게임 오버! 점수: ${score}`);
        }
    }
}

// 점수판과 최고 기록 그리기
function drawScoreBoard() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("점수: " + score, 20, 40);
    ctx.fillText("최고 기록: " + highScore, canvas.width - 250, 40);
}

// 방어막 그리기
function drawDefenseShield() {
    if (defenseActive) {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
        ctx.lineWidth = 5;
        ctx.stroke();
    }
}

// 방어막 사용 가능 시간 또는 쿨타임 표시
function drawDefenseStatus() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "green";

    if (defenseActive) {
        // 방어막 활성화 중, 남은 시간 표시
        const remainingTime = 1 - (defenseDuration / 60); // 1초 동안 지속되므로 60 프레임 기준
        ctx.fillText(`방어막: ${remainingTime.toFixed(2)}초`, canvas.width / 2 - 100, 40);
    } else if (defenseCooldown > 0) {
        // 방어막 쿨타임 중, 남은 쿨타임 표시
        const remainingCooldown = (defenseCooldown / 60).toFixed(1); // 5초 쿨타임
        ctx.fillText(`쿨타임: ${remainingCooldown}초`, canvas.width / 2 - 100, 40);
    } else {
        // 방어막이 사용 가능함
        ctx.fillText("방어막 사용 가능!", canvas.width / 2 - 100, 40);
    }
}

// 방어막 쿨타임 관리 및 방어막 지속 시간 처리
function updateDefense() {
    if (defenseActive) {
        defenseDuration++;
        if (defenseDuration > 120) { // 1초 후 방어막 종료
            defenseActive = false;
            defenseDuration = 0;
        }
    }

    if (defenseCooldown > 0) {
        defenseCooldown--;
    }

    // A 키를 눌렀을 때 방어막을 활성화
    if (aKey && defenseCooldown === 0 && !defenseActive) {
        defenseActive = true;
        defenseCooldown = 600; // 5초 쿨타임 (300 프레임 = 5초)
    }
}

// 난이도 증가 (시간이 지남에 따라 장애물 속도와 빈도 증가)
function increaseDifficulty() {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - lastTime) / 1000; // 초 단위로 경과 시간 계산

    if (elapsedTime > 5) {
        lastTime = currentTime; // 시간 초기화

        // 30초마다 난이도 증가
        if (score > 100) {
            obstacleSpeed += 0.5; // 장애물 속도 증가
            obstacleFrequency += 0.01; // 장애물 생성 빈도 증가
            obstacleWidth += 5; // 장애물 크기 증가
            obstacleHeight += 5;
            player.speed = Math.max(2, player.speed - 0.2); // 플레이어 속도 약간 감소
        }
    }
}

// 게임 업데이트
function update() {
    if (gameOver) return; // 게임 오버일 때 업데이트 멈춤

    drawBackground(); // 배경 그리기
    movePlayer();
    moveObstacles();
    detectCollision();
    increaseDifficulty(); // 난이도 증가 함수 호출
    updateDefense(); // 방어막 상태 업데이트

    // 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 캐릭터 그리기 (이미지 사용)
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height); // 겨울 캐릭터 이미지를 그리기

    // 장애물 그리기
    for (let i = 0; i < obstacles.length; i++) {
        ctx.drawImage(obstacleImage, obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height); // 장애물 이미지를 사용
    }

    // 점수판과 최고 기록 그리기
    drawScoreBoard();

    // 방어막 상태 그리기
    drawDefenseShield();

    // 방어막 사용 가능 시간 또는 쿨타임 텍스트 표시
    drawDefenseStatus();

    // 새로운 장애물 생성
    if (Math.random() < obstacleFrequency) { // 장애물이 랜덤하게 생성됨
        createObstacle();
    }

    // 점수 증가 (시간에 따라)
    score += 1;

    requestAnimationFrame(update); // 계속해서 업데이트를 호출
}

// 게임 초기화
function resetGame() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    obstacles.length = 0; // 장애물 배열 초기화
    score = 0; // 점수 초기화
    gameOver = false; // 게임 오버 상태 해제
    obstacleSpeed = 3; // 장애물 속도 초기화
    obstacleFrequency = 0.02; // 장애물 생성 빈도 초기화
    obstacleWidth = 50; // 장애물 크기 초기화
    obstacleHeight = 50;
    player.speed = Math.random() * (12 - 5) + 5; // 플레이어 속도를 5 ~ 12 사이로 랜덤하게 설정
    defenseActive = false; // 방어막 비활성화
    defenseCooldown = 0; // 쿨타임 초기화
    defenseDuration = 0; // 방어막 지속시간 초기화
    lastTime = Date.now(); // 시간 초기화
    update(); // 게임 시작
}









   







