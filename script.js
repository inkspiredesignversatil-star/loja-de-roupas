/* ==========================================================================
   ESTADO GLOBAL E BANCO DE DADOS SIMULADO (LOCALSTORAGE)
   ========================================================================== */
const KEY_USERS = 'vibes_atelier_users';
const KEY_SESSION = 'vibes_atelier_current_user';

let cart = [];
let currentUser = JSON.parse(localStorage.getItem(KEY_SESSION)) || null;

/* ==========================================================================
   INICIALIZAÇÃO DO SISTEMA
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initAuthEvents();
    initCartEvents();
    initNavigation();
    updateAuthUI();
    updateCartUI();
});

/* ==========================================================================
   SISTEMA DE AUTENTICAÇÃO, VALIDAÇÃO E PERFIL
   ========================================================================== */

function getRegisteredUsers() {
    const users = localStorage.getItem(KEY_USERS);
    return users ? JSON.parse(users) : [];
}

// Abre/Fecha a Modal de Autenticação
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    
    modal.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        switchAuthMode('login');
    }
}

// Controla as telas visíveis dentro da modal ou fluxos extras de cadastro
function switchAuthMode(mode) {
    const signupContainer = document.getElementById('signup-form-container');
    const registerView = document.getElementById('auth-register-view');
    const verificationView = document.getElementById('auth-verification-view');

    // Inicializa todos escondidos para evitar sobreposição
    if (signupContainer) signupContainer.classList.add('hidden');
    if (registerView) registerView.classList.add('hidden');
    if (verificationView) verificationView.classList.add('hidden');

    if (mode === 'login' || mode === 'signup') {
        if (signupContainer) signupContainer.classList.remove('hidden');
    } else if (mode === 'register') {
        if (registerView) registerView.classList.remove('hidden');
    } else if (mode === 'verification') {
        if (verificationView) verificationView.classList.remove('hidden');
    }
}

// Configura os ouvintes de evento para os formulários de autenticação
function initAuthEvents() {
    // Evento do botão da barra de navegação "👤 Entrar"
    const openAuthBtn = document.getElementById('openAuthBtn');
    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => {
            if (currentUser) {
                toggleProfileDropdown();
            } else {
                toggleAuthModal();
            }
        });
    }

    // Formulário de Cadastro Inicial / Login Simplificado
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Para manter simplicidade no fluxo enviado, tratamos o submit como tentativa de login direto
            handleLogin(e, 'signup-email', 'signup-password');
        });
    }

    // Formulário de Cadastro Completo (Com a trava de E-mail e CPF)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSignUp(e);
        });
    }

    // Formulário de Verificação de Segurança (2FA Código)
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            completeRegistrationFlow();
        });
    }

    // Trocas de visualização entre links da tela
    const toLoginLink = document.getElementById('to-login');
    if (toLoginLink) toLoginLink.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode('login'); });

    const backToStart = document.getElementById('back-to-auth-start');
    if (backToStart) backToStart.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode('login'); });

    // Botões e links do Dropdown do Perfil
    const dropBtnProfile = document.getElementById('drop-btn-profile');
    if (dropBtnProfile) dropBtnProfile.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });

    const dropBtnOrders = document.getElementById('drop-btn-orders');
    if (dropBtnOrders) dropBtnOrders.addEventListener('click', (e) => { e.preventDefault(); navigateTo('profile'); });

    const dropBtnLogout = document.getElementById('drop-btn-logout');
    if (dropBtnLogout) dropBtnLogout.addEventListener('click', (e) => { e.preventDefault(); handleLogout(); });

    const btnSidebarLogout = document.getElementById('btnLogout');
    if (btnSidebarLogout) btnSidebarLogout.addEventListener('click', handleLogout);

    // Formulário para Atualização dos Dados do Perfil
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleProfileUpdate);
    }
}

// TRAVA EXCLUSIVA: Cria conta impedindo duplicidade de E-mail ou CPF
let temporaryUserStorage = null; // Armazena o usuário enquanto aguarda a inserção do código 2FA

function handleSignUp(event) {
    const name = document.getElementById('register-name').value.trim();
    const cpf = document.getElementById('register-cpf').value.trim().replace(/[.-]/g, ''); // Limpa máscara
    const email = document.getElementById('register-email').value.trim().toLowerCase();
    const passwords = event.target.querySelectorAll('input[type="password"]');
    const password = passwords.length ? passwords[0].value : '123456';

    const registeredUsers = getRegisteredUsers();

    // 1. VALIDAÇÃO RIGOROSA: E-mail Duplicado
    const emailExists = registeredUsers.some(user => user.email === email);
    if (emailExists) {
        alert("❌ Erro: Este endereço de e-mail já está cadastrado por outro usuário!");
        document.getElementById('register-email').focus();
        return;
    }

    // 2. VALIDAÇÃO RIGOROSA: CPF Duplicado
    const cpfExists = registeredUsers.some(user => user.cpf === cpf);
    if (cpfExists) {
        alert("❌ Erro: Este CPF já está vinculado a outra conta!");
        document.getElementById('register-cpf').focus();
        return;
    }

    // Armazena temporariamente os dados antes da validação do token
    temporaryUserStorage = {
        name: name,
        cpf: cpf,
        email: email,
        password: password,
        phone: '',
        orders: [
            { id: "#8842", date: "24/06/2026", total: "R$ 249,90", status: "entregue" }
        ]
    };

    // Gera código randômico de 4 dígitos para exibição na simulação de 2FA
    const generatedCode = Math.floor(1000 + Math.random() * 9000);
    const codeBadge = document.getElementById('simulated-email-code');
    if (codeBadge) codeBadge.textContent = generatedCode;

    switchAuthMode('verification');
}

// Finaliza o registro salvando na base global após a verificação do código
function completeRegistrationFlow() {
    const codeBadge = document.getElementById('simulated-email-code').textContent;
    const inputCode = document.getElementById('input-security-code').value.trim();

    if (inputCode !== codeBadge) {
        alert("❌ Código incorreto. Verifique o número gerado no painel verde.");
        return;
    }

    if (!temporaryUserStorage) return;

    const registeredUsers = getRegisteredUsers();
    registeredUsers.push(temporaryUserStorage);
    localStorage.setItem(KEY_USERS, JSON.stringify(registeredUsers));

    // Faz o login automático do usuário cadastrado
    currentUser = temporaryUserStorage;
    localStorage.setItem(KEY_SESSION, JSON.stringify(currentUser));

    alert("✨ Conta criada e validada com sucesso!");
    temporaryUserStorage = null;
    
    document.getElementById('registerForm').reset();
    document.getElementById('verificationForm').reset();
    
    toggleAuthModal();
    updateAuthUI();
}

// Processa a validação de Login convencional
function handleLogin(event, emailId = 'signup-email', passwordId = 'signup-password') {
    const email = document.getElementById(emailId).value.trim().toLowerCase();
    const password = document.getElementById(passwordId).value;

    const registeredUsers = getRegisteredUsers();
    const foundUser = registeredUsers.find(user => user.email === email && user.password === password);

    if (foundUser) {
        currentUser = foundUser;
        localStorage.setItem(KEY_SESSION, JSON.stringify(currentUser));
        alert(`Olá, ${currentUser.name}! Login realizado com sucesso.`);
        toggleAuthModal();
        updateAuthUI();
        if (!document.getElementById('page-profile').classList.contains('hidden')) {
            loadProfileData();
        }
    } else {
        // Se a conta não existe, nós convidamos de forma elegante a criar uma no fluxo com CPF
        alert("Conta não localizada ou senha incorreta. Redirecionando para a criação de conta.");
        switchAuthMode('register');
    }
}

// Executa a saída do usuário logado
function handleLogout() {
    currentUser = null;
    localStorage.removeItem(KEY_SESSION);
    alert("Sessão encerrada.");
    updateAuthUI();
    navigateTo('home');
}

// Atualiza informações cadastrais mutáveis (Nome e Telefone)
function handleProfileUpdate(event) {
    event.preventDefault();
    if (!currentUser) return;

    const updatedName = document.getElementById('update-name').value.trim();
    const updatedPhone = document.getElementById('update-phone').value.trim();

    currentUser.name = updatedName;
    currentUser.phone = updatedPhone;
    localStorage.setItem(KEY_SESSION, JSON.stringify(currentUser));

    const registeredUsers = getRegisteredUsers();
    const newUsersArray = registeredUsers.map(user => {
        if (user.cpf === currentUser.cpf) {
            return { ...user, name: updatedName, phone: updatedPhone };
        }
        return user;
    });
    localStorage.setItem(KEY_USERS, JSON.stringify(newUsersArray));

    alert("✨ Dados atualizados com sucesso!");
    loadProfileData();
    updateAuthUI();
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

// Mantém as interfaces do topo alinhadas com o estado da sessão
function updateAuthUI() {
    const openAuthBtn = document.getElementById('openAuthBtn');
    const dropName = document.getElementById('drop-user-name');
    const dropEmail = document.getElementById('drop-user-email');

    if (currentUser) {
        if (openAuthBtn) openAuthBtn.textContent = `👤 Olá, ${currentUser.name.split(' ')[0]}`;
        if (dropName) dropName.textContent = currentUser.name;
        if (dropEmail) dropEmail.textContent = currentUser.email;
    } else {
        if (openAuthBtn) openAuthBtn.textContent = "👤 Entrar";
    }
}

function loadProfileData() {
    if (!currentUser) return;

    // Popula a barra lateral informativa
    document.getElementById('profile-user-name').textContent = currentUser.name;
    document.getElementById('profile-user-email').textContent = currentUser.email;
    document.getElementById('profile-user-cpf').textContent = `CPF: ${currentUser.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`;
    document.getElementById('profile-user-phone').textContent = currentUser.phone ? `Tel: ${currentUser.phone}` : "Sem telefone salvo";

    // Popula inputs do formulário de modificações
    document.getElementById('update-name').value = currentUser.name;
    document.getElementById('update-phone').value = currentUser.phone || '';

    // Popula lista de compras
    const container = document.getElementById('orders-container');
    if (container) {
        if (currentUser.orders && currentUser.orders.length > 0) {
            container.innerHTML = currentUser.orders.map(order => `
                <div class="order-card">
                    <div class="order-header">
                        <span>Pedido ${order.id}</span>
                        <span class="status ${order.status}">${order.status}</span>
                    </div>
                    <p style="font-size: 13px; color: #888;">Data da transação: ${order.date}</p>
                    <p style="font-size: 14px; font-weight: 600; margin-top: 10px;">Total: ${order.total}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = `<p class="no-orders">Nenhum pedido efetuado até o momento.</p>`;
        }
    }
}

/* ==========================================================================
   SISTEMA DE CARRINHO DE COMPRAS
   ========================================================================== */

function initCartEvents() {
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');

    if (openCartBtn) openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

    // Configura os botões da vitrine baseado nos atributos data-* do HTML fornecido
    document.querySelectorAll('.product-card').forEach(card => {
        const addBtn = card.querySelector('.btn-add');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                const name = card.getAttribute('data-name');
                const price = parseFloat(card.getAttribute('data-price'));
                const img = card.getAttribute('data-img');
                
                addToCart({ id, name, price, img });
            });
        }
    });

    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            alert("Compra finalizada com sucesso! Obrigado por comprar na VIBES ATELIER.");
            cart = [];
            updateCartUI();
            cartOverlay.classList.remove('active');
        });
    }
}

function addToCart(product) {
    cart.push(product);
    updateCartUI();
    document.getElementById('cartOverlay').classList.add('active');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalPriceElement = document.getElementById('cart-total-price');
    const badgeCount = document.getElementById('cart-count');

    if (badgeCount) badgeCount.textContent = cart.length;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart-msg">Seu carrinho está vazio.</p>`;
        if (totalPriceElement) totalPriceElement.textContent = "R$ 0,00";
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-img">${item.img}</div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                <button class="btn-remove-item" onclick="removeFromCart(${index})">Remover</button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((acc, item) => acc + item.price, 0);
    if (totalPriceElement) totalPriceElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

/* ==========================================================================
   NAVEGAÇÃO DA PÁGINA (SINGLE PAGE APPLICATION)
   ========================================================================== */

function initNavigation() {
    const logo = document.getElementById('logo-brand');
    const btnHome = document.getElementById('btn-home');

    if (logo) logo.addEventListener('click', () => navigateTo('home'));
    if (btnHome) btnHome.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });

    // Fecha o dropdown caso o usuário clique em qualquer área cinza ou fora dele
    window.addEventListener('click', (e) => {
        const container = document.getElementById('profileDropdownContainer');
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && dropdown.classList.contains('active') && !container.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

function navigateTo(page) {
    const homeView = document.getElementById('page-home');
    const profileView = document.getElementById('page-profile');
    const dropdown = document.getElementById('profileDropdown');

    if (dropdown) dropdown.classList.remove('active');

    if (page === 'profile') {
        if (!currentUser) {
            toggleAuthModal();
            return;
        }
        loadProfileData();
        if (homeView) homeView.classList.add('hidden');
        if (profileView) profileView.classList.remove('hidden');
    } else {
        if (homeView) homeView.classList.remove('hidden');
        if (profileView) profileView.classList.add('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}