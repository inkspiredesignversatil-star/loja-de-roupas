// Dados Globais da Aplicação
let usuarioLogado = null;
let carrinho = [];

// Histórico de pedidos simulado baseado no usuário ativo
let pedidosUsuarios = {}; 

// Seleção de Páginas Principais
const pageHome = document.getElementById('page-home');
const pageProfile = document.getElementById('page-profile');
const btnHome = document.getElementById('btn-home');
const logoBrand = document.getElementById('logo-brand');

// Componentes do Modal de Login/Cadastro
const authModal = document.getElementById('authModal');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginView = document.getElementById('auth-login-view');
const registerView = document.getElementById('auth-register-view');
const toRegister = document.getElementById('to-register');
const toLogin = document.getElementById('to-login');
const loginAlertMsg = document.getElementById('login-alert-msg');

// Componentes do Carrinho
const cartOverlay = document.getElementById('cartOverlay');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');

// Componentes do Painel de Perfil Avançado
const avatarInput = document.getElementById('avatar-input');
const profileImgDisplay = document.getElementById('profile-img-display');
const updateProfileForm = document.getElementById('updateProfileForm');
const ordersContainer = document.getElementById('orders-container');

// ================= NAVEGAÇÃO ENTRE PRODUTOS E PERFIL =================
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
    
    // Atualiza os dados na tela do perfil
    document.getElementById('profile-user-name').textContent = usuarioLogado.nome;
    document.getElementById('profile-user-email').textContent = usuarioLogado.email;
    document.getElementById('profile-user-phone').textContent = usuarioLogado.telefone || "Sem telefone salvo";
    
    // Alimenta os inputs de edição
    document.getElementById('update-name').value = usuarioLogado.nome;
    document.getElementById('update-phone').value = usuarioLogado.telefone || "";
    
    // Trata a foto do perfil
    if (usuarioLogado.foto) {
        profileImgDisplay.src = usuarioLogado.foto;
    } else {
        profileImgDisplay.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";
    }

    renderizarPedidos();
}

btnHome.addEventListener('click', (e) => { e.preventDefault(); exibirHome(); });
logoBrand.addEventListener('click', exibirHome);

// ================= SISTEMA DE LOGIN / CADASTRO DA CONTA =================
function exibirModalLoginComAviso(mensagem) {
    loginAlertMsg.textContent = message = mensagem;
    loginAlertMsg.classList.add('alert-highlight');
    authModal.classList.add('active');
}

openAuthBtn.addEventListener('click', () => {
    if (usuarioLogado) {
        exibirPerfil();
    } else {
        loginAlertMsg.textContent = "Insira seus dados para entrar.";
        loginAlertMsg.classList.remove('alert-highlight');
        authModal.classList.add('active');
    }
});

closeAuthBtn.addEventListener('click', () => authModal.remove('active'));

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

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    usuarioLogado = {
        nome: document.getElementById('register-name').value,
        email: email,
        telefone: "",
        foto: null
    };
    if (!pedidosUsuarios[email]) pedidosUsuarios[email] = [];
    sucessoAutenticacao();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInformado = document.getElementById('login-email').value;
    usuarioLogado = {
        nome: emailInformado.split('@')[0],
        email: emailInformado,
        telefone: "",
        foto: null
    };
    if (!pedidosUsuarios[emailInformado]) pedidosUsuarios[emailInformado] = [];
    sucessoAutenticacao();
});

function sucessoAutenticacao() {
    openAuthBtn.innerHTML = `👤 Meu Perfil`;
    authModal.classList.remove('active');
    exibirPerfil();
}

document.getElementById('btnLogout').addEventListener('click', () => {
    usuarioLogado = null;
    openAuthBtn.innerHTML = `👤 Entrar`;
    exibirHome();
});

// ================= RECURSOS AVANÇADOS DO PERFIL (FOTO E DADOS) =================
// Alteração Dinâmica da Foto através de Upload Local
avatarInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            profileImgDisplay.src = event.target.result;
            if (usuarioLogado) {
                usuarioLogado.foto = event.target.result; // Salva a string base64 na sessão do usuário
            }
        };
        reader.readAsDataURL(file);
    }
});

// Formulário de Edição de Dados Cadastrais
updateProfileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (usuarioLogado) {
        usuarioLogado.nome = document.getElementById('update-name').value;
        usuarioLogado.telefone = document.getElementById('update-phone').value;
        alert("Dados salvos com sucesso!");
        exibirPerfil();
    }
});

// Renderizador Dinâmico de Pedidos com Correção de Status
function renderizarPedidos() {
    ordersContainer.innerHTML = '';
    const listaDePedidos = pedidosUsuarios[usuarioLogado.email] || [];

    if (listaDePedidos.length === 0) {
        ordersContainer.innerHTML = `<p class="no-orders">Você ainda não realizou compras.</p>`;
        return;
    }

    // Cria os cards dinamicamente baseados nas compras efetuadas
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
        ordersContainer.insertAdjacentHTML('afterbegin', orderHtml); // Novos pedidos aparecem no topo
    });
}

// ================= SISTEMA E LÓGICA DO CARRINHO =================
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

// VALIDAÇÃO CRÍTICA: Bloquear checkout se não houver login ativo
document.getElementById('btn-checkout').addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    // Se NÃO estiver logado, bloqueia!
    if (!usuarioLogado) {
        cartOverlay.classList.remove('active'); // Fecha o carrinho
        exibirModalLoginComAviso("Você precisa estar conectado para fechar o pedido!"); // Abre login informando o motivo
        return;
    }

    // Se estiver logado, processa a compra real e joga no histórico
    const agora = new Date();
    const novoPedido = {
        id: Math.floor(10000 + Math.random() * 90000), // Gera ID aleatório de 5 dígitos
        status: "Processando", // Todo pedido recém-criado inicia em processamento
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        itens: carrinho.map(item => item.name)
    };

    // Insere o pedido diretamente na conta do e-mail ativo
    pedidosUsuarios[usuarioLogado.email].push(novoPedido);

    alert(`Compra efetuada com sucesso! Pedido #${novoPedido.id} gerado.`);
    
    // Limpa carrinho e redireciona direto para ver a compra no perfil
    carrinho = [];
    atualizarCarrinhoTela();
    cartOverlay.classList.remove('active');
    exibirPerfil();
});