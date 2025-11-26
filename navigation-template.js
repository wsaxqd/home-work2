// 统一导航组件和跳转逻辑

// 导航配置
const navConfig = {
    items: [
        { id: 'home', name: '首页', icon: '🏠', url: 'index.html' },
        { id: 'explore', name: '探索', icon: '🔍', url: 'explore.html' },
        { id: 'create', name: '创作', icon: '🎨', url: 'create.html' },
        { id: 'garden', name: '心灵', icon: '💝', url: 'mind-garden.html' },
        { id: 'profile', name: '我的', icon: '👤', url: 'profile.html' }
    ],
    defaultPage: 'index.html'
};

// 生成统一的底部导航HTML
function generateBottomNav(activePage) {
    let html = `<div class="bottom-nav">\n`;
    
    navConfig.items.forEach(item => {
        const isActive = activePage === item.id;
        html += `        <div class="nav-item ${isActive ? 'active' : ''}" onclick="navigateTo('${item.url}')">\n`;
        html += `            <div class="nav-icon">${item.icon}</div>\n`;
        html += `            <div class="nav-text">${item.name}</div>\n`;
        html += `        </div>\n`;
    });
    
    html += `    </div>`;
    return html;
}

// 统一的页面跳转函数
function navigateTo(page) {
    // 确保所有页面引用统一的首页路径
    if (page === 'home' || page === 'index.html' || page === 'splash.html') {
        window.location.href = 'index.html';
    } else {
        window.location.href = page;
    }
}

// 设置导航激活状态
function setActiveNav(activePageId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const navText = item.querySelector('.nav-text').textContent;
        navConfig.items.forEach(configItem => {
            if (navText === configItem.name && activePageId === configItem.id) {
                item.classList.add('active');
            }
        });
    });
}

// 初始化导航
function initNavigation(activePageId) {
    setActiveNav(activePageId);
    
    // 为所有导航项添加点击事件，确保状态正确更新
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // 避免重复点击当前激活的导航项
            if (!this.classList.contains('active')) {
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// 根据当前URL获取页面ID
function getCurrentPageId() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    // 特殊页面映射
    const pageMap = {
        'index.html': 'home',
        'explore.html': 'explore',
        'create.html': 'create',
        'mind-garden.html': 'garden',
        'profile.html': 'profile',
        'art-creator.html': 'create', // 创作子页面
        'music-creator.html': 'create',
        'story-creator.html': 'create',
        'poem-creator.html': 'create',
        'image-recognition-game.html': 'explore', // 游戏子页面
        'expression-game.html': 'explore',
        'community.html': 'community',
        'assessment.html': 'explore' // 测评页面
    };
    
    return pageMap[filename] || 'home';
}

// 修复返回按钮逻辑
function fixBackButtonLogic() {
    const backButtons = document.querySelectorAll('.back-button, [onclick*="goBack"]');
    backButtons.forEach(button => {
        button.onclick = function() {
            if (document.referrer && !document.referrer.includes(window.location.host)) {
                // 如果来源不是当前站点，返回首页
                navigateTo('index.html');
            } else if (window.history.length > 1) {
                // 否则使用浏览器历史返回
                window.history.back();
            } else {
                // 历史为空时返回首页
                navigateTo('index.html');
            }
        };
    });
}

// 修复功能模块跳转逻辑
function fixModuleNavigation() {
    // 修复探索功能跳转
    document.querySelectorAll('[onclick*="showSection(\'explore\')"], [onclick*="navigateTo(\'explore.html\')"]').forEach(element => {
        element.onclick = function() {
            navigateTo('explore.html');
        };
    });
    
    // 修复创作功能跳转
    document.querySelectorAll('[onclick*="showSection(\'create\')"], [onclick*="navigateTo(\'create.html\')"]').forEach(element => {
        element.onclick = function() {
            navigateTo('create.html');
        };
    });
    
    // 修复心灵花园跳转
    document.querySelectorAll('[onclick*="showSection(\'garden\')"], [onclick*="navigateTo(\'garden.html\')"], [onclick*="navigateTo(\'mind-garden.html\')"]').forEach(element => {
        element.onclick = function() {
            navigateTo('mind-garden.html');
        };
    });
    
    // 修复社区跳转
    document.querySelectorAll('[onclick*="showSection(\'community\')"], [onclick*="navigateTo(\'community.html\')"]').forEach(element => {
        element.onclick = function() {
            navigateTo('community.html');
        };
    });
}

// 初始化整个应用的导航
function initAppNavigation() {
    try {
        const currentPageId = getCurrentPageId();
        initNavigation(currentPageId);
        fixBackButtonLogic();
        fixModuleNavigation();
    } catch (error) {
        console.error('导航初始化失败:', error);
    }
}