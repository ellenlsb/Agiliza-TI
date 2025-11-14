// Aguarda o carregamento da página antes de rodar o código
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    form.addEventListener("submit", function (event) {
        event.preventDefault(); // impede o envio do formulário padrão

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Regex simples para validar e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validações básicas
        if (email === "" || password === "") {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        if (!emailRegex.test(email)) {
            alert("Digite um e-mail válido.");
            return;
        }

        // Aqui você poderia chamar uma API real, mas vamos simular o login
        const emailCorreto = "usuario@teste.com";
        const senhaCorreta = "Agiliza123@";

        if (email === emailCorreto && password === senhaCorreta) {
            alert("Login realizado com sucesso!");
            window.location.href = "../Dashboard/dashboard.html"; // redireciona
        } else {
            alert("E-mail ou senha incorretos. Tente novamente.");
        }
    });
});

//API

// 1. Encontre as peças do formulário
const formLogin = document.getElementById('formulario-login');
const campoErro = document.getElementById('mensagem-erro');

// 2. Adicione a "Regra" (Listener)
formLogin.addEventListener('submit', function (evento) {
    evento.preventDefault();
    campoErro.style.display = 'none';

    // 3. Pegue os dados
    const email = document.getElementById('campo-email').value;
    const senha = document.getElementById('campo-senha').value;

    // 4. Monta o pacote JSON (CORRIGIDO)
    const dadosParaAPI = {
        email: email,  
        senha: senha  
    };

    // 🛑 5. 
    const URL_LOGIN = "https://mirkily-unpragmatic-piedad.ngrok-free.dev/api/Auth/login";

    // 6. Envia o pacote para a API
    fetch(URL_LOGIN, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosParaAPI)
    })
        .then(resposta => {
            if (resposta.ok) {
                return resposta.json();
            } else {
                // Tenta obter a mensagem de erro da API para ser mais específico
                return resposta.json().then(data => {
                    throw new Error(data.message || data.title || 'Falha na autenticação. E-mail ou senha incorretos.');
                });
            }
        })
        .then(dadosRecebidos => {
            // 7. Pegue a "Chave Secreta" (Token)
            const token = dadosRecebidos.token;

            // 8. Guarde a Chave no navegador
            localStorage.setItem('userToken', token);

            // 9. Mande o usuário para a próxima página
            window.location.href = 'chamados';
        })
        .catch(erro => {
            // 10. Se falhar, mostra o erro na tela
            campoErro.textContent = erro.message;
            campoErro.style.display = 'block';
            console.error("Erro no Login:", erro);
        });
});