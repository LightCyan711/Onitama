/**
 * utils.js - 유틸리티 함수 모음
 */

const Utils = {
    /**
     * 두 AABB(축 정렬 경계 상자) 충돌 검사
     */
    aabbCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    /**
     * 범위 내 랜덤 정수
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 범위 내 랜덤 실수
     */
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 값을 범위 내로 제한
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * 두 점 사이 거리
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * 배열 셔플 (Fisher-Yates)
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * 정규화 (0~1 범위로)
     */
    normalize(value, min, max) {
        if (max === min) return 0;
        return (value - min) / (max - min);
    },

    /**
     * 선형 보간
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
};

// AI 채팅 메시지 프리셋
const AI_MESSAGES = [
    '...',                    // 0: 침묵
    '내 머리 위로 올라와!',    // 1: 발판 준비
    '먼저 지나가!',           // 2: 길 열어줌
    '여기 밟아줘!',           // 3: 버튼 요청
    '잠깐 기다려!',           // 4: 대기 요청
    '같이 점프!',             // 5: 동시 점프
    '내 뒤로 숨어!',          // 6: 보호
    '따라와!'                 // 7: 유도
];

// 타일 타입 상수
const TILE = {
    EMPTY: 0,
    WALL: 1,
    PLATFORM: 2,
    GOAL: 3,
    BUTTON: 4,
    DOOR: 5,
    LASER_EMITTER: 6,
    SEESAW: 7
};

// 게임 상수
const GAME_CONSTANTS = {
    TILE_SIZE: 32,
    GRAVITY: 0.6,
    PLAYER_SPEED: 4,
    JUMP_FORCE: -12,
    MAX_FALL_SPEED: 15,
    FRICTION: 0.85
};
