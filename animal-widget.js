// 智能GitHub仓库识别组件
(function() {
    // 存储配置的键名
    const STORAGE_KEY = 'githubRepoWidgetConfig';
    // GitHub仓库仓库仓库正则表达式 - 严格确匹配GitHub仓库URL
    const REPO_REGEX = /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\/?$/i;
    // 提取仓库信息的辅助正则
    const EXTRACT_REPO_REGEX = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;

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
    function saveConfig(username, repoName) {
        try {
            const repoUrl = `https://github.com/${username}/${repoName}`;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                username: username,
                repoName: repoName,
                repoUrl: repoUrl
            }));
            return repoUrl;
        } catch (e) {
            console.error('保存配置失败:', e);
            return null;
        }
    }

    // 全局方法：手动动设置GitHub仓库
    window.setGitHubRepo = function(username, repoName) {
        if (!username || !repoName || typeof username !== 'string' || typeof repoName !== 'string') {
            console.error('请提供有效的GitHub用户名和仓库名');
            return false;
        }
        
        // 清理输入
        const cleanUsername = username.trim();
        const cleanRepoName = repoName.trim();
        
        if (!cleanUsername || !cleanRepoName) {
            console.error('用户名和仓库名不能为空');
            return false;
        }
        
        const repoUrl = saveConfig(cleanUsername, cleanRepoName);
        if (repoUrl) {
            config.username = cleanUsername;
            config.repoName = cleanRepoName;
            config.repoUrl = repoUrl;
            updateTooltip();
            console.log(`已设置GitHub仓库: ${repoUrl}`);
            return true;
        }
        return false;
    };

    // 验证仓库信息格式
    function isValidRepoInfo(username, repoName) {
        return /^[a-zA-Z0-9_-]{1,39}$/.test(username) &&
               /^[a-zA-Z0-9_-]{1,100}$/.test(repoName);
    }

    // 智能识别GitHubGitHub仓库信息
    function detectGitHubRepo() {
        // 1. 优先使用用户手动设置的仓库信息
        const savedConfig = loadConfig();
        if (savedConfig && savedConfig.username && savedConfig.repoName &&
            isValidRepoInfo(savedConfig.username, savedConfig.repoName)) {
            return {
                username: savedConfig.username,
                repoName: savedConfig.repoName,
                repoUrl: savedConfig.repoUrl
            };
        }

        // 2. 扫描页面中明确的仓库链接（最高优先级）
        const links = document.getElementsByTagName('a');
        const repoLinks = [];

        for (let link of links) {
            const href = link.href;
            const repoMatch = href.match(REPO_REGEX);
            
            if (repoMatch && repoMatch[2] && repoMatch[3]) {
                const username = repoMatch[2];
                const repoName = repoMatch[3];
                
                if (isValidRepoInfo(username, repoName)) {
                    // 多维度评分系统
                    let score = 10;
                    const linkText = link.textContent.toLowerCase();
                    
                    // 链接文本文本包含仓库名或关键词加分
                    if (linkText.includes(repoName.toLowerCase())) score += 10;
                    if (linkText.includes('repo') || linkText.includes('repository') || 
                        linkText.includes('仓库') || linkText.includes('代码')) score += 7;
                    
                    // 带有GitHub图标的链接加分
                    if (link.querySelector('[class*="github"]') || link.id.includes('github')) score += 8;
                    
                    // 页脚或导航栏中的链接加分
                    const rect = link.getBoundingClientRect();
                    if (rect.bottom > window.innerHeight * 0.7 || rect.top < window.innerHeight * 0.2) score += 5;
                    
                    // 精确匹配完整仓库链接格式的加分
                    if (href.toLowerCase() === `https://github.com/${username}/${repoName}`) score += 15;
                    
                    repoLinks.push({ username, repoName, score });
                }
            }
        }

        // 选择评分最高的仓库链接
        if (repoLinks.length > 0) {
            repoLinks.sort((a, b) => b.score - a.score);
            const bestMatch = repoLinks[0];
            return {
                username: bestMatch.username,
                repoName: bestMatch.repoName,
                repoUrl: `https://github.com/${bestMatch.username}/${bestMatch.repoName}`
            };
        }

        // 3. 从页面中包含的任何GitHub URL提取仓库信息
        const allLinks = Array.from(links).map(link => link.href);
        const pageText = document.body.textContent + ' ' + allLinks.join(' ');
        const possibleRepos = pageText.match(EXTRACT_REPO_REGEX);
        
        if (possibleRepos && possibleRepos[1] && possibleRepos[2]) {
            const username = possibleRepos[1];
            const repoName = possibleRepos[2];
            if (isValidRepoInfo(username, repoName)) {
                return {
                    username: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${username}/${repoName}`
                };
            }
        }

        // 4. 从GitHub Pages环境变量提取（适用于GitHub Actions部署）
        if (window.GITHUB_REPOSITORY) {
            const [username, repoName] = window.GITHUB_REPOSITORY.split('/');
            if (username && repoName && isValidRepoInfo(username, repoName)) {
                return {
                    username: username,
                    repoName: repoName,
                    repoUrl: `https://github.com/${username}/${repoName}`
                };
            }
        }

        // 5. 从页面元数据提取项目信息
        const metaTags = [
            document.querySelector('meta[name="repository"]'),
            document.querySelector('meta[name="github:repo"]'),
            document.querySelector('meta[property="og:url"]')
        ];

        for (let meta of metaTags) {
            if (meta && meta.content) {
                const match = meta.content.match(EXTRACT_REPO_REGEX);
                if (match && match[1] && match[2] && isValidRepoInfo(match[1], match[2])) {
                    return {
                        username: match[1],
                        repoName: match[2],
                        repoUrl: `https://github.com/${match[1]}/${match[2]}`
                    };
                }
            }
        }

        // 未识别到
        return null;
    }

    // 执行识别
    const detection = detectGitHubRepo();

    // 配置参数
    let config = {
        username: detection ? detection.username : null,
        repoName: detection ? detection.repoName : null,
        repoUrl: detection ? detection.repoUrl : null,
        animalImage: "https://cdn-icons-png.flaticon.com/128/237/237921.png",
        size: 60,
        moveSpeed: 2.5,
        changeDirInterval: 3000,
        boundaryPadding: 15,
        animations: true
    };

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #github-repo-animal {
            position: fixed;
            z-index: 9999;
            cursor: move;
            user-select: none;
            transition: transform 0.3s ease;
        }
        #github-repo-animal:active {
            cursor: grabbing;
        }
        #github-repo-animal:hover {
            transform: scale(1.15);
        }
        #github-repo-animal img {
            width: ${config.size}px;
            height: ${config.size}px;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
            transition: all 0.3s ease;
        }
        #github-repo-animal .tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-5px);
            background: #24292e;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        }
        #github-repo-animal:hover .tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        #github-repo-animal .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #24292e transparent transparent transparent;
        }
        #github-repo-animal .tooltip.error {
            background: #d73a49;
        }
        #github-repo-animal .tooltip.error::after {
            border-color: #d73a49 transparent transparent transparent;
        }
    `;
    document.head.appendChild(style);

    // 创建小动物元素
    const animal = document.createElement('div');
    animal.id = 'github-repo-animal';

    // 更新提示信息
    function updateTooltip() {
        let tooltipContent, tooltipClass = '';
        
        if (config.username && config.repoName) {
            tooltipContent = `GitHub: ${config.username}/${config.repoName}`;
        } else {
            tooltipContent = '点击设置仓库';
            tooltipClass = 'error';
        }
        
        animal.innerHTML = `
            <div class="tooltip ${tooltipClass}">${tooltipContent}</div>
            <img src="${config.animalImage}" alt="GitHub仓库小动物">
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

    // 初始化位置
    function initPosition() {
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.random() * (maxX - config.boundaryPadding) + config.boundaryPadding;
        currentY = Math.random() * (maxY - config.boundaryPadding) + config.boundaryPadding;
        updatePosition();
    }

    // 更新位置
    function updatePosition() {
        animal.style.left = `${currentX}px`;
        animal.style.top = `${currentY}px`;
    }

    // 自动移动逻辑
    function autoMove() {
        if (isDragging || !config.animations) return;

        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;

        // 边界反弹逻辑
        if (currentX <= config.boundaryPadding || currentX >= maxX) {
            velocityX = -velocityX * (0.8 + Math.random() * 0.4);
        }
        if (currentY <= config.boundaryPadding || currentY >= maxY) {
            velocityY = -velocityY * (0.8 + Math.random() * 0.4);
        }

        // 随机方向微调
        velocityX += (Math.random() - 0.5) * 0.3;
        velocityY += (Math.random() - 0.5) * 0.3;

        // 限制最大速度
        const maxSpeed = config.moveSpeed * 1.5;
        velocityX = Math.max(-maxSpeed, Math.min(velocityX, maxSpeed));
        velocityY = Math.max(-maxSpeed, Math.min(velocityY, maxSpeed));

        // 更新位置
        currentX += velocityX;
        currentY += velocityY;
        updatePosition();

        requestAnimationFrame(autoMove);
    }

    // 拖动功能
    animal.addEventListener('mousedown', (e) => {
        isDragging = true;
        isClick = false;
        const rect = animal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        animal.style.transition = 'none';
        config.animations = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        currentX = e.clientX - offsetX + window.scrollX;
        currentY = e.clientY - offsetY + window.scrollY;

        // 限制在边界内
        const maxX = window.innerWidth - config.size - config.boundaryPadding;
        const maxY = window.innerHeight - config.size - config.boundaryPadding;
        currentX = Math.max(config.boundaryPadding, Math.min(currentX, maxX));
        currentY = Math.max(config.boundaryPadding, Math.min(currentY, maxY));

        updatePosition();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            animal.style.transition = 'transform 0.3s ease';
            config.animations = true;
            setTimeout(() => { isClick = true; }, 150);
        }
    });

    // 点击行为
    animal.addEventListener('click', () => {
        if (isClick) {
            if (config.repoUrl) {
                // 已识别到仓库，跳转
                window.open(config.repoUrl, '_blank');
            } else {
                // 未识别到，提示设置
                const repoInfo = prompt('请输入GitHub仓库信息（格式：用户名/仓库名）:', '');
                if (repoInfo && repoInfo.includes('/')) {
                    const [username, repoName] = repoInfo.split('/').map(p => p.trim());
                    if (username && repoName) {
                        window.setGitHubRepo(username, repoName);
                    }
                } else {
                    alert('请使用正确格式：用户名/仓库名（例如：octocat/Hello-World）');
                }
            }
        }
    });

    // 窗口大小改变时调整位置
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

    // 控制台提示
    if (config.repoUrl) {
        console.log(`%cGitHub仓库小动物: 已识别仓库`, 'color: #2ea44f; font-weight: bold');
        console.log(`仓库地址: ${config.repoUrl}`);
        console.log(`如需修改，可使用: setGitHubRepo("用户名", "仓库名")`);
    } else {
        console.log(`%cGitHub仓库小动物: 未识别到仓库`, 'color: #d73a49; font-weight: bold');
        console.log(`请点击小动物设置，或在控制台输入: setGitHubRepo("用户名", "仓库名")`);
    }
})();
