/**
 * cards.js - 오니타마 16종 이동 카드 정의
 */

const CARDS = [
    {
        name: 'Tiger',
        moves: [[0, -2], [0, 1]], // 앞 2칸, 뒤 1칸
        color: 'blue'
    },
    {
        name: 'Dragon',
        moves: [[-2, -1], [-1, 1], [2, -1], [1, 1]], // 대각선
        color: 'red'
    },
    {
        name: 'Crab',
        moves: [[0, -1], [-2, 0], [2, 0]], // 앞 1, 좌우 2
        color: 'blue'
    },
    {
        name: 'Elephant',
        moves: [[-1, -1], [-1, 0], [1, -1], [1, 0]], // 대각선 앞, 좌우
        color: 'red'
    },
    {
        name: 'Mantis',
        moves: [[-1, -1], [1, -1], [0, 1]], // 대각선 앞, 뒤 1
        color: 'red'
    },
    {
        name: 'Boar',
        moves: [[0, -1], [-1, 0], [1, 0]], // 앞, 좌우
        color: 'red'
    },
    {
        name: 'Frog',
        moves: [[-2, 0], [-1, -1], [1, 1]], // 왼쪽 2, 대각선
        color: 'red'
    },
    {
        name: 'Goose',
        moves: [[-1, 0], [-1, -1], [1, 0], [1, 1]], // 지그재그
        color: 'blue'
    },
    {
        name: 'Horse',
        moves: [[0, -1], [-1, 0], [0, 1]], // 앞, 왼쪽, 뒤
        color: 'red'
    },
    {
        name: 'Eel',
        moves: [[-1, -1], [-1, 0], [1, 1]], // 대각선 + 왼쪽
        color: 'blue'
    },
    {
        name: 'Rabbit',
        moves: [[2, 0], [1, -1], [-1, 1]], // 오른쪽 2, 대각선
        color: 'blue'
    },
    {
        name: 'Rooster',
        moves: [[-1, -1], [-1, 0], [1, 0], [1, 1]], // 지그재그 반대
        color: 'red'
    },
    {
        name: 'Monkey',
        moves: [[-1, -1], [-1, 1], [1, -1], [1, 1]], // 4방향 대각선
        color: 'blue'
    },
    {
        name: 'Crane',
        moves: [[0, -1], [-1, 1], [1, 1]], // 앞 1, 대각선 뒤
        color: 'blue'
    },
    {
        name: 'Ox',
        moves: [[0, -1], [1, 0], [0, 1]], // 앞, 오른쪽, 뒤
        color: 'blue'
    },
    {
        name: 'Cobra',
        moves: [[1, -1], [1, 0], [-1, 1]], // 대각선 + 오른쪽
        color: 'red'
    }
];

// 카드 ID로 카드 정보 가져오기
function getCard(id) {
    return CARDS[id];
}

// 랜덤 5장 선택
function selectRandomCards() {
    const indices = [];
    while (indices.length < 5) {
        const r = Math.floor(Math.random() * CARDS.length);
        if (!indices.includes(r)) indices.push(r);
    }
    return indices;
}

// 모든 카드 반환
function getAllCards() {
    return CARDS.map((card, id) => ({ id, ...card }));
}
