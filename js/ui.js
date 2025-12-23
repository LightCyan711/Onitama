/**
 * ui.js - 오니타마 렌더링 (카드 표시 포함)
 */

class OnitamaUI {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // 500px 캔버스에 최적화: (500 - 64) / 5 = 87.2
        this.cellSize = 88; 
        this.boardOffset = 30;
        this.noticeTimer = null;
    }

    /**
     * 세련된 인게임 알림 표시 (alert 대체)
     */
    showNotice(message) {
        const noticeEl = document.getElementById('game-notice');
        if (!noticeEl) return;

        if (this.noticeTimer) clearTimeout(this.noticeTimer);

        noticeEl.textContent = message;
        noticeEl.classList.remove('hidden', 'show');
        void noticeEl.offsetWidth; // Reflow
        noticeEl.classList.add('show');

        this.noticeTimer = setTimeout(() => {
            noticeEl.classList.remove('show');
            setTimeout(() => noticeEl.classList.add('hidden'), 500);
        }, 2000);
    }



    drawBoard(game) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경
        ctx.fillStyle = '#2d1810';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 그리드 (Oriental Style)
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                const px = this.boardOffset + x * this.cellSize;
                const py = this.boardOffset + y * this.cellSize;
                
                // 사원 표시 (더 세련된 문양과 테두리)
                if ((y === 0 && x === 2) || (y === 4 && x === 2)) {
                    const isBlue = (y === 0);
                    ctx.fillStyle = isBlue ? 'rgba(59, 130, 246, 0.1)' : 'rgba(220, 38, 38, 0.1)';
                    ctx.fillRect(px + 4, py + 4, this.cellSize - 8, this.cellSize - 8);
                    
                    ctx.strokeStyle = isBlue ? 'rgba(59, 130, 246, 0.4)' : 'rgba(220, 38, 38, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 8, py + 8, this.cellSize - 16, this.cellSize - 16);
                    
                    // 사원 아이콘 ⛩️
                    ctx.font = '24px serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = isBlue ? 'rgba(59, 130, 246, 0.6)' : 'rgba(220, 38, 38, 0.6)';
                    ctx.fillText('⛩️', px + this.cellSize/2, py + this.cellSize/2);
                }
                
                // 기본 격자선
                ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, this.cellSize, this.cellSize);
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
        // 그림자 효과
        ctx.shadowBlur = 15;
        ctx.shadowColor = isRed ? 'rgba(220, 38, 38, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        
        // 말 그라데이션
        const grad = ctx.createRadialGradient(px - radius/3, py - radius/3, radius/10, px, py, radius);
        if (isRed) {
            grad.addColorStop(0, '#ff6b6b');
            grad.addColorStop(1, '#991b1b');
        } else {
            grad.addColorStop(0, '#60a5fa');
            grad.addColorStop(1, '#1e40af');
        }
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // 테두리
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 마스터 표시 (왕 '王' 또는 심볼)
        if (isMaster) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px "Noto Serif KR"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('王', px, py);
            
            // 프리미엄 테두리 추가
            ctx.strokeStyle = 'gold';
            ctx.lineWidth = 3;
            ctx.stroke();
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


    renderPlayModeCards(game, selectedCardIdx = null, aiSelectedCardIdx = null) {
        // AI 카드 표시
        const aiCardsHolder = document.querySelector('#ai-cards .cards-holder');
        if (aiCardsHolder) {
            aiCardsHolder.innerHTML = '';
            game.blueCards.forEach((cardId, index) => {
                const card = getCard(cardId);
                const cardEl = this.createCardElement(card);
                if (aiSelectedCardIdx === index) {
                    cardEl.classList.add('selected');
                }
                aiCardsHolder.appendChild(cardEl);
            });
        }

        // 플레이어 카드 표시
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
        ctx.fillRect(0, 0, 70, 70);
        
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
