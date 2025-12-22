/**
 * board.js - 오니타마 게임 로직
 */

class OnitamaGame {
    constructor() {
        this.reset();
    }

    reset() {
        // 5x5 보드 (0=빈칸, 1=빨강 폰, 2=빨강 마스터, -1=파랑 폰, -2=파랑 마스터)
        this.board = Array(5).fill(null).map(() => Array(5).fill(0));
        
        // 초기 배치
        this.board[0][0] = -1; this.board[0][1] = -1; this.board[0][2] = -2; 
        this.board[0][3] = -1; this.board[0][4] = -1;
        this.board[4][0] = 1; this.board[4][1] = 1; this.board[4][2] = 2;
        this.board[4][3] = 1; this.board[4][4] = 1;
        
        // 카드 선택
        const cards = selectRandomCards();
        this.redCards = [cards[0], cards[1]];
        this.blueCards = [cards[2], cards[3]];
        this.centerCard = cards[4];
        
        // 첫 턴은 centerCard 색상에 따라
        const centerColor = CARDS[this.centerCard].color;
        this.currentPlayer = centerColor === 'red' ? 1 : -1;
        
        this.gameOver = false;
        this.winner = null;
        this.turnCount = 0;
    }

    // 현재 플레이어의 카드
    getCurrentCards() {
        return this.currentPlayer === 1 ? this.redCards : this.blueCards;
    }

    // 가능한 모든 행동 반환
    getPossibleActions() {
        const actions = [];
        const cards = this.getCurrentCards();
        
        for (let cardIdx = 0; cardIdx < 2; cardIdx++) {
            const card = getCard(cards[cardIdx]);
            
            // 모든 내 말 찾기
            for (let y = 0; y < 5; y++) {
                for (let x = 0; x < 5; x++) {
                    const piece = this.board[y][x];
                    if ((this.currentPlayer === 1 && piece > 0) || 
                        (this.currentPlayer === -1 && piece < 0)) {
                        
                        // 카드의 각 이동 시도
                        for (let moveIdx = 0; moveIdx < card.moves.length; moveIdx++) {
                            const [dx, dy] = card.moves[moveIdx];
                            // 빨강은 위로, 파랑은 아래로 (좌표계 반전)
                            const actualDy = this.currentPlayer === 1 ? dy : -dy;
                            const actualDx = this.currentPlayer === 1 ? dx : -dx;
                            
                            const newX = x + actualDx;
                            const newY = y + actualDy;
                            
                            if (newX >= 0 && newX < 5 && newY >= 0 && newY < 5) {
                                const target = this.board[newY][newX];
                                // 내 말이 아니면 이동 가능
                                if ((this.currentPlayer === 1 && target <= 0) ||
                                    (this.currentPlayer === -1 && target >= 0)) {
                                    actions.push({
                                        from: [x, y],
                                        to: [newX, newY],
                                        cardIdx: cardIdx
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return actions;
    }

    // 행동 실행
    makeMove(action) {
        const { from, to, cardIdx } = action;
        const [fx, fy] = from;
        const [tx, ty] = to;
        
        // 말 이동
        const movingPiece = this.board[fy][fx];
        this.board[ty][tx] = movingPiece;
        this.board[fy][fx] = 0;
        
        // 카드 교환
        const cards = this.getCurrentCards();
        const usedCard = cards[cardIdx];
        
        if (this.currentPlayer === 1) {
            this.redCards[cardIdx] = this.centerCard;
        } else {
            this.blueCards[cardIdx] = this.centerCard;
        }
        this.centerCard = usedCard;
        
        this.turnCount++;
        
        // 승리 조건 체크 (이동한 말과 위치로)
        this.checkWin(movingPiece, tx, ty);
        
        // 턴 전환 (게임이 끝나지 않았을 때만)
        if (!this.gameOver) {
            this.currentPlayer *= -1;
        }
    }

    checkWin(piece, x, y) {
        // Way of the Stone: 상대 마스터 잡기
        let redMaster = false, blueMaster = false;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (this.board[i][j] === 2) redMaster = true;
                if (this.board[i][j] === -2) blueMaster = true;
            }
        }
        if (!redMaster) {
            this.gameOver = true;
            this.winner = -1;
            console.log('🏆 파랑 승리! (마스터 잡기)');
            return;
        }
        if (!blueMaster) {
            this.gameOver = true;
            this.winner = 1;
            console.log('🏆 빨강 승리! (마스터 잡기)');
            return;
        }
        
        // Way of the Stream: 마스터가 상대 사원 도달
        if (piece === 2 && y === 0 && x === 2) {
            this.gameOver = true;
            this.winner = 1;
            console.log('🏆 빨강 승리! (사원 도달)');
        } else if (piece === -2 && y === 4 && x === 2) {
            this.gameOver = true;
            this.winner = -1;
            console.log('🏆 파랑 승리! (사원 도달)');
        }
        
        // 무승부 (200턴 초과)
        if (this.turnCount > 200) {
            this.gameOver = true;
            this.winner = 0;
            console.log('⚖️ 무승부! (200턴 초과)');
        }
    }

    // 게임 상태를 배열로 (RL용)
    getStateArray() {
        const state = [];
        
        // 보드 (25)
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                state.push(this.board[y][x]);
            }
        }
        
        // 내 카드 (2)
        const myCards = this.getCurrentCards();
        state.push(myCards[0] / 16, myCards[1] / 16);
        
        // 상대 카드 (2)
        const oppCards = this.currentPlayer === 1 ? this.blueCards : this.redCards;
        state.push(oppCards[0] / 16, oppCards[1] / 16);
        
        // 중앙 카드 (1)
        state.push(this.centerCard / 16);
        
        // 현재 플레이어 (1)
        state.push(this.currentPlayer);
        
        return state; // 총 31차원
    }

    // 복사본 생성
    clone() {
        const copy = new OnitamaGame();
        copy.board = this.board.map(row => [...row]);
        copy.redCards = [...this.redCards];
        copy.blueCards = [...this.blueCards];
        copy.centerCard = this.centerCard;
        copy.currentPlayer = this.currentPlayer;
        copy.gameOver = this.gameOver;
        copy.winner = this.winner;
        copy.turnCount = this.turnCount;
        return copy;
    }
}
