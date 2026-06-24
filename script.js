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
        
        // Atualiza os dados dentro do menu suspenso
        document.getElementById('drop-user-name').innerText = currentUser.name;
        document.getElementById('drop-user-email').innerText = currentUser.email;
        
        updateProfileDOM();
    } else {
        authBtn.innerText = "👤 Entrar";
        dropdown.classList.remove('active'); // Garante que o menu feche se deslogar
        showPage('home');
    }
}

// Adicione/substitua esses gatilhos dentro da sua função setupEventListeners()
function setupEventListeners() {
    const authModal = document.getElementById('authModal');
    const dropdown = document.getElementById('profileDropdown');

    // Comportamento do Botão de Perfil Principal
    document.getElementById('openAuthBtn').addEventListener('click', (e) => {
        e.stopPropagation(); // Evita fechar imediatamente
        if (currentUser) {
            // Se logado, alterna a visibilidade do menu profissional
            dropdown.classList.toggle('active');
        } else {
            // Se não logado, abre o modal de login
            authModal.classList.add('active');
            switchAuthView('login');
        }
    });

    // Fechar o menu se o usuário clicar em qualquer outro lugar da tela
    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    // Itens de clique interno do Menu Profissional
    document.getElementById('drop-btn-profile').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile');
    });

    document.getElementById('drop-btn-orders').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile');
        // Rola a página suavemente até a seção de pedidos do perfil
        document.getElementById('orders-container').scrollIntoView({ behavior: 'smooth' });
    });

    // Função de Logout unificada no menu suspenso e na sidebar
    const efetuarLogout = () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        checkLoginStatus();
        showPage('home');
    };

    document.getElementById('drop-btn-logout').addEventListener('click', (e) => { e.preventDefault(); efetuarLogout(); });
    document.getElementById('btnLogout').addEventListener('click', efetuarLogout);

    /* ... Mantenha o restante dos seletores anteriores (carrinho, forms, etc.) ... */
}
// ==========================================
// 3. EVENTOS (MODAIS, ABAS E LOGOUT)
// ==========================================
function setupEventListeners() {
    const authModal = document.getElementById('authModal');
    const cartOverlay = document.getElementById('cartOverlay');

    // Navegação e Perfil
    document.getElementById('openAuthBtn').addEventListener('click', () => {
        if (currentUser) {
            showPage('profile');
        } else {
            authModal.classList.add('active');
            switchAuthView('login');
        }
    });

    // Fechar Modais (Usando a classe .active do seu CSS)
    document.getElementById('closeAuthBtn').addEventListener('click', () => authModal.classList.remove('active'));
    document.getElementById('openCartBtn').addEventListener('click', () => cartOverlay.classList.add('active'));
    document.getElementById('closeCartBtn').addEventListener('click', () => cartOverlay.classList.remove('active'));

    // Alternar Telas de Autenticação
    document.getElementById('to-register').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('register'); });
    document.getElementById('to-login').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });
    document.getElementById('back-to-auth-start').addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });

    // Cliques de Retorno à Home
    document.getElementById('logo-brand').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-home').addEventListener('click', (e) => { e.preventDefault(); showPage('home'); });

    // Cadastro, Login e Verificação
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('verificationForm').addEventListener('submit', handleVerification);
    document.getElementById('updateProfileForm').addEventListener('submit', handleProfileUpdate);

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        checkLoginStatus();
        showPage('home');
    });

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
// 4. LÓGICA DE AUTENTICAÇÃO
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
        alert("E-mail não cadastrado. Criando um novo fluxo para você...");
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
            pendingUser = users[userIndex]; // Puxa histórico real caso já exista
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
        alert("Código incorreto. Digite o código exibido na caixa preta.");
    }
}

// ==========================================
// 5. ATUALIZAÇÃO DE DADOS DO PERFIL
// ==========================================
function updateProfileDOM() {
    if (!currentUser) return;

    document.getElementById('profile-user-name').innerText = currentUser.name;
    document.getElementById('profile-user-email').innerText = currentUser.email;
    document.getElementById('profile-user-cpf').innerText = `CPF: ${currentUser.cpf}`;
    document.getElementById('profile-user-phone').innerText = currentUser.phone ? `Tel: ${currentUser.phone}` : "Sem telefone salvo";

    document.getElementById('update-name').value = currentUser.name;
    document.getElementById('update-phone').value = currentUser.phone || "";

    renderOrders();
}

function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;

    currentUser.name = document.getElementById('update-name').value;
    currentUser.phone = document.getElementById('update-phone').value;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

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
// 6. SISTEMA INTEGADO DE CARRINHO E COMPRAS
// ==========================================
function addToCart(product) {
    cart.push(product);
    updateCartDOM();
    document.getElementById('cartOverlay').classList.add('active');
}

function removeFromCart(index) {
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

    // Adiciona o pedido ao perfil ativo
    currentUser.orders.unshift(newOrder);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Atualiza na base global de usuários
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.map(u => u.email === currentUser.email ? currentUser : u);
    localStorage.setItem('users', JSON.stringify(users));

    // Limpa o carrinho
    cart = [];
    updateCartDOM();
    document.getElementById('cartOverlay').classList.remove('active');

    // Renderiza novos dados e envia para a tela de Perfil
    updateProfileDOM();
    showPage('profile');
    alert("Compra simulada com sucesso! Seu pedido já está no histórico.");
}
