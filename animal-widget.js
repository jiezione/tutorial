// 动态创建小动物元素并添加到页面
(function() {
    // 智能识别GitHub仓库链接
    function smartDetectGitHubUrl() {
        // GitHub URL 匹配规则
        const githubRegex = /https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)/i;
        
        // 1. 扫描页面中所有链接寻找GitHub仓库地址
        const links = document.getElementsByTagName('a');
        const githubLinks = [];
        
        for (let link of links) {
            const href = link.href;
            if (githubRegex.test(href)) {
                // 提取用户名和仓库名
                const match = href.match(githubRegex);
                if (match && match[2] && match[3]) { // 确保有用户名和仓库名
                    githubLinks.push({
                        url: href,
                        score: 10, // 基础分数
                        text: link.textContent.toLowerCase()
                    });
                }
            }
        }
        
        // 2. 为链接评分，找到最可能的仓库链接
        if (githubLinks.length > 0) {
            githubLinks.forEach(link => {
                // 包含"repo"、"repository"、"code"等关键词的链接加分
                const keywords = ['repo', 'repository', 'code', 'source', '项目', '仓库'];
                keywords.forEach(keyword => {
                    if (link.text.includes(keyword)) {
                        link.score += 5;
                    }
                });
                
                // 页面底部的链接更可能是仓库链接
                const linkRect = link.getBoundingClientRect();
                if (linkRect.bottom > window.innerHeight * 0.7) {
                    link.score += 3;
                }
            });
            
            // 按分数排序，取最高分的链接
            githubLinks.sort((a, b) => b.score - a.score);
            return githubLinks[0].url;
        }
        
        // 3. 如果没有找到仓库链接，尝试从自定义域名推断
        // （适用于常用的自定义域名命名规范）
        const hostname = window.location.hostname;
        const domainParts = hostname.split('.');
        if (domainParts.length >= 2) {
            // 尝试从子域名或主域名提取可能的用户名
            const possibleUser = domainParts[0];
            return `https://github.com/${possibleUser}`;
        }
        
        // 4. 最终 fallback
        return "https://github.com";
    }

    // 配置参数
    const config = {
        githubUrl: smartDetectGitHubUrl(), // 智能识别GitHub链接
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png", // 小动物图片
        size: 60, // 小动物尺寸（像素）
        moveSpeed: 2, // 移动速度
        changeDirInterval: 3000, // 改变方向间隔（毫秒）
        boundaryPadding: 20 // 边界内边距
    };

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #dynamic-animal {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.2s ease;
        }
        #dynamic-animal:active {
            cursor: grabbing;
        }
        #dynamic-animal img {
            width: ${config.size}px;
            height: ${config.size}px;
            filter: drop-shadow(0 3px 4px rgba(0,0,0,0.15));
        }
        .animal-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        #dynamic-animal:hover .animal-tooltip {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // 创建小动物元素（包含提示信息）
    const animal = document.createElement('div');
    animal.id = 'dynamic-animal';
    // 显示将要跳转的链接（隐藏域名，只显示用户/仓库部分）
    const displayUrl = config.githubUrl 
        ? config.githubUrl.replace('https://github.com/', '')
        : 'GitHub';
    animal.innerHTML = `
        <div class="animal-tooltip">跳转到 ${displayUrl}</div>
        <img src="${config.animalImage}" alt="动态小动物">
    `;
    document.body.appendChild(animal);

    // 状态变量和移动逻辑（保持不变）
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    let currentX = 0;
    let currentY = 0;
    let velocityX = config.moveSpeed;
    let velocityY = config.moveSpeed;
    let isClick = true;

    function initPosition() {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.random() * (maxX - config.boundaryPadding) + config.boundaryPadding;
        currentY = Math.random() * (maxY - config.boundaryPadding) + config.boundaryPadding;
        updatePosition();
    }

    function updatePosition() {
        animal.style.left = `${currentX}px`;
        animal.style.top = `${currentY}px`;
    }

    function autoMove() {
        if (isDragging) return;

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        if (currentX <= config.boundaryPadding || currentX >= maxX) {
            velocityX = -velocityX;
        }
        if (currentY <= config.boundaryPadding || currentY >= maxY) {
            velocityY = -velocityY;
        }

        currentX += velocityX;
        currentY += velocityY;
        updatePosition();

        requestAnimationFrame(autoMove);
    }

    function randomChangeDirection() {
        if (isDragging) {
            setTimeout(randomChangeDirection, 500);
            return;
        }
        
        const angle = Math.random() * Math.PI * 2;
        velocityX = Math.cos(angle) * config.moveSpeed;
        velocityY = Math.sin(angle) * config.moveSpeed;
        
        setTimeout(randomChangeDirection, config.changeDirInterval);
    }

    // 拖动功能
    animal.addEventListener('mousedown', (e) => {
        isDragging = true;
        isClick = false;
        const rect = animal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        animal.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        currentX = e.clientX - offsetX + window.scrollX;
        currentY = e.clientY - offsetY + window.scrollY;

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));

        updatePosition();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            animal.style.transition = 'transform 0.2s ease';
            setTimeout(() => { isClick = true; }, 100);
        }
    });

    // 点击跳转GitHub
    animal.addEventListener('click', () => {
        if (isClick) {
            window.open(config.githubUrl, '_blank');
        }
    });

    window.addEventListener('resize', () => {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));
        updatePosition();
    });

    // 初始化
    initPosition();
    autoMove();
    randomChangeDirection();
})();
