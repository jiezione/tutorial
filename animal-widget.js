// 2D游戏风格卡通角色组件
(function() {
    // 仓库信息识别逻辑（保持原有可靠的识别方式）
    function detectRepoInfo() {
        // 1. 优先读取meta标签
        const repoMeta = document.querySelector('meta[name="github-repo"]');
        if (repoMeta && repoMeta.content) {
            const [username, repoName] = repoMeta.content.split('/');
            return username && repoName ? {
                username, repoName, repoUrl: `https://github.com/${username}/${repoName}`
            } : null;
        }
        
        // 2. 从链接提取
        const repoRegex = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
        const links = document.getElementsByTagName('a');
        for (let link of links) {
            const match = link.href.match(repoRegex);
            if (match && match[1] && match[2]) return {
                username: match[1], repoName: match[2], repoUrl: link.href
            };
        }
        return null;
    }
    const repoInfo = detectRepoInfo();

    // 配置参数
    const config = {
        width: 120,      // 角色宽度
        height: 140,     // 角色高度
        moveSpeed: 2,    // 移动速度
        jumpHeight: 5,   // 跳跃高度
        emotionRate: 5000 // 表情变化间隔(ms)
    };

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #game-character {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.2s ease;
        }
        #game-character:active {
            cursor: grabbing;
        }
        #game-character:hover {
            transform: scale(1.05);
        }
        #game-character canvas {
            width: ${config.width}px;
            height: ${config.height}px;
        }
        #game-character .tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-5px);
            background: #24292e;
            color: white;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
        }
        #game-character:hover .tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        #game-character .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #24292e transparent transparent transparent;
        }
    `;
    document.head.appendChild(style);

    // 创建角色容器
    const container = document.createElement('div');
    container.id = 'game-character';
    const tooltipText = repoInfo ? `GitHub: ${repoInfo.username}/${repoInfo.repoName}` : 'GitHub 仓库';
    container.innerHTML = `<div class="tooltip">${tooltipText}</div>`;
    document.body.appendChild(container);

    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = config.height;
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // 角色状态
    const state = {
        x: window.innerWidth - config.width - 20,
        y: window.innerHeight - config.height - 20,
        vx: config.moveSpeed * (Math.random() > 0.5 ? 1 : -1),
        vy: 0,
        isJumping: false,
        jumpCount: 0,
        emotion: 'idle', // idle, happy, confused, excited
        frame: 0,
        isDragging: false,
        offsetX: 0,
        offsetY: 0,
        // 动画物理参数
        gravity: 0.2,
        jumpForce: -5,
        maxJumps: 2
    };

    // 绘制角色函数
    function drawCharacter() {
        // 清除画布
        ctx.clearRect(0, 0, config.width, config.height);
        
        // 更新动画帧
        state.frame = (state.frame + 0.1) % 10;
        
        // 保存状态
        ctx.save();
        
        // 绘制身体
        // 躯干
        ctx.fillStyle = '#3B82F6'; // 蓝色上衣
        ctx.fillRect(40, 60, 40, 50);
        
        // 头部
        ctx.beginPath();
        ctx.arc(60, 40, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#FFDBAC'; // 肤色
        ctx.fill();
        ctx.strokeStyle = '#E0B080';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 眼睛（根据表情变化）
        ctx.fillStyle = '#333';
        switch(state.emotion) {
            case 'idle':
                ctx.beginPath();
                ctx.ellipse(50, 35, 3, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(70, 35, 3, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                // 嘴巴
                ctx.beginPath();
                ctx.arc(60, 48, 5, 0, Math.PI, false);
                ctx.lineWidth = 1.5;
                ctx.stroke();
                break;
                
            case 'happy':
                ctx.beginPath();
                ctx.ellipse(50, 33, 4, 4, 0, 0, Math.PI * 2);
                ctx.ellipse(70, 33, 4, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                // 微笑嘴巴
                ctx.beginPath();
                ctx.arc(60, 50, 8, 0, Math.PI, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
                
            case 'confused':
                ctx.beginPath();
                ctx.ellipse(50, 37, 3, 4, 0.3, 0, Math.PI * 2);
                ctx.ellipse(70, 37, 3, 4, -0.3, 0, Math.PI * 2);
                ctx.fill();
                // 困惑嘴巴
                ctx.beginPath();
                ctx.arc(60, 50, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'excited':
                ctx.beginPath();
                ctx.ellipse(50, 32, 4, 5, 0, 0, Math.PI * 2);
                ctx.ellipse(70, 32, 4, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                // 兴奋嘴巴
                ctx.beginPath();
                ctx.arc(60, 52, 10, 0, Math.PI, false);
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }
        
        // 手臂（带动画）
        const armSwing = Math.sin(state.frame) * 10;
        ctx.fillStyle = '#FFDBAC';
        // 左臂
        ctx.fillRect(25, 65 + armSwing, 15, 5);
        // 右臂
        ctx.fillRect(80, 65 - armSwing, 15, 5);
        
        // 腿部（带动画）
        const legSwing = Math.cos(state.frame) * 5;
        ctx.fillStyle = '#1E40AF'; // 深色裤子
        // 左腿
        ctx.fillRect(45, 110, 10, 20 + legSwing);
        // 右腿
        ctx.fillRect(65, 110, 10, 20 - legSwing);
        
        // 头发
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(60, 30, 28, 0, Math.PI, true);
        ctx.fill();
        // 头发细节
        ctx.fillRect(35, 15, 5, 15);
        ctx.fillRect(80, 15, 5, 15);
        ctx.fillRect(60, 5, 5, 10);
        
        // 恢复状态
        ctx.restore();
        
        requestAnimationFrame(drawCharacter);
    }

    // 物理和移动更新
    function update() {
        if (!state.isDragging) {
            // 应用重力
            state.vy += state.gravity;
            state.y += state.vy;
            
            // 边界检测
            const maxX = window.innerWidth - config.width;
            const maxY = window.innerHeight - config.height;
            
            if (state.x <= 0 || state.x >= maxX) {
                state.vx = -state.vx;
                // 碰到左右边界时跳跃
                if (state.y >= maxY - 10) {
                    state.vy = state.jumpForce;
                }
            }
            
            if (state.y >= maxY) {
                state.y = maxY;
                state.vy = 0;
                state.isJumping = false;
                state.jumpCount = 0;
            }
            
            // 随机改变表情
            if (Math.random() < 0.001) {
                const emotions = ['idle', 'happy', 'confused', 'excited'];
                state.emotion = emotions[Math.floor(Math.random() * emotions.length)];
            }
            
            // 更新位置
            state.x += state.vx;
            container.style.left = `${state.x}px`;
            container.style.top = `${state.y}px`;
        }
        
        requestAnimationFrame(update);
    }

    // 拖动功能
    container.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        const rect = container.getBoundingClientRect();
        state.offsetX = e.clientX - rect.left;
        state.offsetY = e.clientY - rect.top;
        container.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (state.isDragging) {
            state.x = e.clientX - state.offsetX + window.scrollX;
            state.y = e.clientY - state.offsetY + window.scrollY;
            
            // 限制在窗口内
            const maxX = window.innerWidth - config.width;
            const maxY = window.innerHeight - config.height;
            state.x = Math.max(0, Math.min(state.x, maxX));
            state.y = Math.max(0, Math.min(state.y, maxY));
            
            container.style.left = `${state.x}px`;
            container.style.top = `${state.y}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (state.isDragging) {
            state.isDragging = false;
            container.style.transition = 'transform 0.2s ease';
            // 拖动结束后给一个小跳跃
            state.vy = state.jumpForce * 0.7;
        }
    });

    // 点击跳转
    container.addEventListener('click', () => {
        if (repoInfo?.repoUrl) {
            window.open(repoInfo.repoUrl, '_blank');
        } else {
            window.open('https://github.com', '_blank');
        }
    });

    // 窗口大小改变时调整位置
    window.addEventListener('resize', () => {
        const maxX = window.innerWidth - config.width;
        const maxY = window.innerHeight - config.height;
        state.x = Math.max(0, Math.min(state.x, maxX));
        state.y = Math.max(0, Math.min(state.y, maxY));
        container.style.left = `${state.x}px`;
        container.style.top = `${state.y}px`;
    });

    // 启动动画
    drawCharacter();
    update();
})();