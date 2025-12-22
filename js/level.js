/**
 * level.js - 레벨 생성기 v3 (단순화 + 버그 수정)
 * 퍼즐 타입: 3개로 축소 (높은벽, 버튼&문, 플랫폼)
 */

class Level {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.buttons = [];
        this.doors = [];
        this.goalX = 0;
        this.goalY = 0;
        this.spawnPlayer = { x: 0, y: 0 };
        this.spawnAI = { x: 0, y: 0 };
        this.puzzleType = 0;
    }

    generate() {
        const T = GAME_CONSTANTS.TILE_SIZE;
        
        // 초기화
        this.tiles = Array(this.height).fill(null).map(() => Array(this.width).fill(TILE.EMPTY));
        this.buttons = [];
        this.doors = [];

        // 기본 경계 (바닥, 천장, 벽)
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = TILE.WALL;           // 천장
            this.tiles[this.height - 1][x] = TILE.WALL; // 바닥
        }
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = TILE.WALL;           // 왼쪽 벽
            this.tiles[y][this.width - 1] = TILE.WALL; // 오른쪽 벽
        }

        // 퍼즐 타입: 3개로 축소
        this.puzzleType = Utils.randomInt(0, 2);
        
        switch (this.puzzleType) {
            case 0: this.generateHighWallPuzzle(); break;
            case 1: this.generateButtonDoorPuzzle(); break;
            case 2: this.generatePlatformPuzzle(); break;
        }

        // 스폰 위치 (바닥 위)
        this.spawnPlayer = { x: 2 * T, y: (this.height - 2) * T - 40 };
        this.spawnAI = { x: 4 * T, y: (this.height - 2) * T - 40 };
    }

    /**
     * 퍼즐 0: 높은 벽 (AI 발판 필수)
     */
    generateHighWallPuzzle() {
        const T = GAME_CONSTANTS.TILE_SIZE;
        
        // 중앙에 높은 벽 (점프로는 못 넘음)
        const wallX = Math.floor(this.width / 2);
        for (let y = 5; y < this.height - 1; y++) {
            this.tiles[y][wallX] = TILE.WALL;
        }

        // 목표 (벽 오른쪽 끝)
        this.goalX = (this.width - 3) * T;
        this.goalY = (this.height - 2) * T - 20;
    }

    /**
     * 퍼즐 1: 버튼 & 문 (역할 분담)
     */
    generateButtonDoorPuzzle() {
        const T = GAME_CONSTANTS.TILE_SIZE;
        
        // 문 위치 (오른쪽에 세로로)
        const doorX = Math.floor(this.width * 0.65);
        for (let y = 4; y < this.height - 1; y++) {
            this.tiles[y][doorX] = TILE.DOOR;
        }

        // 버튼 위치 (바닥에 설치 - 수정됨!)
        const buttonX = Math.floor(this.width * 0.25);
        this.buttons.push({
            x: buttonX * T,
            y: (this.height - 1) * T - 10, // 바닥 바로 위
            width: T,
            height: 10,
            pressed: false,
            linkedDoorX: doorX
        });

        this.doors.push({ x: doorX, open: false });

        // 목표
        this.goalX = (this.width - 3) * T;
        this.goalY = (this.height - 2) * T - 20;
    }

    /**
     * 퍼즐 2: 플랫폼 (점프 타이밍)
     */
    generatePlatformPuzzle() {
        const T = GAME_CONSTANTS.TILE_SIZE;
        
        // 계단식 플랫폼
        const platforms = [
            { x: 6, y: this.height - 4, w: 3 },
            { x: 11, y: this.height - 6, w: 3 },
            { x: 16, y: this.height - 4, w: 3 }
        ];

        for (const p of platforms) {
            for (let i = 0; i < p.w; i++) {
                if (p.x + i < this.width - 1) {
                    this.tiles[p.y][p.x + i] = TILE.PLATFORM;
                }
            }
        }

        // 목표 (마지막 플랫폼 위)
        this.goalX = 17 * T;
        this.goalY = (this.height - 5) * T;
    }

    /**
     * 버튼 상태 업데이트
     */
    update(entities) {
        for (const button of this.buttons) {
            button.pressed = false;
            for (const entity of entities) {
                const hb = entity.hitbox;
                // 버튼 위에 서 있는지 체크
                const onButton = hb.x + hb.width > button.x && 
                                 hb.x < button.x + button.width &&
                                 Math.abs(hb.y + hb.height - button.y) < 15;
                if (onButton) {
                    button.pressed = true;
                    break;
                }
            }
            // 연결된 문 열기/닫기
            const door = this.doors.find(d => d.x === button.linkedDoorX);
            if (door) door.open = button.pressed;
        }
    }

    /**
     * 정적 바디 (물리 충돌용)
     */
    getStaticBodies() {
        const T = GAME_CONSTANTS.TILE_SIZE;
        const bodies = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (tile === TILE.WALL || tile === TILE.PLATFORM) {
                    bodies.push({ x: x * T, y: y * T, width: T, height: T });
                } else if (tile === TILE.DOOR) {
                    const door = this.doors.find(d => d.x === x);
                    if (!door || !door.open) {
                        bodies.push({ x: x * T, y: y * T, width: T, height: T });
                    }
                }
            }
        }
        return bodies;
    }

    /**
     * 레벨 렌더링
     */
    draw(ctx) {
        const T = GAME_CONSTANTS.TILE_SIZE;

        // 타일
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const px = x * T, py = y * T;

                switch (tile) {
                    case TILE.WALL:
                        ctx.fillStyle = '#30363d';
                        ctx.fillRect(px, py, T, T);
                        ctx.strokeStyle = '#21262d';
                        ctx.strokeRect(px, py, T, T);
                        break;
                    case TILE.PLATFORM:
                        ctx.fillStyle = '#484f58';
                        ctx.fillRect(px, py, T, T);
                        ctx.fillStyle = '#6b7280';
                        ctx.fillRect(px, py, T, 4); // 상단 하이라이트
                        break;
                    case TILE.DOOR:
                        const door = this.doors.find(d => d.x === x);
                        if (!door || !door.open) {
                            ctx.fillStyle = '#dc2626';
                            ctx.fillRect(px, py, T, T);
                            ctx.fillStyle = '#7f1d1d';
                            ctx.fillRect(px + T/3, py + T/4, T/3, T/2);
                        }
                        break;
                }
            }
        }

        // 버튼 (바닥에 눌리는 형태)
        for (const button of this.buttons) {
            const h = button.pressed ? 4 : 10;
            ctx.fillStyle = button.pressed ? '#22c55e' : '#eab308';
            ctx.fillRect(button.x, button.y + (10 - h), button.width, h);
        }

        // 목표 지점 (별)
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(this.goalX + T/2, this.goalY, T/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', this.goalX + T/2, this.goalY + 7);
    }

    /**
     * 목표 도달 체크
     */
    checkGoal(entity) {
        const T = GAME_CONSTANTS.TILE_SIZE;
        const dx = Math.abs(entity.x + entity.width/2 - (this.goalX + T/2));
        const dy = Math.abs(entity.y + entity.height/2 - this.goalY);
        return dx < T * 0.8 && dy < T * 0.8;
    }
}
