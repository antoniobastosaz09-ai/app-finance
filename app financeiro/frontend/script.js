
const API = 'http://localhost:3000/api';

// ELEMENTOS
const telaLogin = document.getElementById('telaLogin');
const telaCadastro = document.getElementById('telaCadastro');
const dashboard = document.getElementById('dashboard');

let token = localStorage.getItem('token');

// FUNÇÃO PARA REQUISIÇÕES
async function requisicao(endpoint, metodo = 'GET', dados = null) {

    const opcoes = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (token) {
        opcoes.headers.Authorization = `Bearer ${token}`;
    }

    if (dados) {
        opcoes.body = JSON.stringify(dados);
    }

    const resposta = await fetch(API + endpoint, opcoes);

    const resultado = await resposta.json();

    if (!resposta.ok) {
        throw new Error(resultado.mensagem || 'Erro na requisição');
    }

    return resultado;
}

// ALTERNAR TELAS
function mostrarTela(tela) {

    telaLogin.classList.add('hidden');
    telaCadastro.classList.add('hidden');
    dashboard.classList.add('hidden');

    tela.classList.remove('hidden');
}

// IR PARA CADASTRO
document.getElementById('irCadastro').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarTela(telaCadastro);
});

// IR PARA LOGIN
document.getElementById('irLogin').addEventListener('click', (e) => {
    e.preventDefault();
    mostrarTela(telaLogin);
});

// CADASTRAR USUÁRIO
document.getElementById('formCadastro').addEventListener('submit', async (e) => {

    e.preventDefault();

    const mensagem = document.getElementById('mensagemCadastro');

    const dados = {
        nome: document.getElementById('cadastroNome').value,
        email: document.getElementById('cadastroEmail').value,
        senha: document.getElementById('cadastroSenha').value
    };

    try {

        const resultado = await requisicao(
            '/auth/cadastro',
            'POST',
            dados
        );

        mensagem.textContent = resultado.mensagem;
        mensagem.style.color = 'green';

        e.target.reset();

    } catch (erro) {

        mensagem.textContent = erro.message;
        mensagem.style.color = 'red';
    }
});

// LOGIN
document.getElementById('formLogin').addEventListener('submit', async (e) => {

    e.preventDefault();

    const mensagem = document.getElementById('mensagemLogin');

    const dados = {
        email: document.getElementById('loginEmail').value,
        senha: document.getElementById('loginSenha').value
    };

    try {

        const resultado = await requisicao(
            '/auth/login',
            'POST',
            dados
        );

        token = resultado.token;

        localStorage.setItem('token', token);

        mensagem.textContent = resultado.mensagem;

        e.target.reset();

        abrirDashboard();

    } catch (erro) {

        mensagem.textContent = erro.message;
        mensagem.style.color = 'red';
    }
});

// ABRIR DASHBOARD
async function abrirDashboard() {

    mostrarTela(dashboard);

    await carregarDados();
}

// CADASTRAR MOVIMENTAÇÃO
document.getElementById('formMovimentacao').addEventListener('submit', async (e) => {

    e.preventDefault();

    const mensagem = document.getElementById('mensagemFinanceiro');

    const dados = {
        descricao: document.getElementById('descricao').value,
        valor: Number(document.getElementById('valor').value),
        tipo: document.getElementById('tipo').value
    };

    try {

        const resultado = await requisicao(
            '/financeiro/movimentacoes',
            'POST',
            dados
        );

        mensagem.textContent = resultado.mensagem;
        mensagem.style.color = 'green';

        e.target.reset();

        await carregarDados();

    } catch (erro) {

        mensagem.textContent = erro.message;
        mensagem.style.color = 'red';
    }
});

// CARREGAR DADOS FINANCEIROS
async function carregarDados() {

    try {

        const movimentacoes = await requisicao(
            '/financeiro/movimentacoes'
        );

        const resultado = await requisicao(
            '/financeiro/resultado'
        );

        atualizarCards(resultado);

        listarMovimentacoes(movimentacoes);

    } catch (erro) {

        alert(erro.message);

        if (erro.message.toLowerCase().includes('token')) {
            sair();
        }
    }
}

// ATUALIZAR CARDS
function atualizarCards(resultado) {

    const moeda = valor => Number(valor).toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );

    document.getElementById('totalEntradas').textContent =
        moeda(resultado.totalEntradas);

    document.getElementById('totalSaidas').textContent =
        moeda(resultado.totalSaidas);

    document.getElementById('resultadoFinal').textContent =
        moeda(resultado.resultadoFinal);
}

// LISTAR MOVIMENTAÇÕES
function listarMovimentacoes(movimentacoes) {

    const tabela = document.getElementById('listaMovimentacoes');

    tabela.innerHTML = '';

    if (movimentacoes.length === 0) {

        tabela.innerHTML = `
            <tr>
                <td colspan="5">Nenhuma movimentação cadastrada.</td>
            </tr>
        `;

        return;
    }

    movimentacoes.forEach(item => {

        const linha = document.createElement('tr');

        const data = new Date(item.data).toLocaleDateString('pt-BR');

        const valor = Number(item.valor).toLocaleString(
            'pt-BR',
            {
                style: 'currency',
                currency: 'BRL'
            }
        );

        const descricao = document.createElement('td');
        descricao.textContent = item.descricao;

        const tipo = document.createElement('td');
        tipo.textContent = item.tipo;
        tipo.className = item.tipo === 'entrada'
            ? 'tipo-entrada'
            : 'tipo-saida';

        const valorCelula = document.createElement('td');
        valorCelula.textContent = valor;

        const dataCelula = document.createElement('td');
        dataCelula.textContent = data;

        const acao = document.createElement('td');

        const botao = document.createElement('button');

        botao.textContent = 'Excluir';
        botao.className = 'btn-excluir';

        botao.addEventListener('click', () => {
            excluirMovimentacao(item.id);
        });

        acao.appendChild(botao);

        linha.append(
            descricao,
            tipo,
            valorCelula,
            dataCelula,
            acao
        );

        tabela.appendChild(linha);
    });
}

// EXCLUIR MOVIMENTAÇÃO
async function excluirMovimentacao(id) {

    const confirmar = confirm(
        'Deseja realmente excluir esta movimentação?'
    );

    if (!confirmar) return;

    try {

        const resultado = await requisicao(
            `/financeiro/movimentacoes/${id}`,
            'DELETE'
        );

        alert(resultado.mensagem);

        await carregarDados();

    } catch (erro) {

        alert(erro.message);
    }
}

// SAIR DA CONTA
function sair() {

    localStorage.removeItem('token');

    token = null;

    mostrarTela(telaLogin);
}

// BOTÃO SAIR
document.getElementById('btnSair').addEventListener('click', sair);

// VERIFICAR LOGIN AO ABRIR A PÁGINA
if (token) {

    abrirDashboard();

} else {

    mostrarTela(telaLogin);
}
