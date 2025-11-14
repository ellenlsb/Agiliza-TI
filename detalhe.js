// =======================================================
// API
// =======================================================
const URL_BASE_API = "https://mirkily-unpragmatic-piedad.ngrok-free.dev";
const URL_CHAMADOS_BASE = URL_BASE_API + "/api/Chamados/";

// Funções de Busca

// Função para pegar o ID da URL (ex: de detalhe?id=5)
function getIdChamadoDaURL() {
    // Pega tudo que vem depois do '?' (o query string)
    const params = new URLSearchParams(window.location.search);
    // Retorna o valor do parâmetro 'id'
    return params.get('id');
}

// 1. Checa o Token e Inicia a Busca
function iniciarBuscaDetalhe() {
    const idChamado = getIdChamadoDaURL();
    const token = localStorage.getItem('userToken');

    // 🛑 1.1. Verificações de Segurança
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        return window.location.href = 'login';
    }

    if (!idChamado) {
        // Se não tiver ID na URL, mostra erro e para
        document.getElementById('detalhe-titulo').textContent = "ID do Chamado não especificado na URL.";
        document.getElementById('chamado-nao-encontrado').style.display = 'block';
        return;
    }

    // 1.2. Se ID e Token existem, faz a chamada à API
    buscarDetalhesChamado(idChamado, token);
}


// 2. Função principal para chamar a API e obter 1 chamado
function buscarDetalhesChamado(idChamado, token) {
    // 🔗 Monta o endereço: /api/Chamados/ + ID (ex: /api/Chamados/5)
    const URL_DETALHE = URL_CHAMADOS_BASE + idChamado;

    // Atualiza o ID na tela imediatamente
    document.getElementById('detalhe-id').textContent = idChamado;

    fetch(URL_DETALHE, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
        .then(resposta => {
            if (resposta.status === 404) {
                throw new Error("Chamado não encontrado. ID inválido.");
            }
            if (!resposta.ok) {
                if (resposta.status === 401) {
                    localStorage.removeItem('userToken');
                    throw new Error("Sessão expirada. Redirecionando para login.");
                }
                throw new Error(`Erro ao carregar detalhes: Status ${resposta.status}`);
            }
            return resposta.json();
        })
        .then(detalhesChamado => {
            // 3. Se deu certo, preenche o HTML
            preencherDetalhes(detalhesChamado);
        })
        .catch(erro => {
            console.error("Erro:", erro);
            document.getElementById('detalhe-titulo').textContent = `Falha ao carregar`;
            document.getElementById('chamado-nao-encontrado').textContent = `❌ ${erro.message}`;
            document.getElementById('chamado-nao-encontrado').style.display = 'block';

            if (erro.message.includes("expirada")) {
                setTimeout(() => window.location.href = 'login', 2000);
            }
        });
}

// 3. Função para preencher todos os IDs no HTML com os dados
function preencherDetalhes(chamado) {

    // TÍTULO E STATUS (Topo da Página)
    document.getElementById('detalhe-titulo').textContent = `#${chamado.id} - ${chamado.titulo || 'Sem Título'}`;
    document.getElementById('detalhe-status').textContent = chamado.status || 'N/A';

    // Adiciona a classe CSS para a cor do status
    document.getElementById('detalhe-status').className = 'status-badge ' + getStatusClass(chamado.status);

    // DETALHES GERAIS
    document.getElementById('detalhe-id').textContent = chamado.id || 'N/A';
    document.getElementById('detalhe-prioridade').textContent = chamado.prioridade || 'N/A';
    // 💡 OBS: Sua API pode retornar o nome da categoria/tecnico ou apenas um ID. 
    // Adapte este ponto se ela retornar apenas IDs numéricos.
    document.getElementById('detalhe-categoria').textContent = chamado.categoria || 'N/A';
    document.getElementById('detalhe-tecnico').textContent = chamado.tecnicoResponsavel || 'Não Atribuído';
    document.getElementById('detalhe-data-abertura').textContent = formatarData(chamado.dataCriacao);

    // DESCRIÇÃO
    document.getElementById('detalhe-descricao').textContent = chamado.descricao || 'Descrição não fornecida.';
}

// Função auxiliar para formatar a data (reutilizada)
function formatarData(dataApi) {
    if (!dataApi) return 'N/A';
    try {
        const dataObj = new Date(dataApi);
        return dataObj.toLocaleString('pt-BR');
    } catch (e) {
        return dataApi.substring(0, 10);
    }
}

// Função auxiliar para mudar a cor do Status (exemplo)
function getStatusClass(status) {
    if (!status) return 'status-carregando';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('aberto')) return 'status-aberto';
    if (lowerStatus.includes('andamento')) return 'status-andamento';
    if (lowerStatus.includes('fechado')) return 'status-fechado';
    if (lowerStatus.includes('cancelado')) return 'status-cancelado';
    return 'status-carregando';
}

// 🚦 Inicia o robô quando a página carrega
iniciarBuscaDetalhe();

// =======================================================
// Cancelar Chamado
// =======================================================

const botaoCancelar = document.getElementById('botao-cancelar');
// Usamos este ID que criamos antes para mostrar o feedback
const mensagemStatusDetalhe = document.getElementById('chamado-nao-encontrado');

// 1. Adiciona a Regra ao Botão
if (botaoCancelar) {
    botaoCancelar.addEventListener('click', function () {
        const idChamado = getIdChamadoDaURL();

        // Pergunta ao usuário para confirmar a ação
        if (confirm("Tem certeza que deseja cancelar este chamado? Esta ação não pode ser desfeita.")) {
            // Se confirmar, chama a função de envio
            enviarAtualizacaoChamado(idChamado, "Cancelado");
        }
    });
}


// 2. Função para enviar o pacote de atualização para a API
function enviarAtualizacaoChamado(id, novoStatus) {
    const token = localStorage.getItem('userToken');
    const URL_ATUALIZAR = URL_CHAMADOS_BASE + id;

    // O PACOTE JSON: Enviamos APENAS o campo que queremos mudar (o status)
    // 🛑 IMPORTANTE: O nome do campo deve ser EXATAMENTE o que a API espera!
    const dadosParaAPI = {
        // Se a API exigir o ID no corpo
        id: id,
        // O campo que define o novo status
        status: novoStatus
        // Se sua API exigir TODOS os campos, você precisaria carregar todos os dados antes de enviar!
    };

    mensagemStatusDetalhe.textContent = `Enviando pedido de cancelamento...`;
    mensagemStatusDetalhe.style.display = 'block';
    mensagemStatusDetalhe.style.color = 'blue';
    botaoCancelar.disabled = true; // Desabilita o botão para evitar cliques duplos

    fetch(URL_ATUALIZAR, {
        method: 'PUT', // 💡 Use 'PUT' (substitui todo o recurso) ou 'PATCH' (atualiza partes)
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dadosParaAPI)
    })
        .then(resposta => {
            botaoCancelar.disabled = false;
            if (!resposta.ok) {
                return resposta.json().then(data => {
                    throw new Error(data.message || data.title || `Erro ao atualizar. Status: ${resposta.status}`);
                });
            }
            return resposta.json();
        })
        .then(chamadoAtualizado => {
            // Se deu certo: avisa e recarrega a página para mostrar o novo status
            mensagemStatusDetalhe.textContent = `✅ Chamado CANCELADO com sucesso! Recarregando...`;
            mensagemStatusDetalhe.style.color = 'green';

            // Recarrega a página para buscar o novo status na API
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        })
        .catch(erro => {
            // Se falhar
            botaoCancelar.disabled = false;
            mensagemStatusDetalhe.textContent = `❌ Falha ao cancelar: ${erro.message}`;
            mensagemStatusDetalhe.style.color = 'red';
            console.error("Erro no PUT:", erro);
        });
}