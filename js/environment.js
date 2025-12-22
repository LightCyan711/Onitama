/**
 * environment.js - RL 환경 v3 (단순화)
 */

class RLEnvironment {
    constructor(game) {
        this.game = game;
        this.stateSize = 19;
        this.actionSize = 13;
    }

    reset() {
        return this.stateToArray(this.game.reset());
    }

    step(action) {
        const result = this.game.step(action);
        return {
            state: this.stateToArray(result.state),
            reward: result.reward,
            done: result.done,
            won: result.won
        };
    }

    stateToArray(s) {
        return [
            s.aiX, s.aiY, s.aiVx, s.aiVy, s.aiGrounded, s.aiCrouching,
            s.playerX, s.playerY, s.playerVx, s.playerVy, s.playerGrounded, s.playerOnAI,
            s.goalRelX, s.goalRelY, s.playerRelX, s.playerRelY,
            s.buttonPressed, s.doorOpen, s.puzzleType
        ];
    }

    /**
     * 봇 플레이어 (학습용)
     */
    simulatePlayerBot() {
        const p = this.game.player;
        const ai = this.game.ai;
        const goal = { x: this.game.level.goalX, y: this.game.level.goalY };
        const puzzle = this.game.level.puzzleType;

        // 기본: 목표로 이동
        if (goal.x > p.x + 30) p.moveRight();
        else if (goal.x < p.x - 30) p.moveLeft();

        // 퍼즐별 행동
        if (puzzle === 0) { // 높은벽
            // AI가 웅크리고 있고 근처면 점프해서 올라타기
            if (ai.isCrouching && Math.abs(ai.x - p.x) < 50 && p.y > ai.y) {
                p.moveRight();
                if (p.isGrounded) p.jump();
            }
        } else if (puzzle === 1) { // 버튼&문
            // AI가 버튼을 밟을 때까지 대기, 문 열리면 전진
            const door = this.game.level.doors[0];
            if (door && door.open) {
                p.moveRight();
            }
        } else if (puzzle === 2) { // 플랫폼
            // 일반 점프
            if (goal.y < p.y - 40 && p.isGrounded && Math.random() < 0.15) {
                p.jump();
            }
        }

        // 기본 점프
        if (p.isGrounded && Math.random() < 0.03) p.jump();
    }
}
