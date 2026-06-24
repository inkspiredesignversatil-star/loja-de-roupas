// Dados Globais da Aplicação
let usuarioLogado = null;
let carrinho = [];
let pedidosUsuarios = {}; 

// Variáveis de Controle do Token de E-mail (2FA)
let tokenGeradoSessao = null;
let dadosTemporariosAutenticacao = null; // Armazena temporariamente os dados antes de validar o token

// Seleção de Páginas
const pageHome = document.getElementById('page-home');
const pageProfile = document.getElementById('page-profile');
const btnHome = document.getElementById('btn-home');
const logoBrand = document.getElementById('logo-brand');

// Vistas do Modal de Autenticação
const authModal = document.getElementById('authModal');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const verificationForm = document.getElementById('verificationForm');

const loginView = document.getElementById('auth-login-view');
const registerView = document.getElementById('auth-register-view');
const verificationView = document.getElementById('auth-verification-view');

const toRegister = document.getElementById('to-register');
const toLogin = document.getElementById('to-login');
const backToAuthStart = document.getElementById('back-to-auth-start');
const loginAlertMsg = document.getElementById('login-alert-msg');
const simulatedEmailCode = document.getElementById('simulated-email-code');

// Máscara do campo CPF em tempo de execução
document.getElementById('register-cpf').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = value;
});

// Componentes Gerais
const cartOverlay = document.getElementById('cartOverlay');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');
const avatarInput = document.getElementById('avatar-input');
const profileImgDisplay = document.getElementById('profile-img-display');
const updateProfileForm = document.getElementById('updateProfileForm');
const ordersContainer = document.getElementById('orders-container');

// ================= NAVEGAÇÃO =================
function exibirHome() {
    pageProfile.classList.add('hidden');
    pageHome.classList.remove('hidden');
}

function exibirPerfil() {
    if (!usuarioLogado) {
        exibirModalLoginComAviso("Por favor, faça login para acessar seu perfil.");
        return;
    }
    pageHome.classList.add('hidden');
    pageProfile.classList.remove('hidden');
    
    document.getElementById('profile-user-name').textContent = usuarioLogado.nome;
    document.getElementById('profile-user-email').textContent = usuarioLogado.email;
    document.getElementById('profile-user-cpf').textContent = `CPF: ${usuarioLogado.cpf}`;
    document.getElementById('profile-user-phone').textContent = usuarioLogado.telefone || "Sem telefone salvo";
    
    document.getElementById('update-name').value = usuarioLogado.nome;
    document.getElementById('update-phone').value = usuarioLogado.telefone || "";
    
    if (usuarioLogado.foto) {
        profileImgDisplay.src = usuarioLogado.foto;
    } else {
        profileImgDisplay.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
    }
    renderizarPedidos();
}

btnHome.addEventListener('click', (e) => { e.preventDefault(); exibirHome(); });
logoBrand.addEventListener('click', exibirHome);

// ================= CONTROLE DE FLUXO DE SEGURANÇA (2FA) =================
function exibirModalLoginComAviso(mensagem) {
    loginAlertMsg.textContent = mensagem;
    loginAlertMsg.classList.add('alert-highlight');
    resetViewsModais();
    loginView.classList.remove('hidden');
    authModal.classList.add('active');
}

function resetViewsModais() {
    loginView.classList.add('hidden');
    registerView.classList.add('hidden');
    verificationView.classList.add('hidden');
}

function iniciarDesafioToken(dadosUsuario) {
    dadosTemporariosAutenticacao = dadosUsuario;
    tokenGeradoSessao = Math.floor(1000 + Math.random() * 9000).toString(); // Gera token 4 dígitos
    
    // Simulação do painel enviando o e-mail: injeta o código visível no badge verde do modal
    simulatedEmailCode.textContent = tokenGeradoSessao;
    
    resetViewsModais();
    verificationView.classList.remove('hidden');
}

openAuthBtn.addEventListener('click', () => {
    if (usuarioLogado) {
        exibirPerfil();
    } else {
        loginAlertMsg.textContent = "Insira seus dados para entrar.";
        loginAlertMsg.classList.remove('alert-highlight');
        resetViewsModais();
        loginView.classList.remove('hidden');
        authModal.classList.add('active');
    }
});

closeAuthBtn.addEventListener('click', () => authModal.classList.remove('active'));

toRegister.addEventListener('click', (e) => { 
    e.preventDefault(); resetViewsModais(); registerView.classList.remove('hidden'); 
});
toLogin.addEventListener('click', (e) => { 
    e.preventDefault(); resetViewsModais(); loginView.classList.remove('hidden'); 
});
backToAuthStart.addEventListener('click', (e) => {
    e.preventDefault(); resetViewsModais(); loginView.classList.remove('hidden');
});

// Submissão do Cadastro (Pede CPF)
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const cpf = document.getElementById('register-cpf').value;
    
    if (cpf.length < 14) {
        alert("Por favor, digite um CPF válido.");
        return;
    }

    iniciarDesafioToken({
        nome: document.getElementById('register-name').value,
        email: email,
        cpf: cpf,
        telefone: "",
        foto: null
    });
});

// Submissão do Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    iniciarDesafioToken({
        nome: email.split('@')[0],
        email: email,
        cpf: "Não informado (Login rápido)",
        telefone: "",
        foto: null
    });
});

// Formulário de Validação do Código do E-mail
verificationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const codigoDigitado = document.getElementById('input-security-code').value;

    if (codigoDigitado === tokenGeradoSessao) {
        usuarioLogado = dadosTemporariosAutenticacao;
        if (!pedidosUsuarios[usuarioLogado.email]) {
            pedidosUsuarios[usuarioLogado.email] = [];
        }
        document.getElementById('input-security-code').value = ""; // Limpa campo
        openAuthBtn.innerHTML = `👤 Meu Perfil`;
        authModal.classList.remove('active');
        exibirPerfil();
    } else {
        alert("Código de segurança incorreto! Tente novamente.");
    }
});

document.getElementById('btnLogout').addEventListener('click', () => {
    usuarioLogado = null;
    openAuthBtn.innerHTML = `👤 Entrar`;
    exibirHome();
});

// ================= ATUALIZAÇÕES DO PERFIL =================
avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            profileImgDisplay.src = event.target.result;
            if (usuarioLogado) usuarioLogado.foto = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

updateProfileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (usuarioLogado) {
        usuarioLogado.nome = document.getElementById('update-name').value;
        usuarioLogado.telefone = document.getElementById('update-phone').value;
        alert("Dados salvos com sucesso!");
        exibirPerfil();
    }
});

function renderizarPedidos() {
    ordersContainer.innerHTML = '';
    const listaDePedidos = pedidosUsuarios[usuarioLogado.email] || [];

    if (listaDePedidos.length === 0) {
        ordersContainer.innerHTML = `<p class="no-orders">Você ainda não realizou compras.</p>`;
        return;
    }

    listaDePedidos.forEach(pedido => {
        const orderHtml = `
            <div class="order-card animate-slide-up">
                <div class="order-header">
                    <span>Pedido #${pedido.id}</span>
                    <span class="status ${pedido.status.toLowerCase()}">${pedido.status}</span>
                </div>
                <div class="order-body">
                    <p>${pedido.itens.join(', ')}</p>
                    <small>Realizado em: ${pedido.data} às ${pedido.hora}</small>
                </div>
            </div>
        `;
        ordersContainer.insertAdjacentHTML('afterbegin', orderHtml);
    });
}

// ================= LÓGICA DO CARRINHO =================
openCartBtn.addEventListener('click', () => cartOverlay.classList.add('active'));
closeCartBtn.addEventListener('click', () => cartOverlay.classList.remove('active'));

cartOverlay.addEventListener('click', (e) => {
    if (e.target === cartOverlay) cartOverlay.classList.remove('active');
});

document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const img = card.dataset.img;

        carrinho.push({ id, name, price, img });
        atualizarCarrinhoTela();

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

document.getElementById('btn-checkout').addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    if (!usuarioLogado) {
        cartOverlay.classList.remove('active');
        exibirModalLoginComAviso("Você precisa estar conectado para fechar o pedido!");
        return;
    }

    const agora = new Date();
    const novoPedido = {
        id: Math.floor(10000 + Math.random() * 90000),
        status: "Processando", 
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: carrinho.map(item => item.name)
    };

    pedidosUsuarios[usuarioLogado.email].push(novoPedido);
    alert(`Compra efetuada com sucesso! Pedido #${novoPedido.id} gerado.`);
    
    carrinho = [];
    atualizarCarrinhoTela();
    cartOverlay.classList.remove('active');
    exibirPerfil();
});