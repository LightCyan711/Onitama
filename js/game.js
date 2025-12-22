/**
 * game.js - 게임 로직 v3 (단순화 + 메시지 스팸 방지)
 */

class Game {
    constructor(canvasId, chatId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chatElement = document.getElementById(chatId);
        
        this.levelWidth = 25;
        this.levelHeight = 12;
        
        this.level = new Level(this.levelWidth, this.levelHeight);
        this.physics = new PhysicsWorld();
        
        this.player = null;
        this.ai = null;
        
        this.keys = {};
        this.gameOver = false;
        this.won = false;
        
        this.stepCount = 0;
        this.maxSteps = 400;

        // 메시지 스팸 방지
        this.lastAIMessage = 0;
        this.messageCooldown = 0;
        this.MESSAGE_COOLDOWN_TIME = 60; // 1초 쿨다운
        
        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    }

    reset() {
        this.level.generate();
        this.physics.clear();
        for (const body of this.level.getStaticBodies()) {
            this.physics.addStaticBody(body);
        }

        this.player = new Entity(
            this.level.spawnPlayer.x, this.level.spawnPlayer.y,
            28, 40, '#58a6ff'
        );
        this.ai = new Entity(
            this.level.spawnAI.x, this.level.spawnAI.y,
            28, 40, '#3fb950'
        );

        this.physics.addEntity(this.player);
        this.physics.addEntity(this.ai);

        this.gameOver = false;
        this.won = false;
        this.stepCount = 0;
        this.messageCooldown = 0;
        
        this.showAIMessage(0);
        return this.getState();
    }

    /**
     * AI 메시지 표시 (쿨다운 적용)
     */
    showAIMessage(messageId) {
        // 쿨다운 중이면 무시
        if (this.messageCooldown > 0) return;
        // 같은 메시지 반복 방지
        if (messageId === this.lastAIMessage) return;
        // 침묵(0)은 자유롭게 가능
        if (messageId !== 0) {
            this.messageCooldown = this.MESSAGE_COOLDOWN_TIME;
        }
        
        this.lastAIMessage = messageId;
        const bubble = this.chatElement.querySelector('.chat-bubble');
        if (bubble) {
            bubble.textContent = '🤖 ' + AI_MESSAGES[messageId];
            bubble.style.animation = 'none';
            bubble.offsetHeight;
            bubble.style.animation = 'bubblePop 0.3s ease';
        }
    }

    handlePlayerInput() {
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.moveLeft();
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.moveRight();
        if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) this.player.jump();
        this.player.crouch(this.keys['ArrowDown'] || this.keys['KeyS']);
    }

    /**
     * AI 행동 (0-4: 이동, 5-12: 메시지)
     */
    performAIAction(action) {
        switch (action) {
            case 1: this.ai.moveLeft(); break;
            case 2: this.ai.moveRight(); break;
            case 3: this.ai.jump(); break;
            case 4: this.ai.crouch(true); break;
            default: this.ai.crouch(false); break;
        }
        // 메시지 (쿨다운 적용됨)
        if (action >= 5 && action <= 12) {
            this.showAIMessage(action - 5);
        }
    }

    getState() {
        const W = this.canvas.width;
        const H = this.canvas.height;
        
        return {
            aiX: this.ai.x / W,
            aiY: this.ai.y / H,
            aiVx: this.ai.vx / GAME_CONSTANTS.PLAYER_SPEED,
            aiVy: this.ai.vy / GAME_CONSTANTS.MAX_FALL_SPEED,
            aiGrounded: this.ai.isGrounded ? 1 : 0,
            aiCrouching: this.ai.isCrouching ? 1 : 0,
            playerX: this.player.x / W,
            playerY: this.player.y / H,
            playerVx: this.player.vx / GAME_CONSTANTS.PLAYER_SPEED,
            playerVy: this.player.vy / GAME_CONSTANTS.MAX_FALL_SPEED,
            playerGrounded: this.player.isGrounded ? 1 : 0,
            playerOnAI: this.player.standingOn === this.ai ? 1 : 0,
            goalRelX: (this.level.goalX - this.ai.x) / W,
            goalRelY: (this.level.goalY - this.ai.y) / H,
            playerRelX: (this.player.x - this.ai.x) / W,
            playerRelY: (this.player.y - this.ai.y) / H,
            buttonPressed: this.level.buttons.length > 0 ? (this.level.buttons[0].pressed ? 1 : 0) : 0,
            doorOpen: this.level.doors.length > 0 ? (this.level.doors[0].open ? 1 : 0) : 0,
            puzzleType: this.level.puzzleType / 2 // 0~2 -> 0~1
        };
    }

    step(aiAction) {
        this.stepCount++;
        if (this.messageCooldown > 0) this.messageCooldown--;

        this.performAIAction(aiAction);
        this.level.update([this.player, this.ai]);
        this.physics.staticBodies = this.level.getStaticBodies();
        this.physics.update();

        // === 보상 ===
        let reward = -0.01;

        // 승리
        if (this.level.checkGoal(this.player)) {
            reward = 100;
            this.gameOver = true;
            this.won = true;
        }

        // 플레이어가 AI 위에 탑승
        if (this.player.standingOn === this.ai) {
            reward += 1.0;
        }

        // 버튼 밟기
        for (const btn of this.level.buttons) {
            if (btn.pressed) reward += 0.3;
        }

        // 플레이어와 가까이 유지
        const dist = Utils.distance(this.ai.x, this.ai.y, this.player.x, this.player.y);
        if (dist < 100) reward += 0.05;
        else if (dist > 200) reward -= 0.1;

        // 시간 초과
        if (this.stepCount >= this.maxSteps) {
            reward = -20;
            this.gameOver = true;
        }

        // 낙사
        if (this.player.y > this.canvas.height || this.ai.y > this.canvas.height) {
            reward = -30;
            this.gameOver = true;
        }

        return { state: this.getState(), reward, done: this.gameOver, won: this.won };
    }

    render() {
        this.ctx.fillStyle = '#0f1419';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.level.draw(this.ctx);
        this.ai.draw(this.ctx);
        this.player.draw(this.ctx);

        // 라벨
        this.ctx.font = 'bold 11px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#3fb950';
        this.ctx.fillText('AI', this.ai.x + this.ai.width/2, this.ai.y - 5);
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillText('YOU', this.player.x + this.player.width/2, this.player.y - 5);

        // 퍼즐 힌트
        const names = ['높은벽', '버튼&문', '플랫폼'];
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('퍼즐: ' + names[this.level.puzzleType], 10, 20);

        // 게임오버
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = this.won ? '#22c55e' : '#ef4444';
            this.ctx.font = 'bold 28px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? '🎉 성공!' : '💀 실패', this.canvas.width/2, this.canvas.height/2);
        }
    }
}
