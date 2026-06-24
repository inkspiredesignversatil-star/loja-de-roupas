// ==========================================
// 1. ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = [];
let generatedCode = null;
let pendingUser = null;

// ==========================================
// 2. INICIALIZAÇÃO E CONTROLE DE TELAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
    updateCartDOM();
});

function checkLoginStatus() {
    const authBtn = document.getElementById('openAuthBtn');
    const dropdown = document.getElementById('profileDropdown');
    
    if (currentUser) {
        // Altera o texto do botão para o primeiro nome do cliente
        authBtn.innerText = `👤 Olá, ${currentUser.name.split(' ')[0]}`;
        
        // Atualiza os dados dentro do menu suspenso (Dropdown)
        document.getElementById('drop-user-name').innerText = currentUser.name;
        document.getElementById('drop-user-email').innerText = currentUser.email;
        
        updateProfileDOM();
    } else {
        authBtn.innerText = "👤 Entrar";
        if (dropdown) dropdown.classList.remove('active'); // Garante que o menu feche se deslogar
        showPage('home');
    }
}

function showPage(pageName) {
    const pages = {
        home: document.getElementById('page-home'),
        profile: document.getElementById('page-profile')
    };
    
    Object.keys(pages).forEach(key => {
        if (pages[key]) {
            if (key === pageName) {
                pages[key].classList.remove('hidden');
            } else {
                pages[key].classList.add('hidden');
            }
        }
    });
}

function switchAuthView(viewName) {
    const views = {
        login: document.getElementById('auth-login-view'),
        register: document.getElementById('auth-register-view'),
        verification: document.getElementById('auth-verification-view')
    };

    Object.keys(views).forEach(key => {
        if (views[key]) {
            if (key === viewName) {
                views[key].classList.remove('hidden');
            } else {
                views[key].classList.add('hidden');
            }
        }
    });
}

// ==========================================
// 3. EVENTOS UNIFICADOS (MODAIS, ABAS, DROPDOWN)
// ==========================================
function setupEventListeners() {
    const authModal = document.getElementById('authModal');
    const cartOverlay = document.getElementById('cartOverlay');
    const dropdown = document.getElementById('profileDropdown');

    // Comportamento Inteligente do Botão de Perfil (Entrar ou Abrir Dropdown)
    document.getElementById('openAuthBtn').addEventListener('click', (e) => {
        e.stopPropagation(); // Evita fechar imediatamente pelo clique no document
        if (currentUser) {
            // Se já logado, alterna a visibilidade do menu profissional dropdown
            dropdown.classList.toggle('active');
        } else {
            // Se não logado, abre o modal de login
            authModal.classList.add('active');
            switchAuthView('login');
        }
    });

    // Fechar o menu dropdown se o usuário clicar em qualquer outro lugar da tela
    document.addEventListener('click', () => {
        if (dropdown) dropdown.classList.remove('active');
    });

    // Itens de clique interno do Menu Profissional Dropdown
    document.getElementById('drop-btn-profile').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile');
    });

    document.getElementById('drop-btn-orders').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile');
        // Rola a página suavemente até a seção de pedidos do perfil
        setTimeout(() => {
            document.getElementById('orders-container').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    // Função de Logout unificada (usada no menu suspenso e na sidebar)
    const efetuarLogout = () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        checkLoginStatus();
        showPage('home');
    };

    document.getElementById('drop-btn-logout').addEventListener('click', (e) => { e.preventDefault(); efetuarLogout(); });
    document.getElementById('btnLogout').addEventListener('click', efetuarLogout);

    // Fechar Modais 
    document.getElementById('closeAuthBtn').addEventListener('click', () => authModal.classList.remove('active'));
    document.getElementById('openCartBtn').addEventListener('click', () => cartOverlay.classList.add('active'));
    document.getElementById('closeCartBtn').addEventListener('click', () => cartOverlay.classList.remove('active'));

    // Alternar Telas de Autenticação Internas do Modal
    document.getElementById('to-register').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('register'); });
    document.getElementById('to-login').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });
    document.getElementById('back-to-auth-start').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });

    // Cliques de Retorno à Home (Logo e link Coleção)
    document.getElementById('logo-brand').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-home').addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });

    // Submissão de Formulários
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('verificationForm').addEventListener('submit', handleVerification);
    document.getElementById('updateProfileForm').addEventListener('submit', handleProfileUpdate);

    // Captura Cliques nos Botões da Vitrine de Produtos
    document.querySelectorAll('.product-card .btn-add').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.dataset.id,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
                img: card.dataset.img
            };
            addToCart(product);
        });
    });

    // Finalizar Compra
    document.getElementById('btn-checkout').addEventListener('click', checkout);
}

// ==========================================
// 4. LÓGICA DE AUTENTICAÇÃO (SISTEMA 2FA)
// ==========================================
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const cpf = document.getElementById('register-cpf').value;
    const email = document.getElementById('register-email').value;

    pendingUser = { name, cpf, email, phone: "", orders: [] };
    
    generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('simulated-email-code').innerText = generatedCode;
    switchAuthView('verification');
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userFound = users.find(u => u.email === email);

    if (userFound) {
        pendingUser = userFound;
        generatedCode = Math.floor(1000 + Math.random() * 9000).toString();
        document.getElementById('simulated-email-code').innerText = generatedCode;
        switchAuthView('verification');
    } else {
        alert("E-mail não cadastrado. Redirecionando para o formulário de cadastro...");
        switchAuthView('register');
    }
}

function handleVerification(e) {
    e.preventDefault();
    const inputCode = document.getElementById('input-security-code').value;

    if (inputCode === generatedCode) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === pendingUser.email);

        if (userIndex === -1) {
            users.push(pendingUser);
        } else {
            pendingUser = users[userIndex]; // Retorna dados salvos anteriormente se o usuário já existia
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = pendingUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('authModal').classList.remove('active');
        checkLoginStatus();
        showPage('profile');

        document.getElementById('registerForm').reset();
        document.getElementById('loginForm').reset();
        document.getElementById('verificationForm').reset();
    } else {
        alert("Código incorreto. Por favor, verifique o número gerado.");
    }
}

// ==========================================
// 5. ATUALIZAÇÃO E PERSISTÊNCIA DO PERFIL
// ==========================================
function updateProfileDOM() {
    if (!currentUser) return;

    // Atualiza a barra lateral (Sidebar)
    document.getElementById('profile-user-name').innerText = currentUser.name;
    document.getElementById('profile-user-email').innerText = currentUser.email;
    document.getElementById('profile-user-cpf').innerText = `CPF: ${currentUser.cpf}`;
    document.getElementById('profile-user-phone').innerText = currentUser.phone ? `Tel: ${currentUser.phone}` : "Sem telefone salvo";

    // Preenche os Inputs de edição
    document.getElementById('update-name').value = currentUser.name;
    document.getElementById('update-phone').value = currentUser.phone || "";

    renderOrders();
}

function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;

    currentUser.name = document.getElementById('update-name').value;
    currentUser.phone = document.getElementById('update-phone').value;

    // Atualiza a sessão ativa no LocalStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Sincroniza as alterações com a base de dados global local
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.map(u => u.email === currentUser.email ? currentUser : u);
    localStorage.setItem('users', JSON.stringify(users));

    updateProfileDOM();
    checkLoginStatus();
    alert("Alterações salvas com sucesso!");
}

function renderOrders() {
    const container = document.getElementById('orders-container');
    if (!currentUser.orders || currentUser.orders.length === 0) {
        container.innerHTML = `<p class="no-orders">Você ainda não realizou nenhum pedido.</p>`;
        return;
    }

    container.innerHTML = currentUser.orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span>Pedido #${order.id} - ${order.date}</span>
                <span class="status entregue">Entregue</span>
            </div>
            <p style="font-size: 14px; margin-bottom: 5px; color: #555;">${order.itemsSummary}</p>
            <p style="font-size: 15px; font-weight: 600;">Total: R$ ${order.total.toFixed(2).replace('.', ',')}</p>
        </div>
    `).join('');
}

// ==========================================
// 6. GESTÃO DO CARRINHO E COMPRAS
// ==========================================
function addToCart(product) {
    cart.push(product);
    updateCartDOM();
    document.getElementById('cartOverlay').classList.add('active');
}

// Disponibilizado globalmente para escuta direta do atributo "onclick" herdado do seu HTML estruturado
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartDOM();
}

function updateCartDOM() {
    const countBadge = document.getElementById('cart-count');
    const container = document.getElementById('cart-items-container');
    const totalDisplay = document.getElementById('cart-total-price');

    countBadge.innerText = cart.length;

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Seu carrinho está vazio.</p>`;
        totalDisplay.innerText = "R$ 0,00";
        return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="cart-item">
                <div class="cart-item-img">${item.img}</div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    <button class="btn-remove-item" onclick="removeFromCart(${index})">Remover</button>
                </div>
            </div>
        `;
    }).join('');

    totalDisplay.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function checkout() {
    if (cart.length === 0) {
        alert("Adicione itens ao carrinho antes de finalizar!");
        return;
    }
    if (!currentUser) {
        alert("Acesse sua conta para concluir a compra.");
        document.getElementById('cartOverlay').classList.remove('active');
        document.getElementById('authModal').classList.add('active');
        switchAuthView('login');
        return;
    }

    const total = cart.reduce((acc, item) => acc + item.price, 0);
    const itemsSummary = cart.map(item => item.name).join(', ');

    const newOrder = {
        id: Math.floor(10000 + Math.random() * 90000),
        date: new Date().toLocaleDateString('pt-BR'),
        total: total,
        itemsSummary: itemsSummary
    };

    // Insere o novo pedido no topo da lista (histórico reativo do cliente)
    currentUser.orders.unshift(newOrder);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Atualiza o registro permanente no banco simulado
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.map(u => u.email === currentUser.email ? currentUser : u);
    localStorage.setItem('users', JSON.stringify(users));

    // Reseta o estado do carrinho pós-venda concluída
    cart = [];
    updateCartDOM();
    document.getElementById('cartOverlay').classList.remove('active');

    // Atualiza a tela de exibição do painel e direciona o usuário
    updateProfileDOM();
    showPage('profile');
    alert("Compra simulada com sucesso! Seu pedido já está no histórico.");
}