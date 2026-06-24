// Dados Globais da Aplicação
let usuarioLogado = null;
let carrinho = [];

// Seleção de Páginas Principais
const pageHome = document.getElementById('page-home');
const pageProfile = document.getElementById('page-profile');
const btnHome = document.getElementById('btn-home');
const logoBrand = document.getElementById('logo-brand');

// Seleção de Componentes do Modal de Login/Cadastro
const authModal = document.getElementById('authModal');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginView = document.getElementById('auth-login-view');
const registerView = document.getElementById('auth-register-view');
const toRegister = document.getElementById('to-register');
const toLogin = document.getElementById('to-login');

// Seleção de Componentes do Carrinho
const cartOverlay = document.getElementById('cartOverlay');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');

// ================= NAVEGAÇÃO ENTRE PRODUTOS E PERFIL =================
function exibirHome() {
    pageProfile.classList.add('hidden');
    pageHome.classList.remove('hidden');
}

function exibirPerfil() {
    if (!usuarioLogado) {
        authModal.classList.add('active');
        return;
    }
    pageHome.classList.add('hidden');
    pageProfile.classList.remove('hidden');
    document.getElementById('profile-user-name').textContent = usuarioLogado.nome;
    document.getElementById('profile-user-email').textContent = usuarioLogado.email;
}

btnHome.addEventListener('click', (e) => { e.preventDefault(); exibirHome(); });
logoBrand.addEventListener('click', exibirHome);

// ================= CONTROLE DO MODAL LOGIN / CADASTRO =================
openAuthBtn.addEventListener('click', () => {
    if (usuarioLogado) {
        exibirPerfil();
    } else {
        authModal.classList.add('active');
    }
});

closeAuthBtn.addEventListener('click', () => authModal.classList.remove('active'));

toRegister.addEventListener('click', (e) => { 
    e.preventDefault();
    loginView.classList.add('hidden'); 
    registerView.classList.remove('hidden'); 
});

toLogin.addEventListener('click', (e) => { 
    e.preventDefault();
    registerView.classList.add('hidden'); 
    loginView.classList.remove('hidden'); 
});

// Ação de Cadastrar Conta
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    usuarioLogado = {
        nome: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value
    };
    sucessoAutenticacao();
});

// Ação de Fazer Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInformado = document.getElementById('login-email').value;
    usuarioLogado = {
        nome: emailInformado.split('@')[0],
        email: emailInformado
    };
    sucessoAutenticacao();
});

function sucessoAutenticacao() {
    openAuthBtn.innerHTML = `👤 Meu Perfil`;
    authModal.classList.remove('active');
    exibirPerfil();
}

// Botão de Deslogar (Sair)
document.getElementById('btnLogout').addEventListener('click', () => {
    usuarioLogado = null;
    openAuthBtn.innerHTML = `👤 Entrar`;
    exibirHome();
});

// ================= CONTROLE DO CARRINHO GAVETA =================
openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) cartOverlay.classList.remove('active');
});

// Captura botões de compra da Vitrine
document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const img = card.dataset.img;

        carrinho.push({ id, name, price, img });
        atualizarCarrinhoTela();

        // Animação/Feedback visual no botão
        btn.textContent = "✓ Adicionado"; 
        btn.style.backgroundColor = "#2ecc71"; 
        btn.style.color = "white";
        
        setTimeout(() => { 
            btn.textContent = "Adicionar ao Carrinho"; 
            btn.style.backgroundColor = "transparent"; 
            btn.style.color = "#111111"; 
        }, 1000);
    });
});

// Tornando a função de deletar visível para o HTML global de forma segura
window.removerDoCarrinho = function(index) {
    carrinho.splice(index, 1);
    atualizarCarrinhoTela();
};

function atualizarCarrinhoTela() {
    cartCount.textContent = Math.max(0, carrinho.length);

    if (carrinho.length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Seu carrinho está vazio.</p>`;
        cartTotalPrice.textContent = `R$ 0,00`;
        return;
    }

    cartItemsContainer.innerHTML = '';
    let totalAcumulado = 0;

    carrinho.forEach((item, index) => {
        totalAcumulado += item.price;
        const itemHtml = `
            <div class="cart-item">
                <div class="cart-item-img">${item.img}</div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    <button class="btn-remove-item" onclick="removerDoCarrinho(${index})">Remover</button>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
    });

    cartTotalPrice.textContent = `R$ ${totalAcumulado.toFixed(2).replace('.', ',')}`;
}

// Finalizar Compra
document.getElementById('btn-checkout').addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    alert('Compra simulada com sucesso! Seu pedido foi enviado para o histórico do perfil.');
    carrinho = [];
    atualizarCarrinhoTela();
    cartOverlay.classList.remove('active');
});