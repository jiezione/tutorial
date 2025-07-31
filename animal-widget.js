// 动态创建小动物元素并添加到页面
(function() {
    // 存储配置的键名
    const STORAGE_KEY = 'githubAnimalWidgetConfig';
    
    // 从本地存储加载配置
    function loadConfig() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    }
    
    // 保存配置到本地存储
    function saveConfig(config) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.log('无法保存配置到本地存储');
        }
    }
    
    // 提供全局方法让用户可以手动设置GitHub链接
    window.setGitHubAnimalUrl = function(url) {
        if (url && url.startsWith('https://github.com/')) {
            saveConfig({ githubUrl: url });
            // 更新显示和跳转链接
            config.githubUrl = url;
            updateTooltip();
            console.log('GitHub链接已设置: ' + url);
            return true;
        }
        console.error('请提供有效的GitHub链接，例如: https://github.com/用户名/仓库名');
        return false;
    };
    
    // 清除配置
    window.clearGitHubAnimalUrl = function() {
        localStorage.removeItem(STORAGE_KEY);
        console.log('已清除保存的GitHub链接');
    };

    // 智能识别GitHub仓库链接 - 多重机制保障
    function detectGitHubUrl() {
        // 1. 优先使用用户之前设置并保存的链接
        const savedConfig = loadConfig();
        if (savedConfig && savedConfig.githubUrl) {
            return savedConfig.githubUrl;
        }
        
        // 2. 扫描页面中所有GitHub链接
        const githubRegex = /https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/]+)/i;
        const links = document.getElementsByTagName('a');
        const githubLinks = [];
        
        for (let link of links) {
            const href = link.href;
            if (githubRegex.test(href)) {
                const match = href.match(githubRegex);
                if (match && match[2] && match[3]) {
                    githubLinks.push({
                        url: href,
                        score: 10,
                        text: link.textContent.toLowerCase()
                    });
                }
            }
        }
        
        // 对链接评分
        if (githubLinks.length > 0) {
            githubLinks.forEach(link => {
                // 包含特定关键词加分
                const keywords = ['repo', 'repository', 'code', 'source', '项目', '仓库', 'github'];
                keywords.forEach(keyword => {
                    if (link.text.includes(keyword)) {
                        link.score += 5;
                    }
                });
                
                // 链接文本就是用户名/仓库名结构的加分
                if (link.text.includes('/') && link.text.split('/').length >= 2) {
                    link.score += 3;
                }
                
                // 页脚链接加分
                const linkRect = link.getBoundingClientRect();
                if (linkRect.bottom > window.innerHeight * 0.7) {
                    link.score += 3;
                }
            });
            
            githubLinks.sort((a, b) => b.score - a.score);
            return githubLinks[0].url;
        }
        
        // 3. 检查页面中是否有GitHub图标元素
        const githubIcons = document.querySelectorAll('[class*="github"], [id*="github"]');
        for (let icon of githubIcons) {
            const parentLink = icon.closest('a');
            if (parentLink && githubRegex.test(parentLink.href)) {
                return parentLink.href;
            }
        }
        
        // 4. 尝试从GitHub Pages的环境变量推断（适用于action部署）
        // 注意：这只在部分部署环境中可用
        if (window.GITHUB_REPOSITORY) {
            return `https://github.com/${window.GITHUB_REPOSITORY}`;
        }
        
        // 5. 最终fallback
        return null;
    }

    // 配置参数
    let config = {
        githubUrl: detectGitHubUrl(),
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png",
        size: 60,
        moveSpeed: 2,
        changeDirInterval: 3000,
        boundaryPadding: 20
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
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        #dynamic-animal:hover .animal-tooltip {
            opacity: 1;
        }
        .animal-tooltip.error {
            background: #e53e3e;
        }
    `;
    document.head.appendChild(style);

    // 创建小动物元素
    const animal = document.createElement('div');
    animal.id = 'dynamic-animal';
    
    // 更新提示信息
    function updateTooltip() {
        let tooltipContent, tooltipClass = '';
        
        if (config.githubUrl) {
            const displayUrl = config.githubUrl.replace('https://github.com/', '');
            tooltipContent = `跳转到 GitHub: ${displayUrl}`;
        } else {
            tooltipContent = '未找到GitHub链接，按F12在控制台设置';
            tooltipClass = 'error';
        }
        
        animal.innerHTML = `
            <div class="animal-tooltip ${tooltipClass}">${tooltipContent}</div>
            <img src="${config.animalImage}" alt="动态小动物">
        `;
    }
    
    updateTooltip();
    document.body.appendChild(animal);

    // 移动和交互逻辑
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
        if (isClick && config.githubUrl) {
            window.open(config.githubUrl, '_blank');
        } else if (isClick) {
            // 未识别到链接时提示用户如何设置
            alert('未找到GitHub链接，请按F12打开开发者工具，在控制台输入:\nsetGitHubAnimalUrl("https://github.com/你的用户名/你的仓库名")\n来设置跳转链接');
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
    
    // 控制台友好提示
    if (!config.githubUrl) {
        console.log(`%cGitHub小动物组件: 未自动识别到仓库链接`, 'color: #e53e3e; font-weight: bold');
        console.log(`请使用以下命令手动设置:\nsetGitHubAnimalUrl("https://github.com/你的用户名/你的仓库名")`);
        console.log(`清除设置可使用: clearGitHubAnimalUrl()`);
    } else {
        console.log(`%cGitHub小动物组件: 已识别链接: ${config.githubUrl}`, 'color: #38a169; font-weight: bold');
        console.log(`如需修改可使用: setGitHubAnimalUrl("新链接")`);
    }
})();
