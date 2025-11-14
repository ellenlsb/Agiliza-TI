const filtroStatus = document.getElementById('filtroStatus');
const filtroPeriodo = document.getElementById('filtroPeriodo');
const botaoAplicar = document.getElementById('aplicarFiltros');
const corpoTabela = document.getElementById('corpoTabela');
const todasAsLinhas = corpoTabela.getElementsByTagName('tr'); // Todas as linhas de chamado

botaoAplicar.addEventListener('click', function () {

    const statusDesejado = filtroStatus.value;       // Ex: "Aberto" ou "Todos"
    const periodoDesejado = filtroPeriodo.value;     // Ex: "Últimos 30 dias"

    console.log('Filtro aplicado! Status:', statusDesejado, 'Período:', periodoDesejado);

    aplicarFiltrosNaTabela(statusDesejado, periodoDesejado);
});


// 4. A Função Mágica que decide se a linha aparece ou some! ✨
function aplicarFiltrosNaTabela(status, periodo) {
    // É como a porta de um cinema: tem que checar o ingresso de todo mundo!

    // Percorremos cada linha (tr) da tabela
    for (let i = 0; i < todasAsLinhas.length; i++) {
        const linha = todasAsLinhas[i];

        // 4a. Achamos o STATUS e a DATA dessa linha
        // O status está na 3ª coluna (índice 2, já que começamos no zero)
        const statusDaLinha = linha.cells[2].textContent.trim();
        // A data está na 5ª coluna (índice 4)
        const dataDaLinhaTexto = linha.cells[4].textContent.trim();

        // --- Checagem de Status (Regra Fácil) ---
        // Se o filtro não for "Todos" E o status da linha for diferente do desejado:
        let passaNoFiltroStatus = true;
        if (status !== 'Todos' && statusDaLinha !== status) {
            passaNoFiltroStatus = false;
        }

        // --- Checagem de Período (Regra Mais Elaborada) ---
        // Vamos checar se a data está no período.
        // Se a função 'estaNoPeriodo' disser que NÃO:
        let passaNoFiltroPeriodo = estaNoPeriodo(dataDaLinhaTexto, periodo);


        // --- Decisão Final ---
        // Se passar nas DUAS regras (Status e Período):
        if (passaNoFiltroStatus && passaNoFiltroPeriodo) {
            linha.style.display = ''; // Mostra a linha (deixa-a visível)
        } else {
            linha.style.display = 'none'; // Esconde a linha (faz ela sumir)
        }
    }
}


// 5. Ajudante Mágico para checar a Data 📅
// (Essa parte é mais complexa, mas é o coração do filtro de tempo!)
function estaNoPeriodo(dataTexto, filtro) {
    // Se o filtro for "Todos os períodos", passa direto!
    if (filtro === 'Todos os períodos') {
        return true;
    }

    // Transformamos a data de texto (Ex: 15/07/2024) em uma data de verdade para o JS
    // O formato é DD/MM/AAAA, então fazemos um pequeno truque para o JS entender:
    const partes = dataTexto.split('/');
    const dataChamado = new Date(partes[2], partes[1] - 1, partes[0]); // Ano, Mês-1, Dia

    const hoje = new Date();
    let limite = new Date(hoje);

    // Decidimos quantos dias atrás é o limite, como se fosse o "prazo"
    let diasAtras = 0;
    if (filtro === 'Últimos 7 dias') {
        diasAtras = 7;
    } else if (filtro === 'Últimos 30 dias') {
        diasAtras = 30;
    } else if (filtro === 'Últimos 90 dias') {
        diasAtras = 90;
    }

    // Calculamos a data limite: a data de hoje menos os dias de prazo
    limite.setDate(hoje.getDate() - diasAtras);

    // É como perguntar: "A data do chamado é maior (mais recente) que o limite?"
    return dataChamado >= limite;
}

//API

// Endereço da API (Use o seu endereço base!)
const URL_BASE_API = "https://mirkily-unpragmatic-piedad.ngrok-free.dev";
const URL_CHAMADOS = URL_BASE_API + "/api/Chamados";

// 1. Checa o Token e Inicia a Busca
function iniciarBuscaDeChamados() {
    // 🔑 Pega a chave secreta que salvamos no Login
    const token = localStorage.getItem('userToken');

    // 🛑 1.1. Se a chave não existir, manda para o Login
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return window.location.href = 'login';
    }

    // 1.2. Se a chave existe, faz a chamada à API
    buscarChamados(token);
}


// 2. Função principal para chamar a API e obter a lista
function buscarChamados(token) {
    const corpoTabela = document.getElementById('corpo-tabela-chamados');
    if (!corpoTabela) {
        console.error("ID da tabela não encontrado.");
        return;
    }

    // Indica que está carregando
    corpoTabela.innerHTML = '<tr><td colspan="6">Carregando chamados...</td></tr>';

    fetch(URL_CHAMADOS, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // 🔒 O Token é anexado aqui para provar que estamos logados
            'Authorization': 'Bearer ' + token
        }
    })
        .then(resposta => {
            if (!resposta.ok) {
                // Se a API retornar 401 (Token inválido/expirado), forçamos o logout
                if (resposta.status === 401) {
                    localStorage.removeItem('userToken'); // Limpa o token inválido
                    throw new Error("Sessão expirada. Redirecionando para login.");
                }
                throw new Error(`Erro ao carregar dados: Status ${resposta.status}`);
            }
            return resposta.json();
        })
        .then(listaDeChamados => {
            // 3. Se deu certo, preenche a tabela
            preencherTabela(listaDeChamados);
        })
        .catch(erro => {
            console.error("Erro:", erro);
            corpoTabela.innerHTML = `<tr><td colspan="6" style="color:red;">❌ ${erro.message}</td></tr>`;

            // Se a sessão expirou, redireciona após mostrar a mensagem
            if (erro.message.includes("expirada")) {
                setTimeout(() => window.location.href = 'login', 2000);
            }
        });
}


// 3. Função para pegar a lista JSON e montar o HTML da tabela
function preencherTabela(chamados) {
    const corpoTabela = document.getElementById('corpo-tabela-chamados');
    corpoTabela.innerHTML = ''; // Limpa o "Carregando..."

    if (chamados.length === 0) {
        corpoTabela.innerHTML = '<tr><td colspan="6">Nenhum chamado encontrado.</td></tr>';
        return;
    }

    // 💡 Lembre-se: Use os nomes de campos EXATOS que sua API retorna (ex: .titulo, .status, .dataCriacao, etc.)
    chamados.forEach(chamado => {
        const linha = document.createElement('tr');

        // <td> ID
        linha.innerHTML += `<td>${chamado.id || 'N/A'}</td>`;

        // <td> TÍTULO (Primeiras 30 letras)
        linha.innerHTML += `<td>${(chamado.titulo || 'Sem Título').substring(0, 30)}...</td>`;

        // <td> STATUS
        linha.innerHTML += `<td><span class="status-badge">${chamado.status || 'N/A'}</span></td>`;

        // <td> DATA ABERTURA
        linha.innerHTML += `<td>${formatarData(chamado.dataCriacao)}</td>`;

        // <td> PRIORIDADE
        linha.innerHTML += `<td>${chamado.prioridade || 'N/A'}</td>`;

        // <td> AÇÕES (Botão de Ver Detalhes)
        // 🔗 O link aponta para a página 'detalhe' e passa o ID na URL
        linha.innerHTML += `
            <td>
                <a href="detalhe?id=${chamado.id}" class="btn-detalhe">Ver Detalhes</a>
            </td>
        `;

        corpoTabela.appendChild(linha);
    });
}

// Função auxiliar de formatação de data (reutilizada)
function formatarData(dataApi) {
    if (!dataApi) return 'N/A';
    try {
        const dataObj = new Date(dataApi);
        return dataObj.toLocaleDateString('pt-BR');
    } catch (e) {
        return dataApi.substring(0, 10);
    }
}

// 🚦 Inicia o robô quando a página carrega
iniciarBuscaDeChamados();

// Ação para o botão de SAIR
// 1. Encontra o botão Sair no HTML (você usou a classe 'exit-btn')
const exitButton = document.querySelector('.exit-btn');

if (exitButton) {
    exitButton.addEventListener('click', function () {
        // 2. 🔑 Remove a Chave Secreta (Token) do navegador (Faz o Logoff)
        localStorage.removeItem('userToken');

        // 3. 🏠 Redireciona para a página inicial
        // Usamos '/home' pois em projetos Razor Pages, a home geralmente
        // é a página com o nome 'home' (sem a extensão .cshtml)
        window.location.href = 'home';
    });
}