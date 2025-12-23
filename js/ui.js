/**
 * ui.js - 오니타마 렌더링 (카드 표시 포함)
 */

class OnitamaUI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // 500px 캔버스에 최적화: (500 - 60) / 5 = 88
        this.cellSize = 88; 
        this.boardOffset = 30;
    }


    drawBoard(game) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그리드
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const px = this.boardOffset + x * this.cellSize;
                const py = this.boardOffset + y * this.cellSize;
                
                // 사원 표시 (파란색 사원 - 맨 위, 빨간색 사원 - 맨 아래)
                if (y === 0 && x === 2) {
                    // 파란 사원
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                    ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                    
                    // 사원 아이콘
                    ctx.font = '20px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
                    ctx.fillText('⛩️', px + this.cellSize/2, py + this.cellSize/2);
                } else if (y === 4 && x === 2) {
                    // 빨강 사원
                    ctx.fillStyle = 'rgba(220, 38, 38, 0.5)';
                    ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#dc2626';
                    ctx.lineWidth = 4;
                    ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                    
                    // 사원 아이콘
                    ctx.font = '20px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
                    ctx.fillText('⛩️', px + this.cellSize/2, py + this.cellSize/2);
                } else {
                    // 일반 테두리
                    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                }
            }
        }
        
        // 말 그리기
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const piece = game.board[y][x];
                if (piece !== 0) {
                    this.drawPiece(x, y, piece);
                }
            }
        }
    }

    drawPiece(x, y, piece) {
        const ctx = this.ctx;
        const px = this.boardOffset + x * this.cellSize + this.cellSize / 2;
        const py = this.boardOffset + y * this.cellSize + this.cellSize / 2;
        const radius = 30; // 말 크기 확대 (기존 18)

        
        const isRed = piece > 0;
        const isMaster = Math.abs(piece) === 2;
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        
        ctx.fillStyle = isRed ? '#dc2626' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = isRed ? '#991b1b' : '#1e40af';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        if (isMaster) {
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('王', px, py);
        }
    }

    drawHighlight(x, y) {
        const ctx = this.ctx;
        const px = this.boardOffset + x * this.cellSize;
        const py = this.boardOffset + y * this.cellSize;
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.fillRect(px, py, this.cellSize, this.cellSize);
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, this.cellSize, this.cellSize);
    }

    drawMoveIndicator(x, y) {
        const ctx = this.ctx;
        const px = this.boardOffset + x * this.cellSize + this.cellSize / 2;
        const py = this.boardOffset + y * this.cellSize + this.cellSize / 2;
        
        // 이동 가능 위치 표시 (초록색 원)
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    getBoardPosition(mouseX, mouseY) {
        const x = Math.floor((mouseX - this.boardOffset) / this.cellSize);
        const y = Math.floor((mouseY - this.boardOffset) / this.cellSize);
        if (x >= 0 && x < 5 && y >= 0 && y < 5) {
            return [x, y];
        }
        return null;
    }

    // 카드 HTML 렌더링
    renderCards(game, isPlayMode = false, selectedCardIdx = null) {
        if (isPlayMode) {
            this.renderPlayModeCards(game, selectedCardIdx);
        }
    }


    renderPlayModeCards(game, selectedCardIdx = null) {
        // 플레이어 카드만 표시
        const playerCardsHolder = document.querySelector('#player-cards .cards-holder');
        if (playerCardsHolder) {
            playerCardsHolder.innerHTML = '';
            game.redCards.forEach((cardId, index) => {
                const card = getCard(cardId);
                const cardEl = this.createCardElement(card);
                if (selectedCardIdx === index) {
                    cardEl.classList.add('selected');
                }
                playerCardsHolder.appendChild(cardEl);
            });

        }

        // 중앙 카드
        const centerCardEl = document.getElementById('center-card');
        if (centerCardEl) {
            const card = getCard(game.centerCard);
            centerCardEl.innerHTML = '';
            const centerCardElement = this.createCardElement(card);
            centerCardEl.appendChild(centerCardElement);

        }
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'card-name';
        nameDiv.textContent = card.name;
        
        const patternDiv = document.createElement('div');
        patternDiv.className = 'card-pattern';
        
        // 간단한 이동 패턴 시각화
        const canvas = document.createElement('canvas');
        canvas.width = 70;
        canvas.height = 70;

        const ctx = canvas.getContext('2d');
        
        // 배경
        ctx.fillStyle = '#1a0f08';
        ctx.fillRect(0, 0, 50, 50);
        
        // 중앙 (현재 위치)
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(33, 33, 4, 4);
        
        // 이동 가능 위치
        ctx.fillStyle = card.color === 'red' ? '#dc2626' : '#3b82f6';
        card.moves.forEach(([dx, dy]) => {
            const x = 35 + dx * 12; // 간격 확대 (기존 8)
            const y = 35 + dy * 12;
            ctx.fillRect(x - 3, y - 3, 6, 6);
        });

        
        patternDiv.appendChild(canvas);
        cardDiv.appendChild(nameDiv);
        cardDiv.appendChild(patternDiv);
        
        return cardDiv;
    }

    setupCardEncyclopedia(cards) {
        const encyclopedia = document.getElementById('card-encyclopedia');
        const cardList = document.getElementById('card-list');
        const closeBtn = document.getElementById('close-encyclopedia');

        if (!encyclopedia || !cardList || !closeBtn) return;

        closeBtn.addEventListener('click', () => {
            encyclopedia.classList.add('hidden');
        });

        cardList.innerHTML = '';
        cards.forEach(card => {
            const cardEl = this.createCardElement(card);
            cardEl.classList.add('encyclopedia-card');
            cardList.appendChild(cardEl);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'f') {
                e.preventDefault(); // 브라우저 기본 검색(Ctrl+F) 등과 충돌 방지 (필요 시)
                encyclopedia.classList.toggle('hidden');
                
                // 전역 변수 playGame이 존재하면 하이라이트 실행
                if (typeof playGame !== 'undefined') {
                    this.highlightCurrentGameCards(cards, playGame);
                }
            }
        });
    }

    highlightCurrentGameCards(cards, gameInstance) {
        if (!gameInstance) return;
        const currentGameCardIds = [...gameInstance.redCards, gameInstance.centerCard, ...gameInstance.blueCards];
        const cardElements = document.querySelectorAll('.encyclopedia-card');

        cardElements.forEach(cardEl => {
            const cardName = cardEl.querySelector('.card-name').textContent;
            const cardObj = cards.find(card => card.name === cardName);
            if (cardObj && currentGameCardIds.includes(cardObj.id)) {
                cardEl.classList.add('glow');
            } else {
                cardEl.classList.remove('glow');
            }
        });
    }

    handleError() {
        alert('오류가 발생했습니다. 새 게임을 눌러주세요.');
    }
}
