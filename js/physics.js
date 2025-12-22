/**
 * physics.js - 물리 엔진 (중력, 충돌, Stacking)
 */

class Entity {
    constructor(x, y, width, height, color = '#58a6ff') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.isGrounded = false;
        this.isCrouching = false;
        this.standingOn = null; // 밟고 있는 엔티티
        
        // 히트박스 (웅크리면 높이 절반)
        this.baseHeight = height;
    }

    get hitbox() {
        const h = this.isCrouching ? this.baseHeight * 0.5 : this.baseHeight;
        return {
            x: this.x,
            y: this.y + (this.baseHeight - h),
            width: this.width,
            height: h
        };
    }

    applyGravity() {
        if (!this.isGrounded) {
            this.vy += GAME_CONSTANTS.GRAVITY;
            this.vy = Math.min(this.vy, GAME_CONSTANTS.MAX_FALL_SPEED);
        }
    }

    applyFriction() {
        this.vx *= GAME_CONSTANTS.FRICTION;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    jump() {
        if (this.isGrounded) {
            this.vy = GAME_CONSTANTS.JUMP_FORCE;
            this.isGrounded = false;
            return true;
        }
        return false;
    }

    moveLeft() {
        this.vx = -GAME_CONSTANTS.PLAYER_SPEED;
    }

    moveRight() {
        this.vx = GAME_CONSTANTS.PLAYER_SPEED;
    }

    crouch(value) {
        this.isCrouching = value;
    }

    update() {
        this.applyGravity();
        this.x += this.vx;
        this.y += this.vy;
        this.applyFriction();
    }

    draw(ctx) {
        const hb = this.hitbox;
        ctx.fillStyle = this.color;
        ctx.fillRect(hb.x, hb.y, hb.width, hb.height);
        
        // 눈 그리기
        ctx.fillStyle = '#fff';
        const eyeY = hb.y + 8;
        ctx.fillRect(hb.x + 6, eyeY, 6, 6);
        ctx.fillRect(hb.x + hb.width - 12, eyeY, 6, 6);
        
        // 동공
        ctx.fillStyle = '#000';
        ctx.fillRect(hb.x + 8, eyeY + 2, 3, 3);
        ctx.fillRect(hb.x + hb.width - 10, eyeY + 2, 3, 3);
    }
}

class PhysicsWorld {
    constructor() {
        this.entities = [];
        this.staticBodies = []; // 벽, 바닥 등
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    addStaticBody(body) {
        this.staticBodies.push(body);
    }

    clear() {
        this.entities = [];
        this.staticBodies = [];
    }

    /**
     * 엔티티와 정적 바디 충돌 처리
     */
    resolveStaticCollisions(entity) {
        entity.isGrounded = false;
        entity.standingOn = null;

        for (const body of this.staticBodies) {
            if (!Utils.aabbCollision(entity.hitbox, body)) continue;

            const hb = entity.hitbox;
            const overlapX = Math.min(hb.x + hb.width - body.x, body.x + body.width - hb.x);
            const overlapY = Math.min(hb.y + hb.height - body.y, body.y + body.height - hb.y);

            if (overlapX < overlapY) {
                // 수평 충돌
                if (entity.vx > 0) {
                    entity.x = body.x - entity.width;
                } else {
                    entity.x = body.x + body.width;
                }
                entity.vx = 0;
            } else {
                // 수직 충돌
                if (entity.vy > 0) {
                    entity.y = body.y - entity.baseHeight;
                    entity.isGrounded = true;
                } else {
                    entity.y = body.y + body.height - (entity.baseHeight - entity.hitbox.height);
                }
                entity.vy = 0;
            }
        }
    }

    /**
     * 엔티티끼리 충돌 (Stacking 처리)
     */
    resolveEntityCollisions(entityA, entityB) {
        const hbA = entityA.hitbox;
        const hbB = entityB.hitbox;

        if (!Utils.aabbCollision(hbA, hbB)) return false;

        // A가 B 위에 올라타는 경우
        if (entityA.vy >= 0 && hbA.y + hbA.height - entityA.vy <= hbB.y + 5) {
            entityA.y = hbB.y - entityA.baseHeight;
            entityA.vy = 0;
            entityA.isGrounded = true;
            entityA.standingOn = entityB;

            // B가 웅크리고 있으면 위치 조정
            if (entityB.isCrouching) {
                entityA.y = entityB.y + (entityB.baseHeight * 0.5) - entityA.baseHeight;
            }
            return true;
        }
        return false;
    }

    update() {
        for (const entity of this.entities) {
            entity.update();
            this.resolveStaticCollisions(entity);
        }

        // Stacking 체크 (2인 게임이므로 간단하게)
        if (this.entities.length >= 2) {
            const [e1, e2] = this.entities;
            if (!this.resolveEntityCollisions(e1, e2)) {
                this.resolveEntityCollisions(e2, e1);
            }
        }
    }
}
