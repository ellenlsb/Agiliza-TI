const btnUpload = document.querySelector('.file-upload-btn');
const inputFotos = document.getElementById('fileInput');       // O campo de upload (input type="file")
const feedbackTexto = document.getElementById('fileFeedback');


btnUpload.addEventListener('click', function () {

    inputFotos.click();
});


inputFotos.addEventListener('change', function () {

    feedbackTexto.textContent = '';


    const arquivos = inputFotos.files;

    if (arquivos.length === 0) {
        feedbackTexto.textContent = 'Nenhum arquivo selecionado.';
        feedbackTexto.style.color = '#555'; // Cor padrão
        return;
    }


    const MAX_FOTOS = 5;
    if (arquivos.length > MAX_FOTOS) {
        // Se tiver mais de 5:
        feedbackTexto.textContent = `🛑 Erro: Você só pode anexar no máximo ${MAX_FOTOS} fotos. Você escolheu ${arquivos.length}.`;
        feedbackTexto.style.color = 'red';
        inputFotos.value = '';
        return;
    }


    const TIPOS_ACEITOS = ['image/jpeg', 'image/png'];

    for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];


        if (!TIPOS_ACEITOS.includes(arquivo.type)) {


            feedbackTexto.textContent = `❌ Erro: O arquivo "${arquivo.name}" não é uma foto JPEG ou PNG.`;
            feedbackTexto.style.color = 'red';
            inputFotos.value = '';
        }
    }
    feedbackTexto.textContent = `✅ ${arquivos.length} foto(s) selecionada(s) e prontas para o envio.`;
    feedbackTexto.style.color = 'green';
});

//API
// Endereço da API (Use o seu endereço base!)
const URL_BASE_API = "https://mirkily-unpragmatic-piedad.ngrok-free.dev";
const URL_POST_CHAMADO = URL_BASE_API + "/api/Chamados";

// 1. Encontra as peças do formulário e o Token
const formChamado = document.getElementById('formulario-chamado');
const botaoEnviar = document.getElementById('botao-enviar');
const campoStatus = document.getElementById('mensagem-status');
const token = localStorage.getItem('userToken');
const ID_USUARIO_LOGADO = 1;

// 2. Verifica o login
if (!token) {
    alert("Você precisa estar logado para abrir um chamado.");
    // Redireciona para login (sem a extensão .cshtml)
    window.location.href = 'login';
}


// 3. Adiciona a regra: o que fazer quando o formulário é enviado
formChamado.addEventListener('submit', function (evento) {
    evento.preventDefault();
    botaoEnviar.disabled = true;

    // Pega os dados
    const titulo = document.getElementById('campo-titulo').value;
    const descricao = document.getElementById('campo-descricao').value;
    const idCategoria = parseInt(document.getElementById('campo-categoria').value);

    // 4. Monta o Pacote JSON
    const dadosParaAPI = {
        titulo: titulo,
        descricao: descricao,
        idUsuario: ID_USUARIO_LOGADO,
        idCategoria: idCategoria
    };

    campoStatus.textContent = 'Enviando chamado... ⏳';
    campoStatus.style.color = 'blue';

    // 5. Envia o pacote
    fetch(URL_POST_CHAMADO, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dadosParaAPI)
    })
        .then(resposta => {
            botaoEnviar.disabled = false;
            if (resposta.ok) {
                return resposta.json();
            } else {
                return resposta.json().then(data => {
                    throw new Error(data.message || data.title || 'Erro desconhecido.');
                });
            }
        })
        .then(chamadoCriado => {
            // 6. Se deu certo
            campoStatus.textContent = `✅ Chamado criado com sucesso! ID: ${chamadoCriado.id}`;
            campoStatus.style.color = 'green';

            // Redireciona para a lista após 2 segundos
            setTimeout(() => {
                window.location.href = 'chamados';
            }, 2000);
        })
        .catch(erro => {
            // 7. Se falhar
            botaoEnviar.disabled = false;
            campoStatus.textContent = `❌ Falha: ${erro.message}`;
            campoStatus.style.color = 'red';
            console.error("Erro no POST:", erro);
        });
});